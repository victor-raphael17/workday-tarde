<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\Exceptions\DomainException;
use App\Core\Exceptions\NotFoundException;
use App\Repositories\MedicationRepository;

/**
 * Business logic for the medication catalogue and stock control.
 *
 * The canonical stock states (In stock / Low stock / Out of stock /
 * Expiring soon / Expired / Recalled) are *derived* here from on-hand quantity,
 * reorder point, expiry date and the recalled flag — they are never stored, so
 * they can never drift out of sync with the underlying numbers.
 */
final class MedicationService
{
    /** Window (days) within which a not-yet-expired item counts as "expiring soon". */
    private const EXPIRY_SOON_DAYS = 90;

    public function __construct(
        private readonly MedicationRepository $medications = new MedicationRepository(),
    ) {
    }

    /**
     * @param array{search?: string, category?: string, controlled?: bool} $filters
     * @return array<int, array<string, mixed>>
     */
    public function list(array $filters = []): array
    {
        return array_map([$this, 'present'], $this->medications->all($filters));
    }

    /**
     * @return array<string, mixed>
     */
    public function get(int $id): array
    {
        $row = $this->medications->find($id);

        if ($row === null) {
            throw new NotFoundException("Medication {$id} not found.");
        }

        return $this->present($row);
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function create(array $input): array
    {
        if ($this->medications->findBySku($input['sku']) !== null) {
            throw new DomainException("A medication with SKU {$input['sku']} already exists.");
        }

        $data = [
            'sku'           => $input['sku'],
            'name'          => $input['name'],
            'strength'      => $input['strength'] ?? null,
            'form'          => $input['form'] ?? null,
            'category'      => $input['category'] ?? null,
            'on_hand'       => $input['on_hand'] ?? 0,
            'reorder_point' => $input['reorder_point'] ?? 0,
            'price'         => $input['price'] ?? 0,
            'expiry'        => $input['expiry'] ?? null,
            'controlled'    => !empty($input['controlled']) ? 'true' : 'false',
        ];

        return $this->present($this->medications->create($data));
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function update(int $id, array $input): array
    {
        if ($this->medications->find($id) === null) {
            throw new NotFoundException("Medication {$id} not found.");
        }

        if (isset($input['sku'])) {
            $existing = $this->medications->findBySku($input['sku']);
            if ($existing !== null && (int) $existing['id'] !== $id) {
                throw new DomainException("A medication with SKU {$input['sku']} already exists.");
            }
        }

        foreach (['controlled', 'recalled'] as $boolField) {
            if (array_key_exists($boolField, $input)) {
                $input[$boolField] = $input[$boolField] ? 'true' : 'false';
            }
        }

        $updated = $this->medications->update($id, $input);

        return $this->present($updated ?? []);
    }

    /**
     * Manually adjust stock (goods-in, stock count correction, write-off).
     * A positive delta adds stock; negative removes it but never below zero.
     *
     * @return array<string, mixed>
     */
    public function adjustStock(int $id, int $delta, ?string $reason = null): array
    {
        if ($this->medications->find($id) === null) {
            throw new NotFoundException("Medication {$id} not found.");
        }

        $updated = $this->medications->adjustStock($id, $delta);

        if ($updated === null) {
            throw new DomainException('Adjustment rejected: stock cannot go below zero.');
        }

        return $this->present($updated);
    }

    public function delete(int $id): void
    {
        if (!$this->medications->delete($id)) {
            throw new NotFoundException("Medication {$id} not found.");
        }
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function lowStock(): array
    {
        return array_map([$this, 'present'], $this->medications->belowReorderPoint());
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function expiringSoon(): array
    {
        $cutoff = (new \DateTimeImmutable("+" . self::EXPIRY_SOON_DAYS . " days"))->format('Y-m-d');

        return array_map([$this, 'present'], $this->medications->expiringBefore($cutoff));
    }

    /**
     * @return string[]
     */
    public function categories(): array
    {
        return $this->medications->categories();
    }

    /**
     * Shape a raw DB row into the API representation: cast types and attach the
     * derived stock status.
     *
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function present(array $row): array
    {
        if ($row === []) {
            return $row;
        }

        $onHand = (int) $row['on_hand'];
        $reorder = (int) $row['reorder_point'];
        $controlled = $this->toBool($row['controlled']);
        $recalled = $this->toBool($row['recalled']);
        $status = $this->deriveStatus($onHand, $reorder, $row['expiry'] ?? null, $recalled);

        return [
            'id'             => (int) $row['id'],
            'sku'            => $row['sku'],
            'name'           => $row['name'],
            'strength'       => $row['strength'],
            'form'           => $row['form'],
            'category'       => $row['category'],
            'on_hand'        => $onHand,
            'reorder_point'  => $reorder,
            'price'          => (float) $row['price'],
            'expiry'         => $row['expiry'],
            'controlled'     => $controlled,
            'recalled'       => $recalled,
            'status'         => $status['code'],
            'status_label'   => $status['label'],
            'created_at'     => $row['created_at'] ?? null,
            'updated_at'     => $row['updated_at'] ?? null,
        ];
    }

    /**
     * @return array{code: string, label: string}
     */
    private function deriveStatus(int $onHand, int $reorder, ?string $expiry, bool $recalled): array
    {
        if ($recalled) {
            return ['code' => 'recalled', 'label' => 'Recalled'];
        }

        if ($expiry !== null && $expiry < date('Y-m-d')) {
            return ['code' => 'expired', 'label' => 'Expired'];
        }

        if ($onHand === 0) {
            return ['code' => 'out', 'label' => 'Out of stock'];
        }

        if ($onHand <= $reorder) {
            return ['code' => 'low', 'label' => 'Low stock'];
        }

        if ($expiry !== null) {
            $cutoff = (new \DateTimeImmutable('+' . self::EXPIRY_SOON_DAYS . ' days'))->format('Y-m-d');
            if ($expiry <= $cutoff) {
                return ['code' => 'expiring', 'label' => 'Expiring soon'];
            }
        }

        return ['code' => 'in', 'label' => 'In stock'];
    }

    private function toBool(mixed $value): bool
    {
        return $value === true || $value === 't' || $value === 'true' || $value === 1 || $value === '1';
    }
}
