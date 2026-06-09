<?php

declare(strict_types=1);

namespace App\Core\Exceptions;

use RuntimeException;

/**
 * Base exception that maps cleanly onto an HTTP error response. The front
 * controller turns any HttpException into a JSON error with the right status.
 */
class HttpException extends RuntimeException
{
    /**
     * @param array<string, string[]> $errors Field-keyed validation messages.
     */
    public function __construct(
        public readonly int $status,
        string $message,
        public readonly array $errors = [],
    ) {
        parent::__construct($message);
    }
}
