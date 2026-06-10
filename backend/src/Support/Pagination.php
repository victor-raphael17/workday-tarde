<?php

declare(strict_types=1);

namespace App\Support;

final class Pagination
{
    public const DEFAULT_PAGE = 1;
    public const DEFAULT_PER_PAGE = 25;
    public const MAX_PER_PAGE = 100;

    public function __construct(
        public readonly int $page = self::DEFAULT_PAGE,
        public readonly int $perPage = self::DEFAULT_PER_PAGE,
    ) {}

    public static function fromQuery(mixed $page, mixed $perPage): self
    {
        $page = filter_var($page, FILTER_VALIDATE_INT, ['options' => ['default' => self::DEFAULT_PAGE]]);
        $perPage = filter_var($perPage, FILTER_VALIDATE_INT, ['options' => ['default' => self::DEFAULT_PER_PAGE]]);

        $page = max(1, (int) $page);
        $perPage = max(1, min(self::MAX_PER_PAGE, (int) $perPage));

        return new self($page, $perPage);
    }

    public function offset(): int
    {
        return ($this->page - 1) * $this->perPage;
    }

    /**
     * @return array<string, int>
     */
    public function meta(int $total): array
    {
        return [
            'page'        => $this->page,
            'per_page'    => $this->perPage,
            'total'       => $total,
            'total_pages' => (int) ceil($total / $this->perPage),
        ];
    }
}
