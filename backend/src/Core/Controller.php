<?php

declare(strict_types=1);

namespace App\Core;

use App\Core\Exceptions\NotFoundException;

/**
 * Base controller. Controllers stay thin: they validate/translate HTTP, call a
 * service, and shape the Response. All business logic lives in the service layer.
 */
abstract class Controller
{
    /**
     * Validate the JSON body against a rule set.
     *
     * @param array<string, string> $rules
     * @return array<string, mixed>
     */
    protected function validate(Request $request, array $rules): array
    {
        return Validator::validate($request->body(), $rules);
    }

    /**
     * Read a required, positive integer route parameter (e.g. {id}).
     */
    protected function intParam(Request $request, string $key): int
    {
        $value = $request->param($key);

        if (!is_string($value) || !preg_match('/^\d+$/', $value)) {
            throw new NotFoundException("Invalid identifier for '{$key}'.");
        }

        return (int) $value;
    }
}
