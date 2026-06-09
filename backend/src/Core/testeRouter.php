<?php

// 1. Carrega todas as classes reais do seu projeto
require_once __DIR__ . '/vendor/autoload.php';

use App\Core\Router;
use App\Core\Request;
use App\Core\Response;
use App\Core\Middleware\AuthMiddleware; // Ajuste se o namespace for diferente

try {
    // 2. Instancia o seu Router real
    $router = new Router();

    // 3. Registra uma rota de teste usando uma função anônima (Closure)
    // Usamos um array vazio [] ou null temporariamente no lugar do Controller para focar só no middleware
    $router->get('/teste-middleware', function() {
        // Se chegar aqui, o middleware deixou passar!
        $response = new Response();
        // Ajuste os métodos abaixo conforme a sua classe Response real funciona
        $response->status = 200; 
        $response->body = "Sucesso! Chegou no final da rota.";
        return $response;
    }, [AuthMiddleware::class]);

    // 4. Cria uma Request falsa para simular o acesso
    // Ajuste a criação da Request conforme o construtor da sua classe real exige
    $request = new Request();
    $request->method = 'GET';
    $request->path = '/teste-middleware';
    // $_SERVER['Authorization'] = 'Bearer invalid'; // Descomente para testar o bloqueio

    // 5. Roda o dispatch
    echo "Iniciando teste...\n";
    $response = $router->dispatch($request);
    
    // 6. Mostra o resultado
    echo "Status Final: " . $response->status . "\n"; // Deve ser 401 ou 200

} catch (\Exception $e) {
    echo "Erro capturado: " . $e->getMessage() . "\n";
}