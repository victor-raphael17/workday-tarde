<?php

declare(strict_types=1);

namespace App\Core\Exceptions;

/**
 * Thrown when a request lacks valid authentication — missing/invalid bearer
 * token, or wrong sign-in credentials. Maps to 401 (Unauthorized).
 */
final class UnauthorizedException extends HttpException
{
    public function __construct(string $message = 'Authentication required.')
    {
        parent::__construct(401, $message);
    }
}
