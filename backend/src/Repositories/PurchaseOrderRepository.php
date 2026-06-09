<?php

declare(strict_types=1);

namespace App\Repositories;

/**
 * Data access for purchase orders (restocking) and their line items. List rows
 * include derived aggregates (item count, total units, total cost) computed in
 * SQL so the client doesn't have to fetch items just to render a summary.
 */
final class PurchaseOrderRepository extends Repository
{
    private const LIST_SELECT = "SELECT
            po.id, po.code, po.supplier_id, po.state, po.expected_at, po.received_at,
            po.created_at, po.updated_at,
            s.name AS supplier_name,
            COUNT(poi.id) AS item_count,
            COALESCE(SUM(poi.units), 0) AS total_units,
            COALESCE(SUM(poi.units * poi.unit_cost), 0) AS total_cost
        FROM purchase_orders po
        JOIN suppliers s ON s.id = po.supplier_id
        LEFT JOIN purchase_order_items poi ON poi.purchase_order_id = po.id";

    /**
     * @return array<int, array<string, mixed>>
     */
    public function all(?string $state = null): array
    {
        $sql = self::LIST_SELECT;
        $bindings = [];

        if ($state !== null && $state !== '') {
            $sql .= ' WHERE po.state = :state';
            $bindings['state'] = $state;
        }

        $sql .= ' GROUP BY po.id, s.name ORDER BY po.created_at DESC';

        return $this->fetchAll($sql, $bindings);
    }

    /**
     * @return array<string, mixed>|null
     */
    public function find(int $id): ?array
    {
        $order = $this->fetchOne(self::LIST_SELECT . ' WHERE po.id = :id GROUP BY po.id, s.name', ['id' => $id]);

        if ($order === null) {
            return null;
        }

        $order['items'] = $this->items($id);

        return $order;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function items(int $orderId): array
    {
        return $this->fetchAll(
            'SELECT poi.id, poi.medication_id, poi.units, poi.unit_cost,
                    m.name AS medication_name, m.sku AS medication_sku
             FROM purchase_order_items poi
             JOIN medications m ON m.id = poi.medication_id
             WHERE poi.purchase_order_id = :id
             ORDER BY poi.id',
            ['id' => $orderId]
        );
    }

    /**
     * @param array<string, mixed> $data
     */
    public function insertOrder(array $data): int
    {
        $sql = 'INSERT INTO purchase_orders (code, supplier_id, state, expected_at)
                VALUES (:code, :supplier_id, :state, :expected_at)
                RETURNING id';

        return (int) ($this->fetchOne($sql, $data)['id'] ?? 0);
    }

    /**
     * @param array{medication_id: int, units: int, unit_cost: float} $item
     */
    public function insertItem(int $orderId, array $item): void
    {
        $this->execute(
            'INSERT INTO purchase_order_items (purchase_order_id, medication_id, units, unit_cost)
             VALUES (:purchase_order_id, :medication_id, :units, :unit_cost)',
            ['purchase_order_id' => $orderId] + $item
        );
    }

    public function markReceived(int $id): void
    {
        $this->execute(
            "UPDATE purchase_orders SET state = 'received', received_at = now() WHERE id = :id",
            ['id' => $id]
        );
    }

    public function updateState(int $id, string $state): void
    {
        $this->execute('UPDATE purchase_orders SET state = :state WHERE id = :id', ['id' => $id, 'state' => $state]);
    }

    public function nextSequence(): int
    {
        return (int) ($this->fetchOne('SELECT COALESCE(MAX(id), 0) + 1 AS n FROM purchase_orders')['n'] ?? 1);
    }
}
