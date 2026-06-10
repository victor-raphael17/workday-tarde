<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\Exceptions\NotFoundException;
use App\Repositories\SupplierRepository;
use App\Support\Pagination;

/**
 * Business logic for suppliers.
 */
final class SupplierService
{
    public function __construct(
        private readonly SupplierRepository $suppliers = new SupplierRepository(),
    ) {
    }

    /**
     * @return array{items: array<int, array<string, mixed>>, pagination: array<string, int>}
     */
    public function list(?Pagination $pagination = null): array
    {
        $pagination ??= new Pagination();

        $page = $this->suppliers->all($pagination);

        return [
            'items'      => array_map([$this, 'present'], $page['items']),
            'pagination' => $page['pagination'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function get(int $id): array
    {
        $supplier = $this->suppliers->find($id);

        if ($supplier === null) {
            throw new NotFoundException("Supplier {$id} not found.");
        }

        return $this->present($supplier);
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function create(array $input): array
    {
        $data = [
            'name'          => $input['name'],
            'contact_email' => $input['contact_email'] ?? null,
            'phone'         => $input['phone'] ?? null,
        ];

        return $this->present($this->suppliers->create($data));
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function update(int $id, array $input): array
    {
        if ($this->suppliers->find($id) === null) {
            throw new NotFoundException("Supplier {$id} not found.");
        }

        return $this->present($this->suppliers->update($id, $input) ?? []);
    }

    public function delete(int $id): void
    {
        if (!$this->suppliers->delete($id)) {
            throw new NotFoundException("Supplier {$id} not found.");
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
            'name'          => $row['name'],
            'contact_email' => $row['contact_email'],
            'phone'         => $row['phone'],
            'created_at'    => $row['created_at'] ?? null,
            'updated_at'    => $row['updated_at'] ?? null,
        ];
    }
}
