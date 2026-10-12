<?php
/**
 * Helper functions
 *
 * @package Theme
 */

/**
 * パブリックディレクトリ（テーマルート）のファイルURLを取得
 *
 * @param string $file ファイル名または相対パス（例: 'ogp.png'）
 * @return string ファイルのURL
 */
function public_url($file = "")
{
  if (empty($file)) {
    return get_template_directory_uri();
  }

  $normalized_path = ltrim($file, "/");
  return get_template_directory_uri() . "/" . $normalized_path;
}
