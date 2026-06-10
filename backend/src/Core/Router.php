<?php

declare(strict_types=1);

namespace App\Core;

use App\Core\Exceptions\HttpException;
use App\Core\Exceptions\NotFoundException;

/**
 * Minimal regex-based router with middleware chain support.
 */
final class Router
{
    /** @var array<int, array{method: string, regex: string, params: string[], handler: array{0: class-string, 1: string}, middleware: array<int, class-string>}> */
    private array $routes = [];

    /**
     * @param array{0: class-string, 1: string} $handler
     * @param array<int, class-string>          $middleware
     */
    public function get(string $path, array $handler, array $middleware = []): void
    {
        $this->registerRoute('GET', $path, $handler, $middleware);
    }

    /**
     * @param array{0: class-string, 1: string} $handler
     * @param array<int, class-string>          $middleware
     */
    public function post(string $path, array $handler, array $middleware = []): void
    {
        $this->registerRoute('POST', $path, $handler, $middleware);
    }

    /**
     * @param array{0: class-string, 1: string} $handler
     * @param array<int, class-string>          $middleware
     */
    public function put(string $path, array $handler, array $middleware = []): void
    {
        $this->registerRoute('PUT', $path, $handler, $middleware);
    }

    /**
     * @param array{0: class-string, 1: string} $handler
     * @param array<int, class-string>          $middleware
     */
    public function patch(string $path, array $handler, array $middleware = []): void
    {
        $this->registerRoute('PATCH', $path, $handler, $middleware);
    }

    /**
     * @param array{0: class-string, 1: string} $handler
     * @param array<int, class-string>          $middleware
     */
    public function delete(string $path, array $handler, array $middleware = []): void
    {
        $this->registerRoute('DELETE', $path, $handler, $middleware);
    }

    /**
     * @param array{0: class-string, 1: string} $handler
     * @param array<int, class-string>          $middleware
     */
    private function registerRoute(
        string $method,
        string $path,
        array $handler,
        array $middleware = []
    ): void {
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
            'method'     => strtoupper($method),
            'regex'      => '#^' . $regex . '$#',
            'params'     => $params,
            'handler'    => $handler,
            'middleware' => $middleware,
        ];
    }

    public function dispatch(Request $request): Response
    {
        $match = $this->match($request);

        if (!$match) {
            $path = rtrim($request->path, '/') ?: '/';

            foreach ($this->routes as $route) {
                if (preg_match($route['regex'], $path)) {
                    throw new HttpException(405, "Method {$request->method} not allowed for {$path}.");
                }
            }

            throw new NotFoundException("No route matches {$request->method} {$request->path}.");
        }

        foreach ($match['middleware'] as $middlewareClass) {
            $middleware = new $middlewareClass();
            $response = $middleware->handle($request);

            if ($response) {
                return $response;
            }
        }

        [$controllerClass, $method] = $match['handler'];
        $controller = new $controllerClass();

        return $controller->$method($request);
    }

    /**
     * @return array{method: string, regex: string, params: string[], handler: array{0: class-string, 1: string}, middleware: array<int, class-string>}|null
     */
    private function match(Request $request): ?array
    {
        $path = rtrim($request->path, '/') ?: '/';

        foreach ($this->routes as $route) {
            if ($route['method'] !== $request->method) {
                continue;
            }

            if (preg_match($route['regex'], $path, $matches)) {
                array_shift($matches);

                $request->params = array_combine(
                    $route['params'],
                    array_map('rawurldecode', $matches)
                ) ?: [];

                return $route;
            }
        }

        return null;
    }
}
