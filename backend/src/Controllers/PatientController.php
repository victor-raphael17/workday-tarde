<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Request;
use App\Core\Response;
use App\Services\PatientService;

/**
 * HTTP endpoints for patients.
 */
final class PatientController extends Controller
{
    public function __construct(
        private readonly PatientService $patients = new PatientService(),
    ) {
    }

    public function index(Request $request): Response
    {
        $search = $request->query('search');

        return Response::ok($this->patients->list($search !== null ? (string) $search : null));
    }

    public function show(Request $request): Response
    {
        return Response::ok($this->patients->get($this->intParam($request, 'id')));
    }

    public function store(Request $request): Response
    {
        $data = $this->validate($request, [
            'code'       => 'nullable|string|max:20',
            'name'       => 'required|string|max:160',
            'dob'        => 'nullable|date',
            'phone'      => 'nullable|string|max:40',
            'plan'       => 'nullable|string|max:80',
            'last_visit' => 'nullable|date',
        ]);

        // allergies is an array; validate it separately from the scalar rules.
        $data['allergies'] = $this->allergies($request);

        return Response::created($this->patients->create($data));
    }

    public function update(Request $request): Response
    {
        $data = $this->validate($request, [
            'code'       => 'nullable|string|max:20',
            'name'       => 'nullable|string|max:160',
            'dob'        => 'nullable|date',
            'phone'      => 'nullable|string|max:40',
            'plan'       => 'nullable|string|max:80',
            'last_visit' => 'nullable|date',
        ]);

        if (array_key_exists('allergies', $request->body())) {
            $data['allergies'] = $this->allergies($request);
        }

        return Response::ok($this->patients->update($this->intParam($request, 'id'), $data));
    }

    public function destroy(Request $request): Response
    {
        $this->patients->delete($this->intParam($request, 'id'));

        return Response::noContent();
    }

    /**
     * @return string[]
     */
    private function allergies(Request $request): array
    {
        $value = $request->input('allergies', []);

        if (!is_array($value)) {
            return [];
        }

        return array_values(array_filter(array_map(
            static fn ($v): string => trim((string) $v),
            $value
        ), static fn (string $v): bool => $v !== ''));
    }
}
