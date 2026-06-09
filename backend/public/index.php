<?php

/**
 * CA Pharmacy API — front controller.
 *
 * Every HTTP request is routed through this single entry point (see the
 * .htaccess rewrite). It loads the Composer autoloader and hands control to
 * the application kernel.
 */

declare(strict_types=1);

$composerAutoload = dirname(__DIR__) . '/vendor/autoload.php';

if (is_file($composerAutoload)) {
    require $composerAutoload;
} else {
    // No `composer install` run — fall back to the bundled PSR-4 autoloader.
    require dirname(__DIR__) . '/src/autoload.php';
}

(new App\Core\App())->run();
