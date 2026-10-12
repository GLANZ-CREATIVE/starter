<?php

/**
 * Theme functions and definitions
 *
 * @package WPStarter
 */

// ヘルパー関数を読み込む
require_once get_template_directory() . "/functions/helper.php";

// Vite関連の関数を読み込む
require_once get_template_directory() . "/functions/vite.php";

// アセット読み込み関連の関数を読み込む
require_once get_template_directory() . "/functions/assets.php";

// カスタムブロックの自動登録
require_once get_template_directory() . "/functions/blocks.php";

add_action("phpmailer_init", function ($phpmailer) {
  if ("local" !== wp_get_environment_type()) {
    return;
  }
  $phpmailer->isSMTP();
  // phpcs:disable WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase -- PHPMailer の公開プロパティ
  $phpmailer->Host = "host.docker.internal";
  $phpmailer->Port = 1025;
  $phpmailer->SMTPAuth = false;
  $phpmailer->SMTPSecure = "";
  // phpcs:enable
});
