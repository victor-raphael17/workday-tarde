<?php

declare(strict_types=1);

namespace Tests\Unit\Middleware;

use App\Core\Middleware\AuthMiddleware;
use App\Core\RequestInterface;
use App\Core\Response;
use App\Services\AuthServiceInterface;
use PHPUnit\Framework\TestCase;

final class AuthMiddlewareTest extends TestCase
{
    private AuthServiceInterface $authService;
    private RequestInterface $request;
    private AuthMiddleware $middleware;

    protected function setUp(): void
    {
        $this->authService = $this->createMock(AuthServiceInterface::class);
        $this->request     = $this->createMock(RequestInterface::class);
        $this->middleware  = new AuthMiddleware($this->authService);
    }

    public function test_retorna_401_quando_token_ausente(): void
    {
        $this->request->method('bearerToken')->willReturn(null);

        $response = $this->middleware->handle($this->request);

        $this->assertInstanceOf(Response::class, $response);
        $this->assertEquals(401, $response->getStatusCode());
    }

    public function test_retorna_401_quando_token_invalido(): void
    {
        $this->request->method('bearerToken')->willReturn('token-invalido');

        $this->authService
            ->method('authenticate')
            ->willThrowException(new \RuntimeException('Token inválido.'));

        $response = $this->middleware->handle($this->request);

        $this->assertInstanceOf(Response::class, $response);
        $this->assertEquals(401, $response->getStatusCode());
    }

    public function test_passa_quando_token_valido(): void
    {
        $fakeUser = ['id' => 1, 'name' => 'Test User', 'email' => 'test@test.com'];

        $this->request->method('bearerToken')->willReturn('token-valido');
        $this->authService->method('authenticate')->willReturn($fakeUser);

        $this->request->expects($this->once())->method('setUser')->with($fakeUser);

        $result = $this->middleware->handle($this->request);

        $this->assertNull($result);
    }
}
