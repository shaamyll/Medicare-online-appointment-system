<?php

namespace App\Modules\Doctor;

use Exception;

class DoctorService {
    private DoctorRepository $repository;

    public function __construct() {
        $this->repository = new DoctorRepository();
    }

    public function getAllDoctors(?int $departmentId = null, ?string $search = null, ?string $sort = null, ?string $order = null): array {
        return $this->repository->findAllApproved($departmentId, $search, $sort, $order);
    }

    public function getDoctorById(int $id): array {
        $doctor = $this->repository->findById($id);
        if (!$doctor) {
            throw new Exception('Doctor not found or currently unlisted', 404);
        }
        return $doctor;
    }

    public function getDoctorSchedule(int $doctorUserId): array {
        return $this->repository->getSchedules($doctorUserId);
    }

    public function updateDoctorSchedule(int $doctorUserId, array $schedules): array {
        $this->repository->saveSchedules($doctorUserId, $schedules);
        return $this->repository->getSchedules($doctorUserId);
    }

    public function updateDoctorProfile(int $doctorUserId, array $data): array {
        $this->repository->updateProfile($doctorUserId, $data);
        return $this->getDoctorById($doctorUserId);
    }
}
