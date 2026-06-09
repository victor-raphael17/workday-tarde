<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\Config;
use App\Core\Database;
use App\Core\Exceptions\DomainException;
use App\Core\Exceptions\NotFoundException;
use App\Repositories\MedicationRepository;
use App\Repositories\SaleRepository;

/**
 * Business logic for the point of sale.
 *
 * Completing a sale is the counterpart of receiving stock: it draws each sold
 * line's quantity down from medication on-hand, atomically, rejecting the whole
 * sale if any line would oversell. Voiding a completed sale puts the stock back.
 * Prices are taken server-side from the medication record so the client can't
 * dictate the charge.
 */
final class SaleService
{
    public function __construct(
        private readonly SaleRepository $sales = new SaleRepository(),
        private readonly MedicationRepository $medications = new MedicationRepository(),
    ) {
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function list(?string $state = null): array
    {
        return array_map([$this, 'presentSummary'], $this->sales->all($state));
    }

    /**
     * @return array<string, mixed>
     */
    public function get(int $id): array
    {
        $sale = $this->sales->find($id);

        if ($sale === null) {
            throw new NotFoundException("Sale {$id} not found.");
        }

        return $this->present($sale);
    }

    /**
     * Ring up and complete a sale.
     *
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function create(array $input): array
    {
        $items = $input['items'] ?? [];
        if (!is_array($items) || $items === []) {
            throw new DomainException('A sale needs at least one line item.');
        }

        $priced = $this->priceItems($items);
        $subtotal = array_sum(array_map(static fn (array $i): float => $i['quantity'] * $i['unit_price'], $priced));
        $taxRate = (float) Config::get('app.tax_rate', 0);
        $tax = round($subtotal * $taxRate, 2);
        $total = round($subtotal + $tax, 2);

        $id = Database::transaction(function () use ($input, $priced, $subtotal, $tax, $total): int {
            // Draw down stock first so an oversell aborts the whole transaction.
            foreach ($priced as $item) {
                $adjusted = $this->medications->adjustStock($item['medication_id'], -$item['quantity']);
                if ($adjusted === null) {
                    throw new DomainException(
                        "Cannot sell {$item['quantity']} × {$item['medication_name']} — insufficient stock."
                    );
                }
            }

            $saleId = $this->sales->insertSale([
                'code'           => $input['code'] ?? $this->nextCode(),
                'patient_id'     => isset($input['patient_id']) ? (int) $input['patient_id'] : null,
                'subtotal'       => round($subtotal, 2),
                'tax'            => $tax,
                'total'          => $total,
                'payment_method' => $input['payment_method'] ?? 'cash',
                'state'          => 'completed',
            ]);

            foreach ($priced as $item) {
                $this->sales->insertItem($saleId, [
                    'medication_id' => $item['medication_id'],
                    'quantity'      => $item['quantity'],
                    'unit_price'    => $item['unit_price'],
                ]);
            }

            return $saleId;
        });

        return $this->get($id);
    }

    /**
     * Void a completed sale and restore the sold stock.
     *
     * @return array<string, mixed>
     */
    public function void(int $id): array
    {
        $sale = $this->sales->find($id);
        if ($sale === null) {
            throw new NotFoundException("Sale {$id} not found.");
        }

        if ($sale['state'] === 'voided') {
            throw new DomainException('This sale has already been voided.');
        }

        Database::transaction(function () use ($sale, $id): void {
            foreach ($sale['items'] as $item) {
                $this->medications->adjustStock((int) $item['medication_id'], (int) $item['quantity']);
            }
            $this->sales->markVoided($id);
        });

        return $this->get($id);
    }

    /**
     * Resolve each requested line to a server-authoritative price and validate
     * the medication exists.
     *
     * @param array<int, mixed> $items
     * @return array<int, array{medication_id: int, medication_name: string, quantity: int, unit_price: float}>
     */
    private function priceItems(array $items): array
    {
        $priced = [];

        foreach ($items as $i => $item) {
            if (!is_array($item) || !isset($item['medication_id'], $item['quantity'])) {
                throw new DomainException("Line item #{$i} must include medication_id and quantity.");
            }

            $medication = $this->medications->find((int) $item['medication_id']);
            if ($medication === null) {
                throw new DomainException("Medication {$item['medication_id']} on line #{$i} does not exist.");
            }

            $quantity = (int) $item['quantity'];
            if ($quantity <= 0) {
                throw new DomainException("Line item #{$i} must sell at least 1 unit.");
            }

            $priced[] = [
                'medication_id'   => (int) $medication['id'],
                'medication_name' => (string) $medication['name'],
                'quantity'        => $quantity,
                'unit_price'      => (float) $medication['price'],
            ];
        }

        return $priced;
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function presentSummary(array $row): array
    {
        return [
            'id'             => (int) $row['id'],
            'code'           => $row['code'],
            'patient_id'     => $row['patient_id'] !== null ? (int) $row['patient_id'] : null,
            'subtotal'       => (float) $row['subtotal'],
            'tax'            => (float) $row['tax'],
            'total'          => (float) $row['total'],
            'payment_method' => $row['payment_method'],
            'state'          => $row['state'],
            'created_at'     => $row['created_at'] ?? null,
        ];
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function present(array $row): array
    {
        $sale = $this->presentSummary($row);
        $sale['items'] = array_map(static fn (array $item): array => [
            'id'              => (int) $item['id'],
            'medication_id'   => (int) $item['medication_id'],
            'medication_name' => $item['medication_name'],
            'medication_sku'  => $item['medication_sku'],
            'quantity'        => (int) $item['quantity'],
            'unit_price'      => (float) $item['unit_price'],
            'line_total'      => round((int) $item['quantity'] * (float) $item['unit_price'], 2),
        ], $row['items'] ?? []);

        return $sale;
    }

    private function nextCode(): string
    {
        return 'SL-' . (10000 + $this->sales->nextSequence());
    }
}
