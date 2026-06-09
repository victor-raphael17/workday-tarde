<?php

/**
 * API route table.
 *
 * Returns a closure that registers every route on the given Router. Handlers
 * are [ControllerClass, method] pairs — the router instantiates the controller
 * and calls the method with the captured Request.
 */

declare(strict_types=1);

use App\Controllers\AuthController;
use App\Controllers\DashboardController;
use App\Controllers\HealthController;
use App\Controllers\MedicationController;
use App\Controllers\PatientController;
use App\Controllers\PrescriptionController;
use App\Controllers\PurchaseOrderController;
use App\Controllers\SaleController;
use App\Controllers\SupplierController;
use App\Core\Router;

return static function (Router $r): void {
    // Service info + health -------------------------------------------------
    $r->get('/', [HealthController::class, 'index']);
    $r->get('/health', [HealthController::class, 'health']);

    // Authentication --------------------------------------------------------
    $r->post('/api/auth/login', [AuthController::class, 'login']);
    $r->get('/api/auth/me', [AuthController::class, 'me']);
    $r->post('/api/auth/logout', [AuthController::class, 'logout']);

    // Dashboard -------------------------------------------------------------
    $r->get('/api/dashboard', [DashboardController::class, 'summary']);

    // Medications / inventory ----------------------------------------------
    $r->get('/api/medications', [MedicationController::class, 'index']);
    $r->get('/api/medications/categories', [MedicationController::class, 'categories']);
    $r->get('/api/medications/low-stock', [MedicationController::class, 'lowStock']);
    $r->get('/api/medications/expiring', [MedicationController::class, 'expiring']);
    $r->post('/api/medications', [MedicationController::class, 'store']);
    $r->get('/api/medications/{id}', [MedicationController::class, 'show']);
    $r->put('/api/medications/{id}', [MedicationController::class, 'update']);
    $r->patch('/api/medications/{id}', [MedicationController::class, 'update']);
    $r->post('/api/medications/{id}/stock', [MedicationController::class, 'adjustStock']);
    $r->delete('/api/medications/{id}', [MedicationController::class, 'destroy']);

    // Patients --------------------------------------------------------------
    $r->get('/api/patients', [PatientController::class, 'index']);
    $r->post('/api/patients', [PatientController::class, 'store']);
    $r->get('/api/patients/{id}', [PatientController::class, 'show']);
    $r->put('/api/patients/{id}', [PatientController::class, 'update']);
    $r->patch('/api/patients/{id}', [PatientController::class, 'update']);
    $r->delete('/api/patients/{id}', [PatientController::class, 'destroy']);

    // Suppliers -------------------------------------------------------------
    $r->get('/api/suppliers', [SupplierController::class, 'index']);
    $r->post('/api/suppliers', [SupplierController::class, 'store']);
    $r->get('/api/suppliers/{id}', [SupplierController::class, 'show']);
    $r->put('/api/suppliers/{id}', [SupplierController::class, 'update']);
    $r->patch('/api/suppliers/{id}', [SupplierController::class, 'update']);
    $r->delete('/api/suppliers/{id}', [SupplierController::class, 'destroy']);

    // Prescriptions ---------------------------------------------------------
    $r->get('/api/prescriptions', [PrescriptionController::class, 'index']);
    $r->post('/api/prescriptions', [PrescriptionController::class, 'store']);
    $r->get('/api/prescriptions/{id}', [PrescriptionController::class, 'show']);
    $r->patch('/api/prescriptions/{id}/state', [PrescriptionController::class, 'transition']);

    // Purchase orders -------------------------------------------------------
    $r->get('/api/purchase-orders', [PurchaseOrderController::class, 'index']);
    $r->post('/api/purchase-orders', [PurchaseOrderController::class, 'store']);
    $r->get('/api/purchase-orders/{id}', [PurchaseOrderController::class, 'show']);
    $r->patch('/api/purchase-orders/{id}/state', [PurchaseOrderController::class, 'transition']);

    // Sales (point of sale) -------------------------------------------------
    $r->get('/api/sales', [SaleController::class, 'index']);
    $r->post('/api/sales', [SaleController::class, 'store']);
    $r->get('/api/sales/{id}', [SaleController::class, 'show']);
    $r->post('/api/sales/{id}/void', [SaleController::class, 'void']);
};
