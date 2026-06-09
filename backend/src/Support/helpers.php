<?php

declare(strict_types=1);

use App\Core\Config;

if (!function_exists('config')) {
    /**
     * Read a configuration value using dot notation, e.g. config('db.host').
     */
    function config(string $key, mixed $default = null): mixed
    {
        return Config::get($key, $default);
    }
}

if (!function_exists('base_path')) {
    /**
     * Absolute path to a file/dir relative to the application root.
     */
    function base_path(string $path = ''): string
    {
        $root = dirname(__DIR__, 2);

        return $path === '' ? $root : $root . DIRECTORY_SEPARATOR . ltrim($path, '/');
    }
}
