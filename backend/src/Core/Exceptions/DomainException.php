<?php

declare(strict_types=1);

namespace App\Core\Exceptions;

/**
 * Thrown by the service layer when a business rule is violated — e.g. selling
 * more units than are on hand, or dispensing an already-dispensed prescription.
 * Maps to 422 (Unprocessable Entity): the request was well-formed but cannot be
 * fulfilled in the current state.
 */
final class DomainException extends HttpException
{
    public function __construct(string $message)
    {
        parent::__construct(422, $message);
    }
}
