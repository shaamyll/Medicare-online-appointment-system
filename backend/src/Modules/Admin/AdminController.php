<?php

namespace App\Modules\Admin;

use App\Core\Request;
use App\Core\Response;
use Exception;

class AdminController {
    private AdminService $service;

    public function __construct() {
        $this->service = new AdminService();
    }

    public function stats(Request $request): void {
        try {
            $stats = $this->service->getDashboardStats();
            Response::success($stats);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }

    public function doctors(Request $request): void {
        $status = $request->getQuery('status');
        try {
            $doctors = $this->service->getAllDoctors($status);
            Response::success($doctors);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }

    public function doctorRequests(Request $request): void {
        try {
            $pending = $this->service->getAllDoctors('pending');
            Response::success($pending);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }

    public function approveDoctor(Request $request): void {
        $id = (int)$request->getRouteParam('id');
        try {
            $result = $this->service->setDoctorStatus($id, 'active');
            Response::success($result, 'Doctor approved successfully');
        } catch (Exception $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            Response::error($e->getMessage(), $code);
        }
    }

    public function rejectDoctor(Request $request): void {
        $id = (int)$request->getRouteParam('id');
        try {
            $result = $this->service->setDoctorStatus($id, 'rejected');
            Response::success($result, 'Doctor request rejected');
        } catch (Exception $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            Response::error($e->getMessage(), $code);
        }
    }

    public function toggleDoctorStatus(Request $request): void {
        $id = (int)$request->getRouteParam('id');
        $status = $request->get('status');

        if (!$status) {
            Response::error('Status is required.', 400);
            return;
        }

        try {
            $result = $this->service->setDoctorStatus($id, $status);
            Response::success($result, "Doctor status updated to {$status}");
        } catch (Exception $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            Response::error($e->getMessage(), $code);
        }
    }

    public function patients(Request $request): void {
        try {
            $patients = $this->service->getPatients();
            Response::success($patients);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }

    public function reports(Request $request): void {
        try {
            $reports = $this->service->getReports();
            Response::success($reports);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }
}
