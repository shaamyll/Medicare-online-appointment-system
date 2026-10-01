<?php

namespace App\Middleware;

use App\Core\Request;
use App\Core\Response;
use App\Core\Jwt;
use App\Config\Database;

class AuthMiddleware {
    public static function handle(Request $request): void {
        $authHeader = $request->getHeader('authorization');
        
        if (!$authHeader && isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        }

        if (!$authHeader || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            Response::error('Unauthorized. Missing authentication token.', 401);
            return;
        }

        $token = trim($matches[1]);
        $payload = Jwt::decode($token);

        if (!$payload || !isset($payload['sub'])) {
            Response::error('Unauthorized. Invalid or expired token.', 401);
            return;
        }

        // Verify user still exists and is active in database
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT id, name, email, role, phone, status, created_at FROM users WHERE id = ?");
        $stmt->execute([$payload['sub']]);
        $user = $stmt->fetch();

        if (!$user) {
            Response::error('Unauthorized. User no longer exists.', 401);
            return;
        }

        if ($user['status'] === 'inactive' || $user['status'] === 'rejected') {
            Response::error('Your account is not active. Please contact administrator.', 403);
            return;
        }

        $request->setUser($user);
    }
}
