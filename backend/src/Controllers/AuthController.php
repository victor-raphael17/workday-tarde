<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Request;
use App\Core\Response;
use App\Services\AuthService;
use App\Support\RateLimit; // Importa o nosso novo suporte
use App\Core\Exceptions\UnauthorizedException; // Importa a exceção de erro de login

final class AuthController extends Controller
{
    private readonly RateLimit $rateLimit;

    public function __construct(
        private readonly AuthService $auth = new AuthService(),
    ) {
        // Instancia o limitador
        $this->rateLimit = new RateLimit();
    }

    /** POST /api/auth/login */
    public function login(Request $request): Response
    {
        $data = $this->validate($request, [
            'email'    => 'required|email|max:160',
            'password' => 'required|string|max:200',
        ]);

        $email = $data['email'];

        // 1. Verificar se o e-mail já excedeu o limite
        if ($this->rateLimit->tooManyAttempts($email)) {
            
            // TAREFA: Log das tentativas bloqueadas (usando o error_log nativo ou classe de Log do projeto)
            error_log("SECURITY WARNING: Brute-force detectado e bloqueado para o e-mail: {$email}");

            $retryAfter = $this->rateLimit->remainingSeconds($email);

            // TAREFA: Adicionar Response::tooManyRequests() (429 status)
            return Response::tooManyRequests([
                'error' => 'Muitas tentativas de login. Acesso bloqueado por 5 minutos.',
                'retry_after' => $retryAfter
            ], $retryAfter);
        }

        try {
            // Tenta efetuar o login
            $result = $this->auth->login($data['email'], $data['password']);

            // Se deu certo, limpa o contador do e-mail
            $this->rateLimit->clear($email);

            return Response::ok($result);

        } catch (UnauthorizedException $e) {
            // Se errou a senha (lançou erro 401), contabiliza o erro no RateLimit
            $this->rateLimit->hit($email);
            
            // Repassa a exceção para o sistema tratar o 401 normalmente
            throw $e;
        }
    }

    /** GET /api/auth/me */
    public function me(Request $request): Response
    {
        return Response::ok($this->auth->authenticate($request->bearerToken()));
    }

    /** POST /api/auth/logout */
    public function logout(Request $request): Response
    {
        $this->auth->logout($request->bearerToken());

        return Response::noContent();
    }
}
