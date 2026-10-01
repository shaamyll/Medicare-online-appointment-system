<?php

namespace App\Modules\Auth;

use App\Core\Jwt;
use Exception;

class AuthService {
    private const GENERIC_AUTH_ERROR = 'Invalid email or password.';
    private UserRepository $userRepository;

    public function __construct() {
        $this->userRepository = new UserRepository();
    }

    /**
     * User portal login: only allows 'patient' and 'admin'.
     * Wrong credentials or non-permitted roles (e.g. doctor) return generic error.
     */
    public function userLogin(string $email, string $password): array {
        $email = strtolower(trim($email));
        $user = $this->userRepository->findByEmail($email);

        if (!$user) {
            throw new Exception(self::GENERIC_AUTH_ERROR, 401);
        }

        if (!password_verify($password, $user['password'])) {
            throw new Exception(self::GENERIC_AUTH_ERROR, 401);
        }

        // Only patient and admin roles are allowed through this portal
        if (!in_array($user['role'], ['patient', 'admin'], true)) {
            // Never reveal portal membership; return identical generic error
            throw new Exception(self::GENERIC_AUTH_ERROR, 401);
        }

        if ($user['status'] === 'inactive') {
            throw new Exception('Your account is deactivated. Please contact support.', 403);
        }

        $token = Jwt::encode([
            'sub' => $user['id'],
            'email' => $user['email'],
            'role' => $user['role']
        ]);

        unset($user['password']);

        return [
            'token' => $token,
            'user' => $user,
            'profile' => null
        ];
    }

    /**
     * Doctor portal login: only allows 'doctor' role.
     * Non-doctors (patient/admin) or wrong credentials return generic error.
     * Doctor status checks: pending / rejected / inactive return specific informative messages.
     */
    public function doctorLogin(string $email, string $password): array {
        $email = strtolower(trim($email));
        $user = $this->userRepository->findByEmail($email);

        if (!$user) {
            throw new Exception(self::GENERIC_AUTH_ERROR, 401);
        }

        if (!password_verify($password, $user['password'])) {
            throw new Exception(self::GENERIC_AUTH_ERROR, 401);
        }

        // Only doctor role is permitted
        if ($user['role'] !== 'doctor') {
            throw new Exception(self::GENERIC_AUTH_ERROR, 401);
        }

        // Check doctor account status
        if ($user['status'] === 'pending') {
            throw new Exception('Your doctor account is awaiting administrative approval. You will receive access once approved.', 403);
        }

        if ($user['status'] === 'rejected') {
            throw new Exception('Your doctor application was not approved by the administration.', 403);
        }

        if ($user['status'] === 'inactive') {
            throw new Exception('Your doctor account is deactivated. Please contact support.', 403);
        }

        $profile = $this->userRepository->getDoctorProfile($user['id']);

        $token = Jwt::encode([
            'sub' => $user['id'],
            'email' => $user['email'],
            'role' => 'doctor'
        ]);

        unset($user['password']);

        return [
            'token' => $token,
            'user' => $user,
            'profile' => $profile
        ];
    }

    /**
     * Patient registration: strictly registers patients. Ignores/rejects role field.
     */
    public function patientRegister(array $data): array {
        if (isset($data['role']) && strtolower(trim($data['role'])) === 'admin') {
            throw new Exception('Administrative accounts cannot be registered publicly.', 403);
        }

        if (empty($data['email']) || empty($data['password']) || empty($data['name'])) {
            throw new Exception('Name, email, and password are required.', 400);
        }

        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            throw new Exception('Invalid email address format.', 400);
        }

        if (strlen($data['password']) < 6) {
            throw new Exception('Password must be at least 6 characters long.', 400);
        }

        $existing = $this->userRepository->findByEmail(strtolower(trim($data['email'])));
        if ($existing) {
            throw new Exception('This email address is already registered.', 409);
        }

        $hashedPassword = password_hash($data['password'], PASSWORD_BCRYPT);

        $userId = $this->userRepository->create([
            'name' => trim($data['name']),
            'email' => strtolower(trim($data['email'])),
            'password' => $hashedPassword,
            'role' => 'patient', // Force patient role regardless of input
            'phone' => $data['phone'] ?? null,
            'status' => 'active'
        ]);

        $user = $this->userRepository->findById($userId);

        $token = Jwt::encode([
            'sub' => $user['id'],
            'email' => $user['email'],
            'role' => 'patient'
        ]);

        unset($user['password']);

        return [
            'token' => $token,
            'user' => $user,
            'profile' => null
        ];
    }

    /**
     * Doctor registration: registers doctors with status 'pending' and without session token.
     */
    public function doctorRegister(array $data): array {
        if (isset($data['role']) && strtolower(trim($data['role'])) === 'admin') {
            throw new Exception('Administrative accounts cannot be registered publicly.', 403);
        }

        if (empty($data['email']) || empty($data['password']) || empty($data['name'])) {
            throw new Exception('Name, email, and password are required.', 400);
        }

        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            throw new Exception('Invalid email address format.', 400);
        }

        if (strlen($data['password']) < 6) {
            throw new Exception('Password must be at least 6 characters long.', 400);
        }

        $existing = $this->userRepository->findByEmail(strtolower(trim($data['email'])));
        if ($existing) {
            throw new Exception('This email address is already registered.', 409);
        }

        $hashedPassword = password_hash($data['password'], PASSWORD_BCRYPT);

        $userId = $this->userRepository->create([
            'name' => trim($data['name']),
            'email' => strtolower(trim($data['email'])),
            'password' => $hashedPassword,
            'role' => 'doctor',
            'phone' => $data['phone'] ?? null,
            'status' => 'pending'
        ]);

        $this->userRepository->createDoctorProfile([
            'user_id' => $userId,
            'department_id' => !empty($data['departmentId']) ? (int)$data['departmentId'] : null,
            'specialization' => $data['specialization'] ?? 'General Specialist',
            'qualification' => $data['qualification'] ?? 'MBBS / MD',
            'experience_years' => !empty($data['experienceYears']) ? (int)$data['experienceYears'] : 0,
            'consultation_fee' => !empty($data['consultationFee']) ? (float)$data['consultationFee'] : 0.00,
            'bio' => $data['bio'] ?? null,
            'room_number' => $data['roomNumber'] ?? null
        ]);

        $profile = $this->userRepository->getDoctorProfile($userId);
        $user = $this->userRepository->findById($userId);
        unset($user['password']);

        return [
            'token' => '',
            'user' => $user,
            'profile' => $profile,
            'pendingApproval' => true,
            'message' => 'Your doctor registration has been received and is pending administrator approval.'
        ];
    }

    public function getMe(int $userId): array {
        $user = $this->userRepository->findById($userId);
        if (!$user) {
            throw new Exception('User not found.', 404);
        }

        $profile = null;
        if ($user['role'] === 'doctor') {
            $profile = $this->userRepository->getDoctorProfile($userId);
        }

        unset($user['password']);

        return [
            'user' => $user,
            'profile' => $profile
        ];
    }
}
