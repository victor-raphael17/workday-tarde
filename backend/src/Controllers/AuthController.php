<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Core\Request;
use App\Core\Response;
use App\Services\AuthService;

/**
 * Authentication endpoints: sign in, sign out, and current user.
 *
 * Sign-in returns a bearer token the client sends back as
 * `Authorization: Bearer <token>` on later requests.
 */
final class AuthController extends Controller
{
    public function __construct(
        private readonly AuthService $auth = new AuthService(),
    ) {
    }

    /** POST /api/auth/login */
    public function login(Request $request): Response
    {
        $data = $this->validate($request, [
            'email'    => 'required|email|max:160',
            'password' => 'required|string|max:200',
        ]);

        return Response::ok($this->auth->login($data['email'], $data['password']));
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
