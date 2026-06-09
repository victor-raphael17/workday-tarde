<?php

declare(strict_types=1);

namespace App\Services;

use App\Repositories\PrescriptionRepository;
use App\Repositories\SaleRepository;

/**
 * Aggregates the dashboard's at-a-glance figures: today's sales, the dispensing
 * queue, the weekly sales trend, and low-stock / expiry alert counts. It reuses
 * the other services so the alert logic (e.g. derived stock status) stays in one
 * place.
 */
final class DashboardService
{
    public function __construct(
        private readonly SaleRepository $sales = new SaleRepository(),
        private readonly PrescriptionRepository $prescriptions = new PrescriptionRepository(),
        private readonly MedicationService $medications = new MedicationService(),
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function summary(): array
    {
        $today = date('Y-m-d');
        $lowStock = $this->medications->lowStock();
        $expiring = $this->medications->expiringSoon();
        $queue = $this->prescriptions->countsByState();

        return [
            'sales_today' => [
                'total' => round($this->sales->totalForDate($today), 2),
                'count' => $this->sales->countForDate($today),
            ],
            'dispensing_queue' => [
                'new'       => $queue['new'] ?? 0,
                'verifying' => $queue['verifying'] ?? 0,
                'ready'     => $queue['ready'] ?? 0,
                'open'      => ($queue['new'] ?? 0) + ($queue['verifying'] ?? 0) + ($queue['ready'] ?? 0),
            ],
            'alerts' => [
                'low_stock'     => count($lowStock),
                'expiring_soon' => count($expiring),
            ],
            'sales_week'   => $this->sales->dailyTotals(7),
            'low_stock'    => $lowStock,
            'expiring'     => $expiring,
        ];
    }
}
