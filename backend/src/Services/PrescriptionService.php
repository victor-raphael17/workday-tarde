<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\Database;
use App\Core\Exceptions\DomainException;
use App\Core\Exceptions\NotFoundException;
use App\Repositories\MedicationRepository;
use App\Repositories\PatientRepository;
use App\Repositories\PrescriptionRepository;

/**
 * Business logic for the prescription pipeline: intake → verify → ready →
 * dispensed, plus voiding. Dispensing is the only step that touches stock — it
 * draws the dispensed quantity down from the medication's on-hand count inside
 * a transaction, so stock and prescription state can never disagree.
 */
final class PrescriptionService
{
    /** Allowed state transitions. */
    private const TRANSITIONS = [
        'new'       => ['verifying', 'voided'],
        'verifying' => ['ready', 'voided'],
        'ready'     => ['dispensed', 'voided'],
        'dispensed' => [],
        'voided'    => [],
    ];

    public function __construct(
        private readonly PrescriptionRepository $prescriptions = new PrescriptionRepository(),
        private readonly MedicationRepository $medications = new MedicationRepository(),
        private readonly PatientRepository $patients = new PatientRepository(),
    ) {
    }

    /**
     * @param array{state?: string, patient_id?: int} $filters
     * @return array<int, array<string, mixed>>
     */
    public function list(array $filters = []): array
    {
        return array_map([$this, 'present'], $this->prescriptions->all($filters));
    }

    /**
     * @return array<string, mixed>
     */
    public function get(int $id): array
    {
        $row = $this->prescriptions->find($id);

        if ($row === null) {
            throw new NotFoundException("Prescription {$id} not found.");
        }

        return $this->present($row);
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function create(array $input): array
    {
        $patient = $this->patients->find((int) $input['patient_id']);
        if ($patient === null) {
            throw new DomainException("Patient {$input['patient_id']} does not exist.");
        }

        $medication = $this->medications->find((int) $input['medication_id']);
        if ($medication === null) {
            throw new DomainException("Medication {$input['medication_id']} does not exist.");
        }

        // Auto-flag controlled substances unless the caller set an explicit flag.
        $flag = $input['flag'] ?? null;
        if ($flag === null && $this->toBool($medication['controlled'])) {
            $flag = 'controlled';
        }

        $data = [
            'code'          => $input['code'] ?? $this->nextCode(),
            'patient_id'    => (int) $input['patient_id'],
            'medication_id' => (int) $input['medication_id'],
            'quantity'      => (int) $input['quantity'],
            'unit'          => $input['unit'] ?? 'units',
            'prescriber'    => $input['prescriber'],
            'state'         => 'new',
            'flag'          => $flag,
        ];

        return $this->present($this->prescriptions->create($data));
    }

    /**
     * Move a prescription to a new state, enforcing the allowed transitions.
     *
     * @return array<string, mixed>
     */
    public function transition(int $id, string $target): array
    {
        $current = $this->prescriptions->find($id);
        if ($current === null) {
            throw new NotFoundException("Prescription {$id} not found.");
        }

        if ($target === 'dispensed') {
            return $this->dispense($current);
        }

        $this->assertTransition((string) $current['state'], $target);

        return $this->present($this->prescriptions->updateState($id, $target) ?? []);
    }

    /**
     * Dispense: validate the transition, draw down stock, mark dispensed.
     *
     * @param array<string, mixed> $prescription
     * @return array<string, mixed>
     */
    private function dispense(array $prescription): array
    {
        $this->assertTransition((string) $prescription['state'], 'dispensed');

        $medicationId = (int) $prescription['medication_id'];
        $quantity = (int) $prescription['quantity'];

        $result = Database::transaction(function () use ($prescription, $medicationId, $quantity) {
            $adjusted = $this->medications->adjustStock($medicationId, -$quantity);

            if ($adjusted === null) {
                $med = $this->medications->find($medicationId);
                $onHand = $med['on_hand'] ?? 0;
                throw new DomainException(
                    "Cannot dispense {$quantity} units — only {$onHand} on hand for {$prescription['medication_name']}."
                );
            }

            return $this->prescriptions->updateState((int) $prescription['id'], 'dispensed');
        });

        return $this->present($result ?? []);
    }

    private function assertTransition(string $from, string $to): void
    {
        if ($from === $to) {
            throw new DomainException("Prescription is already '{$from}'.");
        }

        if (!in_array($to, self::TRANSITIONS[$from] ?? [], true)) {
            throw new DomainException("Cannot move a prescription from '{$from}' to '{$to}'.");
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
            'id'            => (int) $row['id'],
            'code'          => $row['code'],
            'patient'       => [
                'id'   => (int) $row['patient_id'],
                'code' => $row['patient_code'] ?? null,
                'name' => $row['patient_name'] ?? null,
            ],
            'medication'    => [
                'id'         => (int) $row['medication_id'],
                'name'       => $row['medication_name'] ?? null,
                'strength'   => $row['medication_strength'] ?? null,
                'controlled' => $this->toBool($row['medication_controlled'] ?? false),
            ],
            'quantity'      => (int) $row['quantity'],
            'unit'          => $row['unit'],
            'prescriber'    => $row['prescriber'],
            'state'         => $row['state'],
            'flag'          => $row['flag'],
            'created_at'    => $row['created_at'] ?? null,
            'updated_at'    => $row['updated_at'] ?? null,
        ];
    }

    private function nextCode(): string
    {
        return 'RX-' . random_int(10000, 99999);
    }

    private function toBool(mixed $value): bool
    {
        return $value === true || $value === 't' || $value === 'true' || $value === 1 || $value === '1';
    }
}
