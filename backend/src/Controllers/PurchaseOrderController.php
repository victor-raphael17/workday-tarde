<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Request;
use App\Core\Response;
use App\Services\PurchaseOrderService;

/**
 * HTTP endpoints for restocking via purchase orders.
 */
final class PurchaseOrderController extends Controller
{
    public function __construct(
        private readonly PurchaseOrderService $orders = new PurchaseOrderService(),
    ) {
    }

    public function index(Request $request): Response
    {
        $state = $request->query('state');

        return Response::ok($this->orders->list($state !== null ? (string) $state : null));
    }

    public function show(Request $request): Response
    {
        return Response::ok($this->orders->get($this->intParam($request, 'id')));
    }

    public function store(Request $request): Response
    {
        // Header fields are validated here; line items are validated in the
        // service (where each medication_id is checked against the catalogue).
        $data = $this->validate($request, [
            'code'        => 'nullable|string|max:20',
            'supplier_id' => 'required|integer|min:1',
            'expected_at' => 'nullable|date',
        ]);

        $data['items'] = $request->input('items', []);

        return Response::created($this->orders->create($data));
    }

    /**
     * Advance a purchase order, e.g. {"state": "received"} which adds the
     * ordered units into stock.
     */
    public function transition(Request $request): Response
    {
        $data = $this->validate($request, [
            'state' => 'required|in:submitted,transit,received,cancelled',
        ]);

        return Response::ok($this->orders->transition(
            $this->intParam($request, 'id'),
            (string) $data['state']
        ));
    }
}
