<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Core\Database;
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
