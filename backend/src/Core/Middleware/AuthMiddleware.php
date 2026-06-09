<?php

declare(strict_types=1);

namespace App\Core\Middleware;

use App\Core\RequestInterface;
use App\Core\Response;
use App\Services\AuthService;
use App\Services\AuthServiceInterface;
use Throwable;

/**
 * Middleware that validates bearer tokens on protected routes.
 */
final class AuthMiddleware
{
    public function __construct(
        private ?AuthServiceInterface $auth = null,
    ) {
    }

    /**
     * Validate the bearer token in the request.
     */
    public function handle(RequestInterface $request): ?Response
    {
        $token = $request->bearerToken();

        if (!$token) {
            return Response::unauthorized(['message' => 'Missing or invalid Authorization header.']);
        }

        try {
            $user = $this->auth()->authenticate($token);
            $request->setUser($user);

            return null;
        } catch (Throwable $e) {
            return Response::unauthorized(['message' => $e->getMessage()]);
        }
    }

    private function auth(): AuthServiceInterface
    {
        return $this->auth ??= new AuthService();
    }
}
