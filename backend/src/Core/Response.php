<?php

declare(strict_types=1);

namespace App\Core;

final class Response
{
    /**
     * @param array<string, string> $headers
     */
    public function __construct(
        public mixed $data = null,
        public int $status = 200,
        public array $headers = [],
    ) {
    }

    public static function json(mixed $data, int $status = 200): self
    {
        return new self($data, $status);
    }

    public static function ok(mixed $data): self
    {
        return new self(['data' => $data], 200);
    }

    public static function created(mixed $data): self
    {
        return new self(['data' => $data], 201);
    }

    public static function noContent(): self
    {
        return new self(null, 204);
    }

    public static function unauthorized(mixed $data = null): self
    {
        return new self($data, 401);
    }

    public function getStatusCode(): int
    {
        return $this->status;
    }

    public function send(): void
    {
        if (!headers_sent()) {
            http_response_code($this->status);
            header('Content-Type: application/json; charset=utf-8');

            foreach ($this->headers as $name => $value) {
                header($name . ': ' . $value);
            }
        }

        if ($this->status === 204 || $this->data === null) {
            return;
        }

        echo json_encode(
            $this->data,
            JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT
        );
    }
}
