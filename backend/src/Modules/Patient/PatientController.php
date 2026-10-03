<?php

namespace App\Modules\Patient;

use App\Core\Request;
use App\Core\Response;
use Exception;

class PatientController {
    private PatientService $service;

    public function __construct() {
        $this->service = new PatientService();
    }

    public function getProfile(Request $request): void {
        $user = $request->getUser();
        if (!$user) {
            Response::error('Unauthorized', 401);
            return;
        }

        try {
            $data = $this->service->getProfile($user['id']);
            Response::success($data);
        } catch (Exception $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            Response::error($e->getMessage(), $code);
        }
    }

    public function updateProfile(Request $request): void {
        $user = $request->getUser();
        if (!$user) {
            Response::error('Unauthorized', 401);
            return;
        }

        try {
            $data = $this->service->updateProfile($user['id'], $request->getBody());
            Response::success($data, 'Profile updated successfully');
        } catch (Exception $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            Response::error($e->getMessage(), $code);
        }
    }

    public function changePassword(Request $request): void {
        $user = $request->getUser();
        if (!$user) {
            Response::error('Unauthorized', 401);
            return;
        }

        try {
            $result = $this->service->changePassword($user['id'], $request->getBody());
            Response::success($result, 'Password changed successfully');
        } catch (Exception $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            Response::error($e->getMessage(), $code);
        }
    }
}
