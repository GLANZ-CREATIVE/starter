<?php
/**
 * Vite関連の関数
 *
 * @package Theme
 */

/** Vite 開発サーバーのオリジン（ブラウザから参照する URL） */
const VITE_DEV_ORIGIN = "http://localhost:3000";

/**
 * Vite 開発サーバーが起動しているか（リクエスト内でキャッシュ）
 *
 * local のみプローブ。wp-env（Docker）からは host.docker.internal 経由でホストの Vite を見る。
 * 起動中は HMR、停止中は dist を使う。
 *
 * @return bool
 */
function vite_is_running()
{
  static $is_running = null;

  if (null !== $is_running) {
    return $is_running;
  }

  if ("local" !== wp_get_environment_type()) {
    $is_running = false;
    return $is_running;
  }

  $port = (int) (parse_url(VITE_DEV_ORIGIN, PHP_URL_PORT) ?: 3000);
  $errno = 0;
  $errstr = "";
  // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged -- 未起動時の接続失敗は想定どおり
  $socket = @fsockopen("host.docker.internal", $port, $errno, $errstr, 0.1);

  if ($socket) {
    // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fclose -- ソケットクローズ
    fclose($socket);
  }

  $is_running = (bool) $socket;
  return $is_running;
}

/**
 * manifest.json の内容をリクエスト内でキャッシュして返す
 *
 * @return array|null パース済みマニフェスト。ファイルが存在しない場合は null
 */
function vite_get_manifest()
{
  static $manifest_content = null;
  static $loaded = false;

  if ($loaded) {
    return $manifest_content;
  }

  $loaded = true;
  $manifest = get_theme_file_path("/dist/.vite/manifest.json");

  if (file_exists($manifest)) {
    // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- ローカルファイル読み込み
    $manifest_content = json_decode(file_get_contents($manifest), true) ?? null;
  }

  return $manifest_content;
}

/**
 * ViteアセットのURLを取得
 *
 * @param string $asset アセットのパス（例: 'assets/css/index.css'）
 * @return string アセットのURL
 */
function vite_get_asset_url($asset)
{
  if (vite_is_running()) {
    return VITE_DEV_ORIGIN . "/" . $asset;
  }

  $manifest_content = vite_get_manifest();

  if (null !== $manifest_content && isset($manifest_content[$asset]["file"])) {
    return get_theme_file_uri("/dist/" . $manifest_content[$asset]["file"]);
  }

  return get_theme_file_uri("/dist/" . $asset);
}

/**
 * ページ別の Vite CSS を読み込む
 *
 * dev（Vite 起動中）: CSS は Vite が ESM として配信するため <link> では解釈できない。
 *   module script として読み込ませ、HMR を有効にする。
 * 本番 / dev 停止中: manifest 経由でハッシュ付き CSS を <link rel=stylesheet> で読む。
 *
 * front-page.php など、テンプレート内で対象ページだけ呼び出して使う。
 *
 * @param string $handle enqueue ハンドル（例: 'front-page'）
 * @param string $asset  src からの相対パス（例: 'assets/css/pages/front-page.css'）
 * @return void
 */
function vite_enqueue_page_style($handle, $asset)
{
  if (vite_is_running()) {
    // dev: Vite dev server から module として読み込む（HMR 対象）
    wp_enqueue_script($handle, VITE_DEV_ORIGIN . "/" . $asset, [], null, true);
    wp_script_add_data($handle, "type", "module");
    return;
  }

  // 本番: manifest からハッシュ付き CSS を <link> で読む
  $manifest_content = vite_get_manifest();

  if (null !== $manifest_content && isset($manifest_content[$asset]["file"])) {
    $url = get_theme_file_uri("/dist/" . $manifest_content[$asset]["file"]);
  } else {
    $url = get_theme_file_uri("/dist/" . $asset);
  }

  wp_enqueue_style($handle, $url, [], null);
}

/**
 * 画像アセットのURLを取得
 *
 * @param string $image_path 画像の相対パス（例: 'assets/images/hero.jpg'）
 * @return string 画像のURL
 */
function vite_get_image_url($image_path)
{
  if (vite_is_running()) {
    return VITE_DEV_ORIGIN . "/" . $image_path;
  }

  $manifest_content = vite_get_manifest();

  if (null !== $manifest_content) {
    foreach ($manifest_content as $key => $entry) {
      if (isset($entry["file"]) && strpos($key, $image_path) !== false) {
        return get_theme_file_uri("/dist/" . $entry["file"]);
      }
    }
  }

  return get_theme_file_uri("/dist/" . $image_path);
}

/**
 * テンプレートディレクトリURIの短縮関数（src/assets/まで）
 *
 * 画像は Vite パイプライン経由。起動中は dev server、停止中 / 本番は manifest（WebP）を返す。
 * 画像以外は src/assets/ から直接配信。
 *
 * @param string $path アセットの相対パス（例: 'images/top/img-mv.png'）
 *                     空文字列の場合はベースURL（/src/assets）を返す
 * @return string アセットのURL
 *
 * @example
 * assets_url('images/top/img-mv.png')
 * // => Vite 起動中: 'http://localhost:3000/assets/images/top/img-mv.png'
 * // => Vite 停止中 / 本番: '.../dist/assets/img-mv-abc123.webp'
 *
 * assets_url('css/custom.css')
 * // => '/wp-content/themes/theme/src/assets/css/custom.css'
 */
function assets_url($path = "")
{
  if (empty($path)) {
    return get_template_directory_uri() . "/src/assets";
  }

  $normalized_path = ltrim($path, "/");
  $image_extensions = ["jpg", "jpeg", "png", "gif", "webp", "svg", "avif", "tiff"];
  $path_lower = strtolower($normalized_path);

  foreach ($image_extensions as $ext) {
    if (str_ends_with($path_lower, "." . $ext)) {
      return vite_get_image_url("assets/" . $normalized_path);
    }
  }

  return get_template_directory_uri() . "/src/assets/" . $normalized_path;
}
