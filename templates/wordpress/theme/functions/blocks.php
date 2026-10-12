<?php

/**
 * カスタムブロックの自動登録
 *
 * theme/blocks/build/{block-name}/block.json を走査し、
 * 見つかったブロックを自動で register_block_type する。
 *
 * @package WPStarter
 */

add_action("init", function () {
  $blocks_dir = get_theme_file_path("/blocks");
  $block_jsons = glob($blocks_dir . "/build/*/block.json");

  if (!$block_jsons) {
    return;
  }

  foreach ($block_jsons as $block_json) {
    register_block_type(dirname($block_json));
  }
});
