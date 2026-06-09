<?php

declare(strict_types=1);

namespace App\Repositories;

/**
 * Data access for bearer-token sessions. Only the SHA-256 hash of a token is
 * stored; the raw token lives solely in the client. A session row is the
 * server-side record that makes logout (and expiry) possible.
 */
final class SessionRepository extends Repository
{
    /**
     * Create a session for a user and return its row.
     *
     * @return array<string, mixed>
     */
    public function create(int $userId, string $tokenHash, string $expiresAt): array
    {
        $sql = 'INSERT INTO sessions (user_id, token_hash, expires_at)
                VALUES (:user_id, :token_hash, :expires_at)
                RETURNING id, user_id, token_hash, expires_at, created_at';

        return $this->fetchOne($sql, [
            'user_id'    => $userId,
            'token_hash' => $tokenHash,
            'expires_at' => $expiresAt,
        ]) ?? [];
    }

    /**
     * Find a live (non-expired) session by token hash.
     *
     * @return array<string, mixed>|null
     */
    public function findValid(string $tokenHash): ?array
    {
        return $this->fetchOne(
            'SELECT id, user_id, token_hash, expires_at, created_at
               FROM sessions
              WHERE token_hash = :token_hash AND expires_at > now()',
            ['token_hash' => $tokenHash]
        );
    }

    public function deleteByTokenHash(string $tokenHash): bool
    {
        return $this->execute(
            'DELETE FROM sessions WHERE token_hash = :token_hash',
            ['token_hash' => $tokenHash]
        ) > 0;
    }

    /** Housekeeping: drop expired sessions. */
    public function purgeExpired(): int
    {
        return $this->execute('DELETE FROM sessions WHERE expires_at <= now()');
    }
}
