<?php

declare(strict_types=1);

namespace App\Core\Middleware;

use App\Core\Request;
use App\Core\Response;
use App\Core\RequestInterface;
use App\Services\AuthServiceInterface; 
use App\Services\AuthService;

/**
 * Middleware that validates bearer tokens on protected routes.
 * 
 * Usage:
 *   $r->get('/api/medications', [...], [AuthMiddleware::class])
 */
final class AuthMiddleware
{
    public function __construct(
        private readonly AuthServiceInterface $auth = new AuthService(),
    ) {
    }

    /**
     * Validate the bearer token in the request.
     * 
     * If valid, returns null (middleware passes through).
     * If invalid or missing, returns a 401 response (blocks the request).
     */
    public function handle(RequestInterface $request): ?Response
    {
        $token = $request->bearerToken();

        if (!$token) {
            return Response::unauthorized(['message' => 'Missing or invalid Authorization header.']);
        }

        try {
            $user = $this->auth->authenticate($token);
            // Store authenticated user on request for controllers to access
            $request->setUser($user);
            return null; // ✓ Pass through to controller
        } catch (\Throwable $e) {
            return Response::unauthorized(['message' => $e->getMessage()]);
        }
    }
}

?>