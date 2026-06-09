<?php

/**
 * Application configuration.
 *
 * Values are resolved from environment variables (injected by Docker / the
 * shell) with sensible local-development defaults. Never hard-code secrets here.
 */

declare(strict_types=1);

use App\Support\Env;

return [
    'app' => [
        'name'  => Env::get('APP_NAME', 'CA Pharmacy API'),
        'env'   => Env::get('APP_ENV', 'local'),
        'debug' => Env::bool('APP_DEBUG', true),
        // Sales tax applied at point of sale, as a fraction (e.g. 0.08 = 8%).
        'tax_rate' => (float) Env::get('TAX_RATE', '0'),
    ],

    'auth' => [
        // How long a sign-in session (bearer token) stays valid, in seconds.
        'session_ttl' => (int) Env::get('AUTH_SESSION_TTL', (string) (12 * 60 * 60)),
    ],

    'db' => [
        'host'     => Env::get('DB_HOST', 'db'),
        'port'     => Env::get('DB_PORT', '5432'),
        'database' => Env::get('DB_DATABASE', 'ca_pharmacy'),
        'username' => Env::get('DB_USERNAME', 'ca_pharmacy'),
        'password' => Env::get('DB_PASSWORD', 'ca_pharmacy'),
    ],
];
