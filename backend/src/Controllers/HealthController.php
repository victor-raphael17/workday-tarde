<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Database;
use App\Core\Request;
use App\Core\Response;

/**
 * Service discovery + health check endpoints.
 */
final class HealthController extends Controller
{
    /** Root: a tiny index describing the API. */
    public function index(Request $request): Response
    {
        return Response::json([
            'name'    => config('app.name'),
            'status'  => 'ok',
            'version' => '1.0.0',
            'docs'    => 'See backend/README.md for the full endpoint reference.',
        ]);
    }

    /** Liveness + database connectivity probe (used by Docker healthcheck). */
    public function health(Request $request): Response
    {
        $database = 'up';

        try {
            Database::connection()->query('SELECT 1');
        } catch (\Throwable) {
            $database = 'down';
        }

        $ok = $database === 'up';

        return Response::json([
            'status'   => $ok ? 'healthy' : 'degraded',
            'database' => $database,
            'time'     => date(DATE_ATOM),
        ], $ok ? 200 : 503);
    }
}
