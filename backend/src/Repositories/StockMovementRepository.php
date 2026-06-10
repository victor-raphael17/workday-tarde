<?php

declare(strict_types=1);

namespace App\Repositories;

final class StockMovementRepository extends Repository
{
    public function create(
        int $medicationId,
        int $delta,
        ?string $reason
    ): void {
        $this->execute(
            'INSERT INTO stock_movements (
                medication_id,
                delta,
                reason
            ) VALUES (
                :medication_id,
                :delta,
                :reason
            )',
            [
                'medication_id' => $medicationId,
                'delta' => $delta,
                'reason' => $reason,
            ]
        );
    }
}