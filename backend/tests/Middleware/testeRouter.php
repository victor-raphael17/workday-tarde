<?php

namespace Tests\Core;

use PHPUnit\Framework\TestCase;
use src\Core\Router;
use src\Core\Request;
use src\Core\Middleware\AuthMiddleware;

class RouterTest extends TestCase
{
    public function test_middleware_bloqueia_requisicao_sem_token()
    {
        $router = new Router();
        
        // Simula uma rota protegida
        $router->get('/protegido', ['AlgumController::class', 'metodo'], [AuthMiddleware::class]);
        
        // Simula uma request (ajuste conforme a sua classe real)
        $request = new Request('GET', '/protegido');
        
        // Dispara o router
        $response = $router->dispatch($request);
        
        // Verifica se o middleware realmente devolveu o erro 401
        $this->assertEquals(401, $response->status); // Ajuste para a sua propriedade real
    }
}