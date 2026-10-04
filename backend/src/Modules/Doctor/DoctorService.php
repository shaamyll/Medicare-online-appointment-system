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

    public function changePassword(int $doctorUserId, array $data): array {
        $user = $this->repository->findWithPassword($doctorUserId);
        if (!$user) {
            throw new Exception('User not found.', 404);
        }

        if ($user['role'] !== 'doctor') {
            throw new Exception('Access restricted to doctors.', 403);
        }

        $currentPassword = $data['currentPassword'] ?? '';
        $newPassword = $data['newPassword'] ?? '';
        $confirmPassword = $data['confirmPassword'] ?? '';

        if (empty($currentPassword) || empty($newPassword)) {
            throw new Exception('Current password and new password are required.', 422);
        }

        if (!password_verify($currentPassword, $user['password'])) {
            throw new Exception('Incorrect current password.', 400);
        }

        if ($newPassword !== $confirmPassword) {
            throw new Exception('New password and confirmation password do not match.', 422);
        }

        // Min 8 chars with at least one letter and at least one number
        if (strlen($newPassword) < 8 || !preg_match('/[A-Za-z]/', $newPassword) || !preg_match('/\d/', $newPassword)) {
            throw new Exception('New password must be at least 8 characters long and contain at least one letter and one number.', 422);
        }

        $hashed = password_hash($newPassword, PASSWORD_BCRYPT);
        $this->repository->updatePassword($doctorUserId, $hashed);

        return [
            'message' => 'Password updated successfully.'
        ];
    }
}
