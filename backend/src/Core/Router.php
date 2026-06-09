<?php

declare(strict_types=1);

namespace App\Core;

use App\Core\Exceptions\HttpException;
use App\Core\Exceptions\NotFoundException;

/**
 * Minimal regex-based router.
 *
 * Routes are registered as (method, path, [ControllerClass, action]). Path
 * segments wrapped in braces — e.g. /medications/{id} — become named route
 * parameters captured into the Request.
 */
final class Router
{
    /** @var array<int, array{method: string, regex: string, params: string[], handler: array{0: class-string, 1: string}}> */
    private array $routes = [];

    /**
     * @param array{0: class-string, 1: string} $handler
     */
    public function add(string $method, string $path, array $handler): void
    {
        $params = [];
        $regex = preg_replace_callback(
            '#\{([a-zA-Z_][a-zA-Z0-9_]*)\}#',
            static function (array $m) use (&$params): string {
                $params[] = $m[1];
                return '([^/]+)';
            },
            rtrim($path, '/') ?: '/'
        );

        $this->routes[] = [
            'method'  => strtoupper($method),
            'regex'   => '#^' . $regex . '$#',
            'params'  => $params,
            'handler' => $handler,
        ];
    }

    public function get(string $path, array $handler): void
    {
        $this->add('GET', $path, $handler);
    }

    public function post(string $path, array $handler): void
    {
        $this->add('POST', $path, $handler);
    }

    public function put(string $path, array $handler): void
    {
        $this->add('PUT', $path, $handler);
    }

    public function patch(string $path, array $handler): void
    {
        $this->add('PATCH', $path, $handler);
    }

    public function delete(string $path, array $handler): void
    {
        $this->add('DELETE', $path, $handler);
    }

    public function dispatch(Request $request): Response
    {
        $path = rtrim($request->path, '/') ?: '/';
        $methodMatched = false;

        foreach ($this->routes as $route) {
            if (!preg_match($route['regex'], $path, $matches)) {
                continue;
            }

            // A path match with the wrong verb => 405 rather than 404.
            if ($route['method'] !== $request->method) {
                $methodMatched = true;
                continue;
            }

            array_shift($matches);
            $request->params = array_combine($route['params'], array_map('rawurldecode', $matches)) ?: [];

            [$class, $action] = $route['handler'];
            $controller = new $class();

            return $controller->$action($request);
        }

        if ($methodMatched) {
            throw new HttpException(405, "Method {$request->method} not allowed for {$path}.");
        }

        throw new NotFoundException("No route matches {$request->method} {$path}.");
    }
}
