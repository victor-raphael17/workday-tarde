<?php

/**
 * Lightweight PSR-4 autoloader (fallback for when Composer's vendor/ is absent).
 *
 * The project has no third-party runtime dependencies, so this is enough to run
 * the whole API without a `composer install`. When Composer *is* present, the
 * front controller prefers its optimized autoloader instead.
 */

declare(strict_types=1);

spl_autoload_register(static function (string $class): void {
    $prefix = 'App\\';
    $baseDir = __DIR__ . '/';

    if (!str_starts_with($class, $prefix)) {
        return;
    }

    $relative = substr($class, strlen($prefix));
    $file = $baseDir . str_replace('\\', '/', $relative) . '.php';

    if (is_file($file)) {
        require $file;
    }
});

// Global helper functions (mirrors composer.json's "files" autoload).
require __DIR__ . '/Support/helpers.php';
