<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Request;
use App\Core\Response;
use App\Services\PrescriptionService;

/**
 * HTTP endpoints for the prescription pipeline.
 */
final class PrescriptionController extends Controller
{
    public function __construct(
        private readonly PrescriptionService $prescriptions = new PrescriptionService(),
    ) {
    }

    public function index(Request $request): Response
    {
        $filters = [];

        if ($state = $request->query('state')) {
            $filters['state'] = (string) $state;
        }
        if ($patientId = $request->query('patient_id')) {
            $filters['patient_id'] = (int) $patientId;
        }

        return Response::ok($this->prescriptions->list($filters));
    }

    public function show(Request $request): Response
    {
        return Response::ok($this->prescriptions->get($this->intParam($request, 'id')));
    }

    public function store(Request $request): Response
    {
        $data = $this->validate($request, [
            'code'          => 'nullable|string|max:20',
            'patient_id'    => 'required|integer|min:1',
            'medication_id' => 'required|integer|min:1',
            'quantity'      => 'required|integer|min:1',
            'unit'          => 'nullable|string|max:20',
            'prescriber'    => 'required|string|max:120',
            'flag'          => 'nullable|in:controlled,interaction,allergy',
        ]);

        return Response::created($this->prescriptions->create($data));
    }

    /**
     * Advance a prescription's state, e.g. {"state": "ready"} or
     * {"state": "dispensed"} (the latter draws down stock).
     */
    public function transition(Request $request): Response
    {
        $data = $this->validate($request, [
            'state' => 'required|in:verifying,ready,dispensed,voided',
        ]);

        return Response::ok($this->prescriptions->transition(
            $this->intParam($request, 'id'),
            (string) $data['state']
        ));
    }
}
