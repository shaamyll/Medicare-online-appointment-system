<?php

namespace App\Modules\Patient;

use Exception;
use DateTime;

class PatientService {
    private PatientRepository $repository;

    public function __construct() {
        $this->repository = new PatientRepository();
    }

    public function getProfile(int $patientId): array {
        $user = $this->repository->findById($patientId);
        if (!$user) {
            throw new Exception('Patient profile not found.', 404);
        }

        if ($user['role'] !== 'patient') {
            throw new Exception('Access restricted to patients.', 403);
        }

        $age = null;
        if (!empty($user['date_of_birth'])) {
            $dob = new DateTime($user['date_of_birth']);
            $now = new DateTime();
            $age = $now->diff($dob)->y;
        }

        $formattedUser = [
            'id' => (int)$user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'phone' => $user['phone'],
            'gender' => $user['gender'],
            'dateOfBirth' => $user['date_of_birth'],
            'age' => $age,
            'role' => $user['role'],
            'status' => $user['status'],
            'createdAt' => $user['created_at'],
            'updatedAt' => $user['updated_at'],
        ];

        return [
            'user' => $formattedUser,
            'profile' => null
        ];
    }

    public function updateProfile(int $patientId, array $data): array {
        $user = $this->repository->findById($patientId);
        if (!$user) {
            throw new Exception('Patient profile not found.', 404);
        }

        if ($user['role'] !== 'patient') {
            throw new Exception('Access restricted to patients.', 403);
        }

        // Validate Name (2-80 characters)
        $name = trim($data['name'] ?? '');
        if (mb_strlen($name) < 2 || mb_strlen($name) > 80) {
            throw new Exception('Name must be between 2 and 80 characters.', 422);
        }

        // Validate Phone (10-15 digits if provided)
        $phone = isset($data['phone']) ? trim($data['phone']) : null;
        if ($phone !== null && $phone !== '') {
            $cleanDigits = preg_replace('/[^0-9]/', '', $phone);
            if (strlen($cleanDigits) < 10 || strlen($cleanDigits) > 15) {
                throw new Exception('Phone number must contain between 10 and 15 digits.', 422);
            }
        } else {
            $phone = null;
        }

        // Validate Gender (male, female, other, optional)
        $gender = isset($data['gender']) ? strtolower(trim($data['gender'])) : null;
        if ($gender !== null && $gender !== '') {
            if (!in_array($gender, ['male', 'female', 'other'], true)) {
                throw new Exception('Gender must be male, female, or other.', 422);
            }
        } else {
            $gender = null;
        }

        // Validate Date of Birth (optional, Y-m-d, not in future, age 0-120)
        $dobStr = isset($data['date_of_birth']) ? trim($data['date_of_birth']) : (isset($data['dateOfBirth']) ? trim($data['dateOfBirth']) : null);
        $dob = null;
        if ($dobStr !== null && $dobStr !== '') {
            $parsedDate = DateTime::createFromFormat('Y-m-d', $dobStr);
            if (!$parsedDate || $parsedDate->format('Y-m-d') !== $dobStr) {
                throw new Exception('Date of birth must be a valid date in YYYY-MM-DD format.', 422);
            }
            $now = new DateTime('today');
            if ($parsedDate > $now) {
                throw new Exception('Date of birth cannot be in the future.', 422);
            }
            $computedAge = $now->diff($parsedDate)->y;
            if ($computedAge < 0 || $computedAge > 120) {
                throw new Exception('Age must be between 0 and 120 years.', 422);
            }
            $dob = $dobStr;
        }

        $this->repository->updateProfile($patientId, [
            'name' => $name,
            'phone' => $phone,
            'gender' => $gender,
            'date_of_birth' => $dob
        ]);

        return $this->getProfile($patientId);
    }

    public function changePassword(int $patientId, array $data): array {
        $user = $this->repository->findWithPassword($patientId);
        if (!$user) {
            throw new Exception('User not found.', 404);
        }

        if ($user['role'] !== 'patient') {
            throw new Exception('Access restricted to patients.', 403);
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
        $this->repository->updatePassword($patientId, $hashed);

        return [
            'message' => 'Password updated successfully.'
        ];
    }
}
