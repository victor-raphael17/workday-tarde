<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\Exceptions\UnauthorizedException;
use App\Repositories\SessionRepository;
use App\Repositories\UserRepository;

/**
 * Authentication business logic.
 *
 * Sign-in verifies a bcrypt password and issues an opaque bearer token: a
 * random secret returned to the client, of which only the SHA-256 hash is
 * persisted as a session row. Subsequent requests present the token in an
 * `Authorization: Bearer <token>` header; we hash it and look up the matching
 * live session. Logout deletes the session row.
 */
final class AuthService
{
    public function __construct(
        private readonly UserRepository $users = new UserRepository(),
        private readonly SessionRepository $sessions = new SessionRepository(),
    ) {
    }

    /**
     * Verify credentials and start a session.
     *
     * @return array<string, mixed> { token, expires_at, user }
     */
    public function login(string $email, string $password): array
    {
        $user = $this->users->findByEmail($email);

        // Always run a hash check so a missing user and a wrong password take a
        // similar amount of time (avoids trivial user-enumeration by timing).
        $hash = $user['password_hash'] ?? '$2y$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin';

        if (!password_verify($password, $hash) || $user === null) {
            throw new UnauthorizedException('Invalid email or password.');
        }

        return $this->issueToken($user);
    }

    /**
     * Resolve the authenticated user from a bearer token, or throw 401.
     *
     * @return array<string, mixed>
     */
    public function authenticate(?string $token): array
    {
        $token = $token !== null ? trim($token) : '';

        if ($token === '') {
            throw new UnauthorizedException('A bearer token is required.');
        }

        $session = $this->sessions->findValid(hash('sha256', $token));

        if ($session === null) {
            throw new UnauthorizedException('Your session is invalid or has expired.');
        }

        $user = $this->users->find((int) $session['user_id']);

        if ($user === null) {
            throw new UnauthorizedException('Your session is invalid or has expired.');
        }

        return $this->present($user);
    }

    /** End the session tied to a bearer token (idempotent). */
    public function logout(?string $token): void
    {
        $token = $token !== null ? trim($token) : '';

        if ($token !== '') {
            $this->sessions->deleteByTokenHash(hash('sha256', $token));
        }
    }

    /**
     * @param array<string, mixed> $user
     * @return array<string, mixed>
     */
    private function issueToken(array $user): array
    {
        $token = bin2hex(random_bytes(32));
        $ttl = max(60, (int) config('auth.session_ttl', 43200));
        $expiresAt = (new \DateTimeImmutable("+{$ttl} seconds"))->format('Y-m-d H:i:sP');

        $this->sessions->create((int) $user['id'], hash('sha256', $token), $expiresAt);

        return [
            'token'      => $token,
            'expires_at' => $expiresAt,
            'user'       => $this->present($user),
        ];
    }

    /**
     * Public shape of a user — never includes the password hash.
     *
     * @param array<string, mixed> $user
     * @return array<string, mixed>
     */
    private function present(array $user): array
    {
        return [
            'id'         => (int) $user['id'],
            'name'       => $user['name'],
            'email'      => $user['email'],
            'role'       => $user['role'],
            'created_at' => $user['created_at'] ?? null,
            'updated_at' => $user['updated_at'] ?? null,
        ];
    }
}
