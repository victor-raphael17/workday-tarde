<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Request;
use App\Core\Response;
use App\Services\MedicationService;

/**
 * HTTP endpoints for the medication catalogue and stock control.
 */
final class MedicationController extends Controller
{
    public function __construct(
        private readonly MedicationService $medications = new MedicationService(),
    ) {
    }

    public function index(Request $request): Response
    {
        $filters = [];

        if ($search = $request->query('search')) {
            $filters['search'] = (string) $search;
        }
        if ($category = $request->query('category')) {
            $filters['category'] = (string) $category;
        }
        if (($controlled = $request->query('controlled')) !== null) {
            $filters['controlled'] = in_array(strtolower((string) $controlled), ['1', 'true', 'yes'], true);
        }

        return Response::ok($this->medications->list($filters));
    }

    public function show(Request $request): Response
    {
        return Response::ok($this->medications->get($this->intParam($request, 'id')));
    }

    public function store(Request $request): Response
    {
        $data = $this->validate($request, [
            'sku'           => 'required|string|max:40',
            'name'          => 'required|string|max:160',
            'strength'      => 'nullable|string|max:40',
            'form'          => 'nullable|string|max:40',
            'category'      => 'nullable|string|max:80',
            'on_hand'       => 'nullable|integer|min:0',
            'reorder_point' => 'nullable|integer|min:0',
            'price'         => 'nullable|numeric|min:0',
            'expiry'        => 'nullable|date',
            'controlled'    => 'nullable|boolean',
        ]);

        return Response::created($this->medications->create($data));
    }

    public function update(Request $request): Response
    {
        $data = $this->validate($request, [
            'sku'           => 'nullable|string|max:40',
            'name'          => 'nullable|string|max:160',
            'strength'      => 'nullable|string|max:40',
            'form'          => 'nullable|string|max:40',
            'category'      => 'nullable|string|max:80',
            'on_hand'       => 'nullable|integer|min:0',
            'reorder_point' => 'nullable|integer|min:0',
            'price'         => 'nullable|numeric|min:0',
            'expiry'        => 'nullable|date',
            'controlled'    => 'nullable|boolean',
            'recalled'      => 'nullable|boolean',
        ]);

        return Response::ok($this->medications->update($this->intParam($request, 'id'), $data));
    }

    /**
     * Adjust on-hand stock by a signed delta (goods-in, correction, write-off).
     */
    public function adjustStock(Request $request): Response
    {
        $data = $this->validate($request, [
            'delta'  => 'required|integer',
            'reason' => 'nullable|string|max:160',
        ]);

        return Response::ok($this->medications->adjustStock(
            $this->intParam($request, 'id'),
            (int) $data['delta'],
            $data['reason'] ?? null
        ));
    }

    public function destroy(Request $request): Response
    {
        $this->medications->delete($this->intParam($request, 'id'));

        return Response::noContent();
    }

    public function lowStock(Request $request): Response
    {
        return Response::ok($this->medications->lowStock());
    }

    public function expiring(Request $request): Response
    {
        return Response::ok($this->medications->expiringSoon());
    }

    public function categories(Request $request): Response
    {
        return Response::ok($this->medications->categories());
    }
}
