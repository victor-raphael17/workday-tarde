<?php

declare(strict_types=1);

namespace App\Repositories;

/**
 * Data access for the medications (stock catalogue) table.
 */
final class MedicationRepository extends Repository
{
    private const COLUMNS = 'id, sku, name, strength, form, category, on_hand, reorder_point, '
        . 'price, expiry, controlled, recalled, created_at, updated_at';

    /**
     * @param array{search?: string, category?: string, controlled?: bool} $filters
     * @return array<int, array<string, mixed>>
     */
    public function all(array $filters = []): array
    {
        $sql = 'SELECT ' . self::COLUMNS . ' FROM medications';
        $where = [];
        $bindings = [];

        if (!empty($filters['search'])) {
            $where[] = '(name ILIKE :search OR sku ILIKE :search)';
            $bindings['search'] = '%' . $filters['search'] . '%';
        }

        if (!empty($filters['category'])) {
            $where[] = 'category = :category';
            $bindings['category'] = $filters['category'];
        }

        if (array_key_exists('controlled', $filters)) {
            $where[] = 'controlled = :controlled';
            $bindings['controlled'] = $filters['controlled'] ? 'true' : 'false';
        }

        if ($where !== []) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }

        $sql .= ' ORDER BY name ASC';

        return $this->fetchAll($sql, $bindings);
    }

    /**
     * @return array<string, mixed>|null
     */
    public function find(int $id): ?array
    {
        return $this->fetchOne('SELECT ' . self::COLUMNS . ' FROM medications WHERE id = :id', ['id' => $id]);
    }

    /**
     * @return array<string, mixed>|null
     */
    public function findBySku(string $sku): ?array
    {
        return $this->fetchOne('SELECT ' . self::COLUMNS . ' FROM medications WHERE sku = :sku', ['sku' => $sku]);
    }

    /**
     * Items at or below their reorder point (excludes out-of-stock-only filter).
     *
     * @return array<int, array<string, mixed>>
     */
    public function belowReorderPoint(): array
    {
        return $this->fetchAll(
            'SELECT ' . self::COLUMNS . ' FROM medications WHERE on_hand <= reorder_point ORDER BY (on_hand - reorder_point) ASC'
        );
    }

    /**
     * Items expiring on or before the given date (and not yet expired-out).
     *
     * @return array<int, array<string, mixed>>
     */
    public function expiringBefore(string $date): array
    {
        return $this->fetchAll(
            'SELECT ' . self::COLUMNS . ' FROM medications WHERE expiry IS NOT NULL AND expiry <= :date ORDER BY expiry ASC',
            ['date' => $date]
        );
    }

    /**
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    public function create(array $data): array
    {
        $sql = 'INSERT INTO medications (sku, name, strength, form, category, on_hand, reorder_point, price, expiry, controlled)
                VALUES (:sku, :name, :strength, :form, :category, :on_hand, :reorder_point, :price, :expiry, :controlled)
                RETURNING ' . self::COLUMNS;

        return $this->fetchOne($sql, $data) ?? [];
    }

    /**
     * @param array<string, mixed> $data
     * @return array<string, mixed>|null
     */
    public function update(int $id, array $data): ?array
    {
        $columns = ['sku', 'name', 'strength', 'form', 'category', 'on_hand', 'reorder_point', 'price', 'expiry', 'controlled', 'recalled'];
        $set = [];

        foreach ($columns as $column) {
            if (array_key_exists($column, $data)) {
                $set[] = "{$column} = :{$column}";
            }
        }

        if ($set === []) {
            return $this->find($id);
        }

        $data['id'] = $id;
        $sql = 'UPDATE medications SET ' . implode(', ', $set) . ' WHERE id = :id RETURNING ' . self::COLUMNS;

        return $this->fetchOne($sql, array_intersect_key($data, array_flip([...$columns, 'id'])));
    }

    /**
     * Atomically adjust on-hand quantity by a (signed) delta, never below zero.
     * Returns the updated row, or null if the row is missing or the adjustment
     * would drive stock negative.
     *
     * @return array<string, mixed>|null
     */
    public function adjustStock(int $id, int $delta): ?array
    {
        $sql = 'UPDATE medications SET on_hand = on_hand + :delta
                WHERE id = :id AND on_hand + :delta >= 0
                RETURNING ' . self::COLUMNS;

        return $this->fetchOne($sql, ['id' => $id, 'delta' => $delta]);
    }

    public function delete(int $id): bool
    {
        return $this->execute('DELETE FROM medications WHERE id = :id', ['id' => $id]) > 0;
    }

    /**
     * @return string[]
     */
    public function categories(): array
    {
        $rows = $this->fetchAll('SELECT DISTINCT category FROM medications WHERE category IS NOT NULL ORDER BY category');

        return array_map(static fn (array $r): string => (string) $r['category'], $rows);
    }
}
