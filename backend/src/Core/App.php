<?php

declare(strict_types=1);

namespace App\Core;

use App\Core\Exceptions\HttpException;
use Throwable;

/**
 * Application kernel: boots configuration, builds the router from the route
 * definitions, and runs the request/response cycle with centralized error
 * handling that renders every failure as JSON.
 */
final class App
{
    private Router $router;

    public function __construct()
    {
        Config::load(require base_path('config/config.php'));

        $this->router = new Router();
        (require base_path('routes/api.php'))($this->router);
    }

    public function run(): void
    {
        $request = Request::capture();

        $this->handleCors($request);

        try {
            $response = $this->router->dispatch($request);
        } catch (HttpException $e) {
            $response = $this->errorResponse($e->status, $e->getMessage(), $e->errors);
        } catch (Throwable $e) {
            $response = $this->serverError($e);
        }

        $response->send();
    }

    /**
     * @param array<string, string[]> $errors
     */
    private function errorResponse(int $status, string $message, array $errors = []): Response
    {
        $payload = ['error' => ['status' => $status, 'message' => $message]];

        if ($errors !== []) {
            $payload['error']['fields'] = $errors;
        }

        return new Response($payload, $status);
    }

    private function serverError(Throwable $e): Response
    {
        $debug = (bool) Config::get('app.debug', false);

        $message = $debug ? $e->getMessage() : 'An unexpected error occurred.';
        $response = $this->errorResponse(500, $message);

        if ($debug) {
            $response->data['error']['exception'] = $e::class;
            $response->data['error']['trace'] = explode("\n", $e->getTraceAsString());
        }

        return $response;
    }

    private function handleCors(Request $request): void
    {
        if (headers_sent()) {
            return;
        }

<<<<<<< HEAD
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '' ;
        $allowedOrigins = array_map('trim', explode(',', $_ENV['ALLOWED_ORIGINS'] ?? ''));

        if (in_array($origin, $allowedOrigins, true)){
            header("Access-Control-Allow-Origin: $origin");
        }
=======
        $origin = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
        $allowedOrigins = (array) Config::get('cors.allowed_origins', []);

        if ($origin !== '' && in_array($origin, $allowedOrigins, true)) {
            header("Access-Control-Allow-Origin: $origin");
        }

>>>>>>> ade85580d76035a407d02c6b70be06a70cf7599d
        header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');

        if ($request->method === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }
}
