<?php
/**
 * Force WordPress to send mail via Mailpit in local environment.
 */

if (defined("WP_ENVIRONMENT_TYPE") && WP_ENVIRONMENT_TYPE === "local") {
  add_action("phpmailer_init", function ($phpmailer) {
    $phpmailer->isSMTP();
    $phpmailer->Host = "host.docker.internal";
    $phpmailer->Port = 1025;
    $phpmailer->SMTPAuth = false;
    $phpmailer->SMTPSecure = "";

    if (empty($phpmailer->From)) {
      $phpmailer->From = "no-reply@example.test";
    }
    if (empty($phpmailer->FromName)) {
      $phpmailer->FromName = "Local WP";
    }
  });
}
