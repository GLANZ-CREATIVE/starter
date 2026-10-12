<?php
/**
 * アセット読み込み関連の関数
 *
 * @package Theme
 */

/**
 * フロントエンドのスタイルとスクリプトを読み込む
 */
function theme_enqueue_assets()
{
  $vite_running = vite_is_running();

  if ($vite_running && !wp_script_is("vite-client", "enqueued")) {
    wp_enqueue_script("vite-client", VITE_DEV_ORIGIN . "/@vite/client", [], null, true);
    wp_script_add_data("vite-client", "type", "module");
  }

  // Vite 起動中は CSS を main.js のモジュールグラフ経由で読み込ませる（HMR を効かせるため）。
  // <link> で静的配信すると Vite の HMR 更新対象外になり、CSS 保存が無反応になる。
  if (!$vite_running) {
    wp_enqueue_style("theme-style", vite_get_asset_url("assets/css/index.css"), [], null);
  }

  wp_enqueue_script("theme-script", vite_get_asset_url("assets/js/main.js"), [], null, true);
  wp_script_add_data("theme-script", "type", "module");
}
add_action("wp_enqueue_scripts", "theme_enqueue_assets");

/**
 * type=module 指定のスクリプトに type 属性を付与する
 *
 * wp_script_add_data($handle, 'type', 'module') では type 属性は出力されないため、
 * その data が付いた全スクリプトを対象に script_loader_tag フィルタで付与する。
 * ハンドルを列挙しないので、ページ別 CSS 等を増やしても修正不要。
 *
 * @param string $tag    生成された script タグ
 * @param string $handle スクリプトハンドル
 * @return string
 */
function theme_script_type_module($tag, $handle)
{
  if ("module" !== wp_scripts()->get_data($handle, "type")) {
    return $tag;
  }

  if (!str_contains($tag, 'type="module"')) {
    $tag = str_replace("<script ", '<script type="module" ', $tag);
  }

  return $tag;
}
add_filter("script_loader_tag", "theme_script_type_module", 10, 2);
