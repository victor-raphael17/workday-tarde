<?php

declare(strict_types=1);

namespace App\Core\Exceptions;

/**
 * Thrown when a requested resource (or route) does not exist. Maps to 404.
 */
final class NotFoundException extends HttpException
{
    public function __construct(string $message = 'Resource not found.')
    {
        parent::__construct(404, $message);
    }
}
