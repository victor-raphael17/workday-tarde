<?php

declare(strict_types=1);

namespace App\Repositories;

/**
 * Data access for suppliers.
 */
final class SupplierRepository extends Repository
{
    private const COLUMNS = 'id, name, contact_email, phone, created_at, updated_at';

    /**
     * @return array<int, array<string, mixed>>
     */
    public function all(): array
    {
        return $this->fetchAll('SELECT ' . self::COLUMNS . ' FROM suppliers ORDER BY name ASC');
    }

    /**
     * @return array<string, mixed>|null
     */
    public function find(int $id): ?array
    {
        return $this->fetchOne('SELECT ' . self::COLUMNS . ' FROM suppliers WHERE id = :id', ['id' => $id]);
    }

    /**
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    public function create(array $data): array
    {
        $sql = 'INSERT INTO suppliers (name, contact_email, phone)
                VALUES (:name, :contact_email, :phone)
                RETURNING ' . self::COLUMNS;

        return $this->fetchOne($sql, $data) ?? [];
    }

    /**
     * @param array<string, mixed> $data
     * @return array<string, mixed>|null
     */
    public function update(int $id, array $data): ?array
    {
        $columns = ['name', 'contact_email', 'phone'];
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
        $sql = 'UPDATE suppliers SET ' . implode(', ', $set) . ' WHERE id = :id RETURNING ' . self::COLUMNS;

        return $this->fetchOne($sql, array_intersect_key($data, array_flip([...$columns, 'id'])));
    }

    public function delete(int $id): bool
    {
        return $this->execute('DELETE FROM suppliers WHERE id = :id', ['id' => $id]) > 0;
    }
}
