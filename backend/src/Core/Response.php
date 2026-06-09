<?php

declare(strict_types=1);

namespace App\Core;

/**
 * JSON HTTP response. Controllers return one of these; the front controller
 * sends it. There are no HTML/Blade views — this API speaks JSON only.
 */
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

    /** 200 with a {"data": ...} envelope. */
    public static function ok(mixed $data): self
    {
        return new self(['data' => $data], 200);
    }

    /** 201 with a {"data": ...} envelope. */
    public static function created(mixed $data): self
    {
        return new self(['data' => $data], 201);
    }

    public static function noContent(): self
    {
        return new self(null, 204);
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
