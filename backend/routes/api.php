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
use App\Core\Middleware\AuthMiddleware;
use App\Core\Router;

return static function (Router $r): void {
    // Service info + health -------------------------------------------------
    $r->get('/', [HealthController::class, 'index']);
    $r->get('/health', [HealthController::class, 'health']);

    // Authentication --------------------------------------------------------
    $r->post('/api/auth/login', [AuthController::class, 'login']);

    $r->get(
        '/api/auth/me',
        [AuthController::class, 'me'],
        [AuthMiddleware::class]
    );

    $r->post(
        '/api/auth/logout',
        [AuthController::class, 'logout'],
        [AuthMiddleware::class]
    );

    // Dashboard -------------------------------------------------------------
    $r->get('/api/dashboard', [DashboardController::class, 'summary'], [AuthMiddleware::class]);

    // Medications / inventory ----------------------------------------------
    $r->get('/api/medications', [MedicationController::class, 'index'], [AuthMiddleware::class]);
    $r->get('/api/medications/categories', [MedicationController::class, 'categories'], [AuthMiddleware::class]);
    $r->get('/api/medications/low-stock', [MedicationController::class, 'lowStock'], [AuthMiddleware::class]);
    $r->get('/api/medications/expiring', [MedicationController::class, 'expiring'], [AuthMiddleware::class]);
    $r->post('/api/medications', [MedicationController::class, 'store'], [AuthMiddleware::class]);
    $r->get('/api/medications/{id}', [MedicationController::class, 'show'], [AuthMiddleware::class]);
    $r->put('/api/medications/{id}', [MedicationController::class, 'update'], [AuthMiddleware::class]);
    $r->patch('/api/medications/{id}', [MedicationController::class, 'update'], [AuthMiddleware::class]);
    $r->post('/api/medications/{id}/stock', [MedicationController::class, 'adjustStock'], [AuthMiddleware::class]);
    $r->delete('/api/medications/{id}', [MedicationController::class, 'destroy'], [AuthMiddleware::class]);

    // Patients --------------------------------------------------------------
    $r->get('/api/patients', [PatientController::class, 'index'], [AuthMiddleware::class]);
    $r->post('/api/patients', [PatientController::class, 'store'], [AuthMiddleware::class]);
    $r->get('/api/patients/{id}', [PatientController::class, 'show'], [AuthMiddleware::class]);
    $r->put('/api/patients/{id}', [PatientController::class, 'update'], [AuthMiddleware::class]);
    $r->patch('/api/patients/{id}', [PatientController::class, 'update'], [AuthMiddleware::class]);
    $r->delete('/api/patients/{id}', [PatientController::class, 'destroy'], [AuthMiddleware::class]);

    // Suppliers -------------------------------------------------------------
    $r->get('/api/suppliers', [SupplierController::class, 'index'], [AuthMiddleware::class]);
    $r->post('/api/suppliers', [SupplierController::class, 'store'], [AuthMiddleware::class]);
    $r->get('/api/suppliers/{id}', [SupplierController::class, 'show'], [AuthMiddleware::class]);
    $r->put('/api/suppliers/{id}', [SupplierController::class, 'update'], [AuthMiddleware::class]);
    $r->patch('/api/suppliers/{id}', [SupplierController::class, 'update'], [AuthMiddleware::class]);
    $r->delete('/api/suppliers/{id}', [SupplierController::class, 'destroy'], [AuthMiddleware::class]);

    // Prescriptions ---------------------------------------------------------
    $r->get('/api/prescriptions', [PrescriptionController::class, 'index'], [AuthMiddleware::class]);
    $r->post('/api/prescriptions', [PrescriptionController::class, 'store'], [AuthMiddleware::class]);
    $r->get('/api/prescriptions/{id}', [PrescriptionController::class, 'show'], [AuthMiddleware::class]);
    $r->patch('/api/prescriptions/{id}/state', [PrescriptionController::class, 'transition'], [AuthMiddleware::class]);

    // Purchase orders -------------------------------------------------------
    $r->get('/api/purchase-orders', [PurchaseOrderController::class, 'index'], [AuthMiddleware::class]);
    $r->post('/api/purchase-orders', [PurchaseOrderController::class, 'store'], [AuthMiddleware::class]);
    $r->get('/api/purchase-orders/{id}', [PurchaseOrderController::class, 'show'], [AuthMiddleware::class]);
    $r->patch('/api/purchase-orders/{id}/state', [PurchaseOrderController::class, 'transition'], [AuthMiddleware::class]);

    // Sales (point of sale) -------------------------------------------------
    $r->get('/api/sales', [SaleController::class, 'index'], [AuthMiddleware::class]);
    $r->post('/api/sales', [SaleController::class, 'store'], [AuthMiddleware::class]);
    $r->get('/api/sales/{id}', [SaleController::class, 'show'], [AuthMiddleware::class]);
    $r->post('/api/sales/{id}/void', [SaleController::class, 'void'], [AuthMiddleware::class]);
};
