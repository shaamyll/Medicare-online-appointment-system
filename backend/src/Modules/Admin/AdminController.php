<?php

namespace App\Modules\Admin;

use App\Core\Request;
use App\Core\Response;
use Exception;

class AdminController {
    private AdminService $service;
    private DoctorAdminService $doctorAdminService;

    public function __construct() {
        $this->service = new AdminService();
        $this->doctorAdminService = new DoctorAdminService();
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
        $sort = $request->getQuery('sort');
        $order = $request->getQuery('order');
        try {
            $doctors = $this->service->getAllDoctors($status, $sort, $order);
            Response::success($doctors);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }

    public function showDoctor(Request $request): void {
        $id = (int)$request->getRouteParam('id');
        try {
            $details = $this->doctorAdminService->getDoctorDetails($id);
            Response::success($details);
        } catch (Exception $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 404;
            Response::error($e->getMessage(), $code);
        }
    }

    public function doctorRequests(Request $request): void {
        $sort = $request->getQuery('sort');
        $order = $request->getQuery('order');
        try {
            $pending = $this->service->getAllDoctors('pending', $sort, $order);
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
        $sort = $request->getQuery('sort');
        $order = $request->getQuery('order');
        try {
            $patients = $this->service->getPatients($sort, $order);
            Response::success($patients);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }

    public function deleteImpact(Request $request): void {
        $id = (int)$request->getRouteParam('id');
        try {
            $impact = $this->doctorAdminService->getDeleteImpact($id);
            Response::success($impact, 'Delete impact retrieved');
        } catch (Exception $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            Response::error($e->getMessage(), $code);
        }
    }

    public function deleteDoctor(Request $request): void {
        $id = (int)$request->getRouteParam('id');
        try {
            $result = $this->doctorAdminService->deleteDoctor($id);
            Response::success($result, $result['message'] ?? 'Doctor deleted permanently');
        } catch (Exception $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            Response::error($e->getMessage(), $code);
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
