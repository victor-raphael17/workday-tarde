<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Request;
use App\Core\Response;
use App\Services\DashboardService;

/**
 * HTTP endpoint for the dashboard's aggregated metrics.
 */
final class DashboardController extends Controller
{
    public function __construct(
        private readonly DashboardService $dashboard = new DashboardService(),
    ) {
    }

    public function summary(Request $request): Response
    {
        return Response::ok($this->dashboard->summary());
    }
}
