<?php

namespace App\Modules\Doctor;

use App\Core\Request;
use App\Core\Response;
use Exception;

class DoctorController {
    private DoctorService $service;

    public function __construct() {
        $this->service = new DoctorService();
    }

    public function index(Request $request): void {
        $deptId = $request->getQuery('departmentId');
        $deptId = $deptId ? (int)$deptId : null;
        $search = $request->getQuery('search');

        $doctors = $this->service->getAllDoctors($deptId, $search);
        Response::success($doctors);
    }

    public function show(Request $request): void {
        $id = (int)$request->getRouteParam('id');
        try {
            $doctor = $this->service->getDoctorById($id);
            Response::success($doctor);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 404);
        }
    }

    public function getMySchedule(Request $request): void {
        $user = $request->getUser();
        try {
            $schedules = $this->service->getDoctorSchedule($user['id']);
            Response::success($schedules);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }

    public function updateMySchedule(Request $request): void {
        $user = $request->getUser();
        $schedules = $request->getBody();
        if (!is_array($schedules)) {
            $schedules = $request->get('schedules', []);
        }

        try {
            $updated = $this->service->updateDoctorSchedule($user['id'], $schedules);
            Response::success($updated, 'Schedule updated successfully');
        } catch (Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }

    public function getMyProfile(Request $request): void {
        $user = $request->getUser();
        try {
            $doctor = $this->service->getDoctorById($user['id']);
            Response::success($doctor);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 404);
        }
    }

    public function updateMyProfile(Request $request): void {
        $user = $request->getUser();
        $data = $request->getBody();

        try {
            $photoFile = $_FILES['profilePhoto'] ?? $_FILES['photo'] ?? null;
            if ($photoFile && isset($photoFile['error']) && $photoFile['error'] !== UPLOAD_ERR_NO_FILE) {
                $uploadService = new \App\Services\UploadService();
                $currentDoctor = $this->service->getDoctorById($user['id']);

                $uploadResult = $uploadService->uploadDoctorPhoto($photoFile);
                $data['image_path'] = $uploadResult['image_path'];
                $data['thumbnail_path'] = $uploadResult['thumbnail_path'];

                // Delete old image & thumbnail if not a default asset
                if (!empty($currentDoctor['imagePath']) || !empty($currentDoctor['thumbnailPath'])) {
                    $uploadService->deleteFiles($currentDoctor['imagePath'] ?? null, $currentDoctor['thumbnailPath'] ?? null);
                }
            }

            $updated = $this->service->updateDoctorProfile($user['id'], $data);
            Response::success($updated, 'Profile updated successfully');
        } catch (Exception $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400;
            Response::error($e->getMessage(), $code);
        }
    }
}
