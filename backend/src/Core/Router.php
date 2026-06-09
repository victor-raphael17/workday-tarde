<?php

declare(strict_types=1);

namespace App\Core;

use App\Core\Exceptions\HttpException;
use App\Core\Exceptions\NotFoundException;

/**
 * Minimal regex-based router with Middleware chain support.
 */
final class Router
{
    /** * @var array<int, array{method: string, regex: string, params: string[], handler: array{0: class-string, 1: string}, middleware: string[]}> 
     */
    private array $routes = [];

    public function get(string $path, array $handler, array $middleware = []): void
    {
        $this->registerRoute('GET', $path, $handler, $middleware);
    }

    public function post(string $path, array $handler, array $middleware = []): void
    {
        $this->registerRoute('POST', $path, $handler, $middleware);
    }

    public function put(string $path, array $handler, array $middleware = []): void
    {
        $this->registerRoute('PUT', $path, $handler, $middleware);
    }

    public function patch(string $path, array $handler, array $middleware = []): void
    {
        $this->registerRoute('PATCH', $path, $handler, $middleware);
    }

    public function delete(string $path, array $handler, array $middleware = []): void
    {
        $this->registerRoute('DELETE', $path, $handler, $middleware);
    }

    /**
     * Converte o caminho amigável em Regex e registra a rota na memória.
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

    /**
     * Processa a requisição, passa pelos middlewares e chama o Controller.
     */
    public function dispatch(Request $request): Response
    {
        $match = $this->match($request);

        // Se o método match retornar null, significa que não achou a rota exata.
        if (!$match) {
            $path = rtrim($request->path, '/') ?: '/';
            
            // Verifica se a rota existe em outro verbo HTTP (para retornar 405 ao invés de 404)
            foreach ($this->routes as $route) {
                if (preg_match($route['regex'], $path)) {
                    throw new HttpException(405, "Method {$request->method} not allowed for {$path}.");
                }
            }
            
            throw new NotFoundException("No route matches {$request->method} {$request->path}.");
        }

        // 1. Executa a cadeia de middlewares
        foreach ($match['middleware'] as $middlewareClass) {
            $middleware = new $middlewareClass();
            $response = $middleware->handle($request);
            
            // Se o middleware barrar a requisição e retornar uma Response (ex: 401),
            // o fluxo é interrompido imediatamente e a resposta é devolvida.
            if ($response) {
                return $response; 
            }
        }

        // 2. Instancia o Controller e executa o método (Ação)
        [$controllerClass, $method] = $match['handler'];
        $controller = new $controllerClass();
        
        return $controller->$method($request);
    }

    /**
     * Tenta encontrar uma rota que case com a requisição atual e injeta os parâmetros.
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
                
                // Injeta os parâmetros dinâmicos da URL de volta no objeto Request
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