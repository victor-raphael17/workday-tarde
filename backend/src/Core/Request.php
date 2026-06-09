<?php

declare(strict_types=1);

namespace App\Core;

use App\Core\Exceptions\HttpException;

final class Request implements RequestInterface
{
    /** @var array<string, string> */
    public array $params = [];

    /** @var array<string, mixed>|null */
    private ?array $body = null;

    /** @var array<string, mixed>|null */
    private ?array $user = null; // ← adicionado

    /**
     * @param array<string, mixed>  $query
     * @param array<string, string> $headers
     */
    public function __construct(
        public readonly string $method,
        public readonly string $path,
        public readonly array $query,
        private readonly string $rawBody,
        public readonly array $headers = [],
    ) {
    }

    public static function capture(): self
    {
        $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        $uri = $_SERVER['REQUEST_URI'] ?? '/';
        $path = parse_url($uri, PHP_URL_PATH) ?: '/';
        $path = '/' . trim(rawurldecode($path), '/');

        return new self($method, $path, $_GET, file_get_contents('php://input') ?: '', self::captureHeaders());
    }

    private static function captureHeaders(): array
    {
        $headers = [];

        foreach ($_SERVER as $key => $value) {
            if (str_starts_with((string) $key, 'HTTP_')) {
                $name = strtolower(str_replace('_', '-', substr((string) $key, 5)));
                $headers[$name] = (string) $value;
            }
        }

        if (!isset($headers['authorization']) && isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $headers['authorization'] = (string) $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        }

        return $headers;
    }

    public function header(string $name, ?string $default = null): ?string
    {
        return $this->headers[strtolower($name)] ?? $default;
    }

    public function bearerToken(): ?string
    {
        $header = $this->header('authorization', '') ?? '';

        if (preg_match('/^Bearer\s+(.+)$/i', trim($header), $m) === 1) {
            return trim($m[1]);
        }

        return null;
    }

    /** @return array<string, mixed> */
    public function body(): array
    {
        if ($this->body !== null) {
            return $this->body;
        }

        if (trim($this->rawBody) === '') {
            return $this->body = [];
        }

        $decoded = json_decode($this->rawBody, true);

        if (!is_array($decoded)) {
            throw new HttpException(400, 'Request body must be valid JSON.');
        }

        return $this->body = $decoded;
    }

    public function input(string $key, mixed $default = null): mixed
    {
        return $this->body()[$key] ?? $default;
    }

    public function query(string $key, mixed $default = null): mixed
    {
        return $this->query[$key] ?? $default;
    }

    public function param(string $key, mixed $default = null): mixed
    {
        return $this->params[$key] ?? $default;
    }

 /** @param array<string, mixed> $user */
public function setUser(array $user): void
{
    $this->user = $user;
}

/** @return array<string, mixed>|null */
public function getUser(): ?array
{
    return $this->user;
}

/** @return array<string, mixed>|null */
public function user(): ?array
{
    return $this->user;
}

/** @return array<string, mixed> */
public function requireUser(): array
{
    if ($this->user === null) {
        throw new HttpException(
            401,
            'Authentication required.'
        );
    }

    return $this->user;
}
}
