<?php

/**
 * Front page template
 *
 * @package WPStarter
 */

vite_enqueue_page_style("front-page", "assets/css/pages/front-page.css");

get_header();
?>

<div class="container">
    <p class="lead">WordPress Starter theme with Vite</p>

    <section class="section">
        <h2 class="heading">Heading</h2>
        <img class="image" src="<?php echo esc_url(assets_url("images/600x600.png")); ?>" alt="" width="600" height="600" loading="eager">
    </section>
</div>

<?php get_footer(); ?>
