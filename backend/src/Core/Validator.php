<?php

declare(strict_types=1);

namespace App\Core;

use App\Core\Exceptions\ValidationException;

/**
 * Small rule-based validator.
 *
 * Rules are expressed per field as a pipe-delimited string, e.g.
 *   ['name' => 'required|string|max:120', 'price' => 'required|numeric|min:0']
 *
 * Supported rules: required, nullable, string, integer, numeric, boolean,
 * date, email, in:a,b,c, min:n, max:n.
 *
 * Returns only the fields that were present and valid, with values cast to
 * their declared type. Throws ValidationException (422) on any failure.
 */
final class Validator
{
    /**
     * @param array<string, mixed>  $data
     * @param array<string, string> $rules
     * @return array<string, mixed>
     */
    public static function validate(array $data, array $rules): array
    {
        $validated = [];
        /** @var array<string, string[]> $errors */
        $errors = [];

        foreach ($rules as $field => $ruleString) {
            $ruleSet = self::parse($ruleString);
            $present = array_key_exists($field, $data);
            $value = $present ? $data[$field] : null;

            $isRequired = array_key_exists('required', $ruleSet);
            $isNullable = array_key_exists('nullable', $ruleSet);
            $isEmpty = !$present || $value === null || (is_string($value) && trim($value) === '');

            if ($isEmpty) {
                if ($present && $value === null && $isNullable) {
                    $validated[$field] = null;
                } elseif ($isRequired) {
                    $errors[$field][] = "The {$field} field is required.";
                }
                continue;
            }

            $fieldErrors = [];
            $cast = self::applyType($field, $value, $ruleSet, $fieldErrors);

            if ($fieldErrors === []) {
                self::applyConstraints($field, $cast, $ruleSet, $fieldErrors);
            }

            if ($fieldErrors === []) {
                $validated[$field] = $cast;
            } else {
                $errors[$field] = array_merge($errors[$field] ?? [], $fieldErrors);
            }
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        return $validated;
    }

    /**
     * @return array<string, string|null> rule name => argument (or null for valueless rules)
     */
    private static function parse(string $ruleString): array
    {
        $rules = [];

        foreach (explode('|', $ruleString) as $rule) {
            $rule = trim($rule);
            if ($rule === '') {
                continue;
            }
            [$name, $arg] = array_pad(explode(':', $rule, 2), 2, null);
            $rules[$name] = $arg;
        }

        return $rules;
    }

    /**
     * @param array<string, string|null> $rules
     * @param string[]                   $errors
     */
    private static function applyType(string $field, mixed $value, array $rules, array &$errors): mixed
    {
        if (array_key_exists('integer', $rules)) {
            if (!is_int($value) && !(is_string($value) && preg_match('/^-?\d+$/', $value))) {
                $errors[] = "The {$field} field must be an integer.";
                return $value;
            }
            return (int) $value;
        }

        if (array_key_exists('numeric', $rules)) {
            if (!is_numeric($value)) {
                $errors[] = "The {$field} field must be a number.";
                return $value;
            }
            return $value + 0;
        }

        if (array_key_exists('boolean', $rules)) {
            if (is_bool($value)) {
                return $value;
            }
            if (in_array($value, [0, 1, '0', '1', 'true', 'false'], true)) {
                return in_array($value, [1, '1', 'true'], true);
            }
            $errors[] = "The {$field} field must be true or false.";
            return $value;
        }

        if (array_key_exists('date', $rules)) {
            if (!is_string($value) || strtotime($value) === false) {
                $errors[] = "The {$field} field must be a valid date.";
            }
            return $value;
        }

        if (array_key_exists('email', $rules)) {
            if (!is_string($value) || !filter_var($value, FILTER_VALIDATE_EMAIL)) {
                $errors[] = "The {$field} field must be a valid email address.";
            }
            return $value;
        }

        if (array_key_exists('string', $rules)) {
            if (!is_string($value)) {
                $errors[] = "The {$field} field must be a string.";
                return $value;
            }
            return trim($value);
        }

        return $value;
    }

    /**
     * @param array<string, string|null> $rules
     * @param string[]                   $errors
     */
    private static function applyConstraints(string $field, mixed $value, array $rules, array &$errors): void
    {
        $size = is_string($value) ? mb_strlen($value) : (is_numeric($value) ? $value + 0 : null);

        if (array_key_exists('min', $rules) && $size !== null && $size < (float) $rules['min']) {
            $errors[] = is_string($value)
                ? "The {$field} field must be at least {$rules['min']} characters."
                : "The {$field} field must be at least {$rules['min']}.";
        }

        if (array_key_exists('max', $rules) && $size !== null && $size > (float) $rules['max']) {
            $errors[] = is_string($value)
                ? "The {$field} field must not exceed {$rules['max']} characters."
                : "The {$field} field must not exceed {$rules['max']}.";
        }

        if (array_key_exists('in', $rules)) {
            $allowed = explode(',', (string) $rules['in']);
            if (!in_array((string) $value, $allowed, true)) {
                $errors[] = "The {$field} field must be one of: " . implode(', ', $allowed) . '.';
            }
        }
    }
}
