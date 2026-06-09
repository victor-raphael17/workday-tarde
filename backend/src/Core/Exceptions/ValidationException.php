<?php

declare(strict_types=1);

namespace App\Core\Exceptions;

/**
 * Thrown when request input fails validation. Maps to 422 and carries the
 * per-field error messages so the client can highlight the offending inputs.
 */
final class ValidationException extends HttpException
{
    /**
     * @param array<string, string[]> $errors
     */
    public function __construct(array $errors, string $message = 'The given data was invalid.')
    {
        parent::__construct(422, $message, $errors);
    }
}
