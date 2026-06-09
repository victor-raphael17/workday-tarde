<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Request;
use App\Core\Response;
use App\Services\SupplierService;

/**
 * HTTP endpoints for suppliers.
 */
final class SupplierController extends Controller
{
    public function __construct(
        private readonly SupplierService $suppliers = new SupplierService(),
    ) {
    }

    public function index(Request $request): Response
    {
        return Response::ok($this->suppliers->list());
    }

    public function show(Request $request): Response
    {
        return Response::ok($this->suppliers->get($this->intParam($request, 'id')));
    }

    public function store(Request $request): Response
    {
        $data = $this->validate($request, [
            'name'          => 'required|string|max:160',
            'contact_email' => 'nullable|email|max:160',
            'phone'         => 'nullable|string|max:40',
        ]);

        return Response::created($this->suppliers->create($data));
    }

    public function update(Request $request): Response
    {
        $data = $this->validate($request, [
            'name'          => 'nullable|string|max:160',
            'contact_email' => 'nullable|email|max:160',
            'phone'         => 'nullable|string|max:40',
        ]);

        return Response::ok($this->suppliers->update($this->intParam($request, 'id'), $data));
    }

    public function destroy(Request $request): Response
    {
        $this->suppliers->delete($this->intParam($request, 'id'));

        return Response::noContent();
    }
}
