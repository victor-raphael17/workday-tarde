<?php

declare(strict_types=1);

namespace App\Core;

interface RequestInterface
{
    public function header(string $name, ?string $default = null): ?string;
    public function bearerToken(): ?string;

    /** @return array<string, mixed> */
    public function body(): array;

    public function input(string $key, mixed $default = null): mixed;
    public function query(string $key, mixed $default = null): mixed;
    public function param(string $key, mixed $default = null): mixed;

    /** @param array<string, mixed> $user */
    public function setUser(array $user): void;

    /** @return array<string, mixed>|null */
    public function getUser(): ?array;

    /** @return array<string, mixed>|null */
    public function user(): ?array;

    /** @return array<string, mixed> */
    public function requireUser(): array;
}