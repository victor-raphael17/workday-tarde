<?php

declare(strict_types=1);

namespace App\Support;

final class RateLimit
{
    private int $maxAttempts = 5;
    private int $decaySeconds = 300; // 5 minutos

    private function getCachePath(string $email): string
    {
        // Cria um arquivo temporário único por e-mail na pasta temp do sistema
        return sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'bf_limit_' . md5($email) . '.json';
    }

    private function getCache(string $email): array
    {
        $path = $this->getCachePath($email);
        if (!file_exists($path)) {
            return ['attempts' => 0, 'expires_at' => 0];
        }

        $data = json_decode((string)file_get_contents($path), true);
        
        // Se o tempo expirou, reseta o contador
        if (time() > ($data['expires_at'] ?? 0)) {
            $this->clear($email);
            return ['attempts' => 0, 'expires_at' => 0];
        }

        return $data;
    }

    public function tooManyAttempts(string $email): bool
    {
        $cache = $this->getCache($email);
        return $cache['attempts'] >= $this->maxAttempts;
    }

    public function hit(string $email): void
    {
        $cache = $this->getCache($email);
        $path = $this->getCachePath($email);

        if ($cache['attempts'] === 0) {
            // Primeira falha define o início da janela de 5 minutos
            $cache['expires_at'] = time() + $this->decaySeconds;
        }

        $cache['attempts']++;

        file_put_contents($path, json_encode($cache));
    }

    public function clear(string $email): void
    {
        $path = $this->getCachePath($email);
        if (file_exists($path)) {
            @unlink($path);
        }
    }

    public function remainingSeconds(string $email): int
    {
        $cache = $this->getCache($email);
        $remaining = $cache['expires_at'] - time();
        return $remaining > 0 ? $remaining : 0;
    }
}