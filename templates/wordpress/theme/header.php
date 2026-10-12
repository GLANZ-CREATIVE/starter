<?php
/**
 * Header template
 *
 * @package WPStarter
 */
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>

<head>
    <meta charset="<?php bloginfo("charset"); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">


    <!-- Title & OGP -->
    <?php
    $site_name = get_bloginfo("name");

    // Title
    $page_title = $site_name;
    if (is_singular() && !is_front_page()) {
      $page_title = get_the_title() . " | " . $site_name;
    }

    // OGP Title
    $ogp_title = $site_name;
    if (is_singular() && !is_front_page()) {
      $ogp_title = get_the_title() . " | " . $site_name;
    }
    ?>
    <title><?php echo esc_html($page_title); ?></title>

    <!-- OGP Meta -->
    <?php
    // Description
    $meta_description = get_bloginfo("description");
    if (is_singular()) {
      $excerpt = get_the_excerpt();
      if ($excerpt) {
        $meta_description = wp_strip_all_tags($excerpt);
      }
    }

    // Canonical URL
    $canonical_url = get_pagenum_link(get_query_var("paged"));
    if (is_singular()) {
      $canonical_url = get_permalink();
    }

    // Type
    $ogp_type = is_front_page() || is_home() ? "website" : "article";
    ?>
    <meta name="description" content="<?php echo esc_attr($meta_description); ?>" />
    <meta property="og:url" content="<?php echo esc_url($canonical_url); ?>" />
    <meta property="og:type" content="<?php echo esc_attr($ogp_type); ?>" />
    <meta property="og:title" content="<?php echo esc_attr($ogp_title); ?>" />
    <meta property="og:description" content="<?php echo esc_attr($meta_description); ?>" />
    <meta property="og:site_name" content="<?php echo esc_attr($site_name); ?>" />
    <meta property="og:image" content="<?php echo esc_url(public_url("ogp.png")); ?>">

    <!-- Robots -->
    <?php if (is_404()): ?>
        <meta name="robots" content="noindex, nofollow">
    <?php endif; ?>

    <?php wp_head(); ?>
</head>

<?php
$body_id = "page";
if (is_front_page() || is_home()) {
  $body_id = "front-page";
} elseif (is_singular()) {
  $post_obj = get_post();
  if ($post_obj) {
    $slug = $post_obj->post_name;
    $post_type_obj = $post_obj->post_type;
    $body_id = $post_type_obj . "-" . $slug;
  }
} elseif (is_post_type_archive()) {
  $pt = get_query_var("post_type");
  if (is_array($pt)) {
    $pt = reset($pt);
  }
  $body_id = "archive-" . ($pt ? $pt : "post");
} elseif (is_category() || is_tag() || is_tax()) {
  $queried_term = get_queried_object();
  if ($queried_term instanceof WP_Term) {
    $body_id = "term-" . $queried_term->taxonomy . "-" . $queried_term->slug;
  }
} elseif (is_search()) {
  $body_id = "search";
} elseif (is_404()) {
  $body_id = "not-found";
}
?>

<body data-type="<?php echo esc_attr(wp_get_environment_type()); ?>" id="<?php echo esc_attr($body_id); ?>" <?php body_class(); ?>>
    <?php wp_body_open(); ?>

    <header>
        <div>
            <?php if (is_front_page() && is_home()): ?>
                <h1><a href="<?php echo esc_url(home_url("/")); ?>"><?php bloginfo("name"); ?></a></h1>
            <?php else: ?>
                <p><a href="<?php echo esc_url(home_url("/")); ?>"><?php bloginfo("name"); ?></a></p>
            <?php endif; ?>
        </div>
    </header>