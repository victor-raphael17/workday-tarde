<?php

declare(strict_types=1);

namespace App\Services;

interface AuthServiceInterface
{
    /**
     * @return array<string, mixed>
     */
    public function login(string $email, string $password): array;

    /**
     * @return array<string, mixed>
     */
    public function authenticate(?string $token): array;

    public function logout(?string $token): void;
}