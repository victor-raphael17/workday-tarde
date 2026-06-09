<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Request;
use App\Core\Response;
use App\Services\SaleService;

/**
 * HTTP endpoints for the point of sale.
 */
final class SaleController extends Controller
{
    public function __construct(
        private readonly SaleService $sales = new SaleService(),
    ) {
    }

    public function index(Request $request): Response
    {
        $state = $request->query('state');

        return Response::ok($this->sales->list($state !== null ? (string) $state : null));
    }

    public function show(Request $request): Response
    {
        return Response::ok($this->sales->get($this->intParam($request, 'id')));
    }

    public function store(Request $request): Response
    {
        // Line items are validated and priced server-side in the service.
        $data = $this->validate($request, [
            'code'           => 'nullable|string|max:20',
            'patient_id'     => 'nullable|integer|min:1',
            'payment_method' => 'nullable|in:cash,card,insurance',
        ]);

        $data['items'] = $request->input('items', []);

        return Response::created($this->sales->create($data));
    }

    /**
     * Void a completed sale and restore its stock.
     */
    public function void(Request $request): Response
    {
        return Response::ok($this->sales->void($this->intParam($request, 'id')));
    }
}
