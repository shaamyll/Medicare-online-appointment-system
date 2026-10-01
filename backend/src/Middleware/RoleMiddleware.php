<?php

namespace App\Middleware;

use App\Core\Request;
use App\Core\Response;

class RoleMiddleware {
    public static function hasRole(Request $request, array $allowedRoles): void {
        $user = $request->getUser();
        if (!$user) {
            Response::error('Unauthorized. Authentication required.', 401);
            return;
        }

        if (!in_array($user['role'], $allowedRoles, true)) {
            Response::error('Forbidden. You do not have permission to access this resource.', 403);
            return;
        }

        // Special check: Doctor must have 'active' status to access doctor-specific routes
        if ($user['role'] === 'doctor' && $user['status'] !== 'active') {
            Response::error('Your doctor account is pending approval by the administrator.', 403);
            return;
        }
    }
}
