<?php

declare(strict_types=1);

namespace App\Repositories;

/**
 * Data access for point-of-sale sales and their line items.
 */
final class SaleRepository extends Repository
{
    private const COLUMNS = 'id, code, patient_id, subtotal, tax, total, payment_method, state, created_at, updated_at';

    /**
     * @return array<int, array<string, mixed>>
     */
    public function all(?string $state = null): array
    {
        $sql = 'SELECT ' . self::COLUMNS . ' FROM sales';
        $bindings = [];

        if ($state !== null && $state !== '') {
            $sql .= ' WHERE state = :state';
            $bindings['state'] = $state;
        }

        $sql .= ' ORDER BY created_at DESC';

        return $this->fetchAll($sql, $bindings);
    }

    /**
     * @return array<string, mixed>|null
     */
    public function find(int $id): ?array
    {
        $sale = $this->fetchOne('SELECT ' . self::COLUMNS . ' FROM sales WHERE id = :id', ['id' => $id]);

        if ($sale === null) {
            return null;
        }

        $sale['items'] = $this->items($id);

        return $sale;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function items(int $saleId): array
    {
        return $this->fetchAll(
            'SELECT si.id, si.medication_id, si.quantity, si.unit_price,
                    m.name AS medication_name, m.sku AS medication_sku
             FROM sale_items si
             JOIN medications m ON m.id = si.medication_id
             WHERE si.sale_id = :sale_id
             ORDER BY si.id',
            ['sale_id' => $saleId]
        );
    }

    /**
     * Insert a sale header and return its new id.
     *
     * @param array<string, mixed> $data
     */
    public function insertSale(array $data): int
    {
        $sql = 'INSERT INTO sales (code, patient_id, subtotal, tax, total, payment_method, state)
                VALUES (:code, :patient_id, :subtotal, :tax, :total, :payment_method, :state)
                RETURNING id';

        return (int) ($this->fetchOne($sql, $data)['id'] ?? 0);
    }

    /**
     * @param array{medication_id: int, quantity: int, unit_price: float} $item
     */
    public function insertItem(int $saleId, array $item): void
    {
        $this->execute(
            'INSERT INTO sale_items (sale_id, medication_id, quantity, unit_price)
             VALUES (:sale_id, :medication_id, :quantity, :unit_price)',
            ['sale_id' => $saleId] + $item
        );
    }

    public function markVoided(int $id): void
    {
        $this->execute("UPDATE sales SET state = 'voided' WHERE id = :id", ['id' => $id]);
    }

    public function nextSequence(): int
    {
        return (int) ($this->fetchOne("SELECT COALESCE(MAX(id), 0) + 1 AS n FROM sales")['n'] ?? 1);
    }

    /**
     * Total of completed sales for a given calendar date (defaults to today).
     */
    public function totalForDate(string $date): float
    {
        $row = $this->fetchOne(
            "SELECT COALESCE(SUM(total), 0) AS total
             FROM sales
             WHERE state = 'completed' AND created_at::date = :date",
            ['date' => $date]
        );

        return (float) ($row['total'] ?? 0);
    }

    public function countForDate(string $date): int
    {
        $row = $this->fetchOne(
            "SELECT COUNT(*) AS n FROM sales WHERE state = 'completed' AND created_at::date = :date",
            ['date' => $date]
        );

        return (int) ($row['n'] ?? 0);
    }

    /**
     * Daily completed-sales totals for the last $days days (oldest first).
     *
     * @return array<int, array{date: string, total: float}>
     */
    public function dailyTotals(int $days): array
    {
        $rows = $this->fetchAll(
            "SELECT created_at::date AS date, SUM(total) AS total
             FROM sales
             WHERE state = 'completed' AND created_at >= (CURRENT_DATE - (:days::int - 1))
             GROUP BY created_at::date
             ORDER BY created_at::date",
            ['days' => $days]
        );

        return array_map(
            static fn (array $r): array => ['date' => (string) $r['date'], 'total' => (float) $r['total']],
            $rows
        );
    }
}
