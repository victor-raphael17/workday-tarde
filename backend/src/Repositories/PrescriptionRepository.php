<?php

declare(strict_types=1);

namespace App\Repositories;

/**
 * Data access for prescriptions. Reads join patient and medication so the API
 * can return human-readable names alongside the foreign keys.
 */
final class PrescriptionRepository extends Repository
{
    private const SELECT = 'SELECT
            p.id, p.code, p.patient_id, p.medication_id, p.quantity, p.unit,
            p.prescriber, p.state, p.flag, p.created_at, p.updated_at,
            pt.name AS patient_name, pt.code AS patient_code,
            m.name AS medication_name, m.strength AS medication_strength,
            m.controlled AS medication_controlled
        FROM prescriptions p
        JOIN patients pt ON pt.id = p.patient_id
        JOIN medications m ON m.id = p.medication_id';

    /**
     * @param array{state?: string, patient_id?: int} $filters
     * @return array<int, array<string, mixed>>
     */
    public function all(array $filters = []): array
    {
        $sql = self::SELECT;
        $where = [];
        $bindings = [];

        if (!empty($filters['state'])) {
            $where[] = 'p.state = :state';
            $bindings['state'] = $filters['state'];
        }

        if (!empty($filters['patient_id'])) {
            $where[] = 'p.patient_id = :patient_id';
            $bindings['patient_id'] = $filters['patient_id'];
        }

        if ($where !== []) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }

        $sql .= ' ORDER BY p.created_at DESC';

        return $this->fetchAll($sql, $bindings);
    }

    /**
     * @return array<string, mixed>|null
     */
    public function find(int $id): ?array
    {
        return $this->fetchOne(self::SELECT . ' WHERE p.id = :id', ['id' => $id]);
    }

    /**
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    public function create(array $data): array
    {
        $sql = 'INSERT INTO prescriptions (code, patient_id, medication_id, quantity, unit, prescriber, state, flag)
                VALUES (:code, :patient_id, :medication_id, :quantity, :unit, :prescriber, :state, :flag)
                RETURNING id';

        $id = (int) ($this->fetchOne($sql, $data)['id'] ?? 0);

        return $this->find($id) ?? [];
    }

    /**
     * @return array<string, mixed>|null
     */
    public function updateState(int $id, string $state): ?array
    {
        $row = $this->fetchOne(
            'UPDATE prescriptions SET state = :state WHERE id = :id RETURNING id',
            ['id' => $id, 'state' => $state]
        );

        return $row === null ? null : $this->find($id);
    }

    /**
     * @return array<string, int> state => count
     */
    public function countsByState(): array
    {
        $rows = $this->fetchAll('SELECT state, COUNT(*) AS total FROM prescriptions GROUP BY state');
        $counts = [];

        foreach ($rows as $row) {
            $counts[(string) $row['state']] = (int) $row['total'];
        }

        return $counts;
    }
}
