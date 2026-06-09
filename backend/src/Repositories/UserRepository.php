<?php

declare(strict_types=1);

namespace App\Repositories;

/**
 * Data access for staff users. The password hash is only ever read here for
 * credential checks in the service layer; it is never returned to clients.
 */
final class UserRepository extends Repository
{
    private const COLUMNS = 'id, name, email, role, created_at, updated_at';

    /**
     * Look a user up by email (case-insensitive), including the password hash
     * so the service can verify credentials.
     *
     * @return array<string, mixed>|null
     */
    public function findByEmail(string $email): ?array
    {
        return $this->fetchOne(
            'SELECT ' . self::COLUMNS . ', password_hash FROM users WHERE lower(email) = lower(:email)',
            ['email' => $email]
        );
    }

    /**
     * @return array<string, mixed>|null
     */
    public function find(int $id): ?array
    {
        return $this->fetchOne(
            'SELECT ' . self::COLUMNS . ' FROM users WHERE id = :id',
            ['id' => $id]
        );
    }
}
