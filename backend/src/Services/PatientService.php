<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\Exceptions\NotFoundException;
use App\Repositories\PatientRepository;
use App\Repositories\PrescriptionRepository;

/**
 * Business logic for patients. A patient's "active medications" are derived
 * from their non-dispensed/non-voided prescriptions rather than stored, so the
 * list always reflects reality.
 */
final class PatientService
{
    public function __construct(
        private readonly PatientRepository $patients = new PatientRepository(),
        private readonly PrescriptionRepository $prescriptions = new PrescriptionRepository(),
    ) {
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function list(?string $search = null): array
    {
        return array_map([$this, 'present'], $this->patients->all($search));
    }

    /**
     * @return array<string, mixed>
     */
    public function get(int $id): array
    {
        $patient = $this->patients->find($id);

        if ($patient === null) {
            throw new NotFoundException("Patient {$id} not found.");
        }

        $patient = $this->present($patient);
        $patient['prescriptions'] = $this->prescriptions->all(['patient_id' => $id]);
        $patient['active_prescriptions'] = count(array_filter(
            $patient['prescriptions'],
            static fn (array $rx): bool => in_array($rx['state'], ['new', 'verifying', 'ready'], true)
        ));

        return $patient;
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function create(array $input): array
    {
        $data = [
            'code'       => $input['code'] ?? $this->nextCode(),
            'name'       => $input['name'],
            'dob'        => $input['dob'] ?? null,
            'phone'      => $input['phone'] ?? null,
            'plan'       => $input['plan'] ?? null,
            'allergies'  => $input['allergies'] ?? [],
            'last_visit' => $input['last_visit'] ?? null,
        ];

        return $this->present($this->patients->create($data));
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function update(int $id, array $input): array
    {
        if ($this->patients->find($id) === null) {
            throw new NotFoundException("Patient {$id} not found.");
        }

        return $this->present($this->patients->update($id, $input) ?? []);
    }

    public function delete(int $id): void
    {
        if (!$this->patients->delete($id)) {
            throw new NotFoundException("Patient {$id} not found.");
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

        return [
            'id'         => (int) $row['id'],
            'code'       => $row['code'],
            'name'       => $row['name'],
            'dob'        => $row['dob'],
            'phone'      => $row['phone'],
            'plan'       => $row['plan'],
            'allergies'  => $row['allergies'] ?? [],
            'last_visit' => $row['last_visit'],
            'created_at' => $row['created_at'] ?? null,
            'updated_at' => $row['updated_at'] ?? null,
        ];
    }

    private function nextCode(): string
    {
        return 'PT-' . str_pad((string) random_int(1000, 9999), 4, '0', STR_PAD_LEFT);
    }
}
