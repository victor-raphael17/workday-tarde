<?php

declare(strict_types=1);

namespace App\Repositories;

/**
 * Data access for patients. Allergies are stored as a Postgres TEXT[]; we
 * convert to/from a PHP array at this boundary so the rest of the app never
 * sees the array literal syntax.
 */
final class PatientRepository extends Repository
{
    private const COLUMNS = 'id, code, name, dob, phone, plan, allergies, last_visit, created_at, updated_at';

    /**
     * @return array<int, array<string, mixed>>
     */
    public function all(?string $search = null): array
    {
        $sql = 'SELECT ' . self::COLUMNS . ' FROM patients';
        $bindings = [];

        if ($search !== null && $search !== '') {
            $sql .= ' WHERE name ILIKE :search OR code ILIKE :search';
            $bindings['search'] = '%' . $search . '%';
        }

        $sql .= ' ORDER BY name ASC';

        return array_map([$this, 'hydrate'], $this->fetchAll($sql, $bindings));
    }

    /**
     * @return array<string, mixed>|null
     */
    public function find(int $id): ?array
    {
        $row = $this->fetchOne('SELECT ' . self::COLUMNS . ' FROM patients WHERE id = :id', ['id' => $id]);

        return $row === null ? null : $this->hydrate($row);
    }

    /**
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    public function create(array $data): array
    {
        $data['allergies'] = $this->toArrayLiteral($data['allergies'] ?? []);

        $sql = 'INSERT INTO patients (code, name, dob, phone, plan, allergies, last_visit)
                VALUES (:code, :name, :dob, :phone, :plan, :allergies, :last_visit)
                RETURNING ' . self::COLUMNS;

        return $this->hydrate($this->fetchOne($sql, $data) ?? []);
    }

    /**
     * @param array<string, mixed> $data
     * @return array<string, mixed>|null
     */
    public function update(int $id, array $data): ?array
    {
        $columns = ['code', 'name', 'dob', 'phone', 'plan', 'allergies', 'last_visit'];
        $set = [];
        $bindings = ['id' => $id];

        foreach ($columns as $column) {
            if (!array_key_exists($column, $data)) {
                continue;
            }
            $set[] = "{$column} = :{$column}";
            $bindings[$column] = $column === 'allergies' ? $this->toArrayLiteral($data[$column]) : $data[$column];
        }

        if ($set === []) {
            return $this->find($id);
        }

        $sql = 'UPDATE patients SET ' . implode(', ', $set) . ' WHERE id = :id RETURNING ' . self::COLUMNS;
        $row = $this->fetchOne($sql, $bindings);

        return $row === null ? null : $this->hydrate($row);
    }

    public function delete(int $id): bool
    {
        return $this->execute('DELETE FROM patients WHERE id = :id', ['id' => $id]) > 0;
    }

    /**
     * Convert the Postgres array literal (e.g. {Penicillin,"Sulfa drugs"}) into
     * a PHP string[].
     *
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function hydrate(array $row): array
    {
        if (isset($row['allergies'])) {
            $row['allergies'] = $this->fromArrayLiteral((string) $row['allergies']);
        }

        return $row;
    }

    /**
     * @param mixed $values
     */
    private function toArrayLiteral($values): string
    {
        if (!is_array($values)) {
            return '{}';
        }

        $escaped = array_map(static function ($v): string {
            $v = str_replace(['\\', '"'], ['\\\\', '\\"'], (string) $v);
            return '"' . $v . '"';
        }, $values);

        return '{' . implode(',', $escaped) . '}';
    }

    /**
     * @return string[]
     */
    private function fromArrayLiteral(string $literal): array
    {
        $literal = trim($literal, '{}');
        if ($literal === '') {
            return [];
        }

        $items = str_getcsv($literal);

        return array_map(static fn ($v): string => trim((string) $v), $items);
    }
}
