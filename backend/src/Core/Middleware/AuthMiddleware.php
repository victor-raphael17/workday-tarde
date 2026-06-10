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
    ) {}

    /**
     * Validate the bearer token in the request.
     */
    public function handle(RequestInterface $request): ?Response
    {
        $token = $request->bearerToken();

        // Correção: Garante que o token não é nulo, não é vazio e remove espaços invisíveis
        if ($token === null || trim($token) === '') {
            return Response::unauthorized(['message' => 'Missing or invalid Authorization header.']);
        }

        try {
            $user = $this->auth()->authenticate($token);
            if (!$user) {
                return Response::unauthorized(['message' => 'Invalid or expired token.']);
            }
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
