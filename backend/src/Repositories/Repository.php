<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Core\Database;
use App\Support\Pagination;
use PDO;

/**
 * Base repository: shares the PDO connection and a handful of small query
 * helpers so concrete repositories stay focused on their table's SQL.
 */
abstract class Repository
{
    protected PDO $db;

    public function __construct()
    {
        $this->db = Database::connection();
    }

    /**
     * Fetch a single row or null.
     *
     * @param array<string, mixed> $bindings
     * @return array<string, mixed>|null
     */
    protected function fetchOne(string $sql, array $bindings = []): ?array
    {
        $stmt = $this->db->prepare($sql);
        $stmt->execute($bindings);
        $row = $stmt->fetch();

        return $row === false ? null : $row;
    }

    /**
     * Fetch all matching rows.
     *
     * @param array<string, mixed> $bindings
     * @return array<int, array<string, mixed>>
     */
    protected function fetchAll(string $sql, array $bindings = []): array
    {
        $stmt = $this->db->prepare($sql);
        $stmt->execute($bindings);

        return $stmt->fetchAll();
    }

    /**
     * Fetch one page of rows and the pagination metadata for a matching count query.
     *
     * @param array<string, mixed> $bindings
     * @return array{items: array<int, array<string, mixed>>, pagination: array<string, int>}
     */
    protected function paginate(
        string $itemsSql,
        string $countSql,
        array $bindings,
        Pagination $pagination
    ): array {
        $total = (int) ($this->fetchOne($countSql, $bindings)['total'] ?? 0);

        $items = $this->fetchAll(
            $itemsSql . ' LIMIT :limit OFFSET :offset',
            [
                ...$bindings,
                'limit'  => $pagination->perPage,
                'offset' => $pagination->offset(),
            ]
        );

        return [
            'items'      => $items,
            'pagination' => $pagination->meta($total),
        ];
    }

    /**
     * Run a write statement and return the number of affected rows.
     *
     * @param array<string, mixed> $bindings
     */
    protected function execute(string $sql, array $bindings = []): int
    {
        $stmt = $this->db->prepare($sql);
        $stmt->execute($bindings);

        return $stmt->rowCount();
    }
}
