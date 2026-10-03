<?php

namespace App\Modules\Auth;

use App\Core\Request;
use App\Core\Response;
use Exception;

class AuthController {
    private AuthService $authService;

    public function __construct() {
        $this->authService = new AuthService();
    }

    public function login(Request $request): void {
        $email = $request->get('email');
        $password = $request->get('password');

        if (empty($email) || empty($password)) {
            Response::error('Email and password are required.', 400);
            return;
        }

        try {
            $result = $this->authService->userLogin($email, $password);
            Response::success($result, 'Login successful');
        } catch (Exception $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            Response::error($e->getMessage(), $code);
        }
    }

    public function doctorLogin(Request $request): void {
        $email = $request->get('email');
        $password = $request->get('password');

        if (empty($email) || empty($password)) {
            Response::error('Email and password are required.', 400);
            return;
        }

        try {
            $result = $this->authService->doctorLogin($email, $password);
            Response::success($result, 'Login successful');
        } catch (Exception $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            Response::error($e->getMessage(), $code);
        }
    }

    public function register(Request $request): void {
        $data = $request->getBody();

        try {
            $result = $this->authService->patientRegister($data);
            Response::success($result, 'Registration successful', 201);
        } catch (Exception $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            Response::error($e->getMessage(), $code);
        }
    }

    public function doctorRegister(Request $request): void {
        $data = $request->getBody();

        try {
            $result = $this->authService->doctorRegister($data);
            $message = $result['message'] ?? 'Doctor application submitted successfully';
            Response::success($result, $message, 201);
        } catch (Exception $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            Response::error($e->getMessage(), $code);
        }
    }

    public function me(Request $request): void {
        $currentUser = $request->getUser();
        if (!$currentUser) {
            Response::error('Unauthorized', 401);
            return;
        }

        try {
            $result = $this->authService->getMe($currentUser['id']);
            Response::success($result, 'Profile retrieved');
        } catch (Exception $e) {
            Response::error($e->getMessage(), 404);
        }
    }

    public function updateProfile(Request $request): void {
        $currentUser = $request->getUser();
        if (!$currentUser) {
            Response::error('Unauthorized', 401);
            return;
        }

        try {
            $result = $this->authService->updateUserProfile($currentUser['id'], $request->getBody());
            Response::success($result, 'Profile updated successfully');
        } catch (Exception $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            Response::error($e->getMessage(), $code);
        }
    }
}
