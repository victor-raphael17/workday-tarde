<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\Database;
use App\Core\Exceptions\DomainException;
use App\Core\Exceptions\NotFoundException;
use App\Repositories\MedicationRepository;
use App\Repositories\PurchaseOrderRepository;
use App\Repositories\SupplierRepository;

/**
 * Business logic for restocking via purchase orders.
 *
 * The important rule lives in receive(): marking an order received is what adds
 * the ordered units back into medication stock. It runs in a transaction and is
 * idempotent-guarded so the same order can't inflate stock twice.
 */
final class PurchaseOrderService
{
    private const TRANSITIONS = [
        'draft'     => ['submitted', 'cancelled'],
        'submitted' => ['transit', 'received', 'cancelled'],
        'transit'   => ['received', 'cancelled'],
        'received'  => [],
        'cancelled' => [],
    ];

    public function __construct(
        private readonly PurchaseOrderRepository $orders = new PurchaseOrderRepository(),
        private readonly SupplierRepository $suppliers = new SupplierRepository(),
        private readonly MedicationRepository $medications = new MedicationRepository(),
    ) {
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function list(?string $state = null): array
    {
        return array_map([$this, 'present'], $this->orders->all($state));
    }

    /**
     * @return array<string, mixed>
     */
    public function get(int $id): array
    {
        $order = $this->orders->find($id);

        if ($order === null) {
            throw new NotFoundException("Purchase order {$id} not found.");
        }

        return $this->present($order);
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function create(array $input): array
    {
        if ($this->suppliers->find((int) $input['supplier_id']) === null) {
            throw new DomainException("Supplier {$input['supplier_id']} does not exist.");
        }

        $items = $input['items'] ?? [];
        if (!is_array($items) || $items === []) {
            throw new DomainException('A purchase order needs at least one line item.');
        }

        $normalized = $this->normalizeItems($items);

        $id = Database::transaction(function () use ($input, $normalized): int {
            $orderId = $this->orders->insertOrder([
                'code'        => $input['code'] ?? $this->nextCode(),
                'supplier_id' => (int) $input['supplier_id'],
                'state'       => 'draft',
                'expected_at' => $input['expected_at'] ?? null,
            ]);

            foreach ($normalized as $item) {
                $this->orders->insertItem($orderId, $item);
            }

            return $orderId;
        });

        return $this->get($id);
    }

    /**
     * Move an order through its lifecycle. Transitioning to 'received' adds the
     * ordered units into stock.
     *
     * @return array<string, mixed>
     */
    public function transition(int $id, string $target): array
    {
        $order = $this->orders->find($id);
        if ($order === null) {
            throw new NotFoundException("Purchase order {$id} not found.");
        }

        $this->assertTransition((string) $order['state'], $target);

        if ($target === 'received') {
            return $this->receive($order);
        }

        $this->orders->updateState($id, $target);

        return $this->get($id);
    }

    /**
     * @param array<string, mixed> $order
     * @return array<string, mixed>
     */
    private function receive(array $order): array
    {
        Database::transaction(function () use ($order): void {
            foreach ($order['items'] as $item) {
                $this->medications->adjustStock((int) $item['medication_id'], (int) $item['units']);
            }
            $this->orders->markReceived((int) $order['id']);
        });

        return $this->get((int) $order['id']);
    }

    /**
     * @param array<int, mixed> $items
     * @return array<int, array{medication_id: int, units: int, unit_cost: float}>
     */
    private function normalizeItems(array $items): array
    {
        $normalized = [];

        foreach ($items as $i => $item) {
            if (!is_array($item) || !isset($item['medication_id'], $item['units'])) {
                throw new DomainException("Line item #{$i} must include medication_id and units.");
            }

            $medication = $this->medications->find((int) $item['medication_id']);
            if ($medication === null) {
                throw new DomainException("Medication {$item['medication_id']} on line #{$i} does not exist.");
            }

            $units = (int) $item['units'];
            if ($units <= 0) {
                throw new DomainException("Line item #{$i} must order at least 1 unit.");
            }

            $normalized[] = [
                'medication_id' => (int) $item['medication_id'],
                'units'         => $units,
                'unit_cost'     => isset($item['unit_cost']) ? (float) $item['unit_cost'] : (float) $medication['price'],
            ];
        }

        return $normalized;
    }

    private function assertTransition(string $from, string $to): void
    {
        if (!in_array($to, self::TRANSITIONS[$from] ?? [], true)) {
            throw new DomainException("Cannot move a purchase order from '{$from}' to '{$to}'.");
        }
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function present(array $row): array
    {
        if ($row === []) {
            return $row;
        }

        $presented = [
            'id'          => (int) $row['id'],
            'code'        => $row['code'],
            'supplier'    => [
                'id'   => (int) $row['supplier_id'],
                'name' => $row['supplier_name'] ?? null,
            ],
            'state'       => $row['state'],
            'expected_at' => $row['expected_at'],
            'received_at' => $row['received_at'] ?? null,
            'item_count'  => (int) ($row['item_count'] ?? 0),
            'total_units' => (int) ($row['total_units'] ?? 0),
            'total_cost'  => round((float) ($row['total_cost'] ?? 0), 2),
            'created_at'  => $row['created_at'] ?? null,
            'updated_at'  => $row['updated_at'] ?? null,
        ];

        if (isset($row['items'])) {
            $presented['items'] = array_map(static fn (array $item): array => [
                'id'              => (int) $item['id'],
                'medication_id'   => (int) $item['medication_id'],
                'medication_name' => $item['medication_name'],
                'medication_sku'  => $item['medication_sku'],
                'units'           => (int) $item['units'],
                'unit_cost'       => (float) $item['unit_cost'],
                'line_total'      => round((int) $item['units'] * (float) $item['unit_cost'], 2),
            ], $row['items']);
        }

        return $presented;
    }

    private function nextCode(): string
    {
        return 'PO-' . (2000 + $this->orders->nextSequence());
    }
}
