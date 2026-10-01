<?php

namespace App\Modules\Auth;

use App\Core\Jwt;
use Exception;

class AuthService {
    private UserRepository $userRepository;

    public function __construct() {
        $this->userRepository = new UserRepository();
    }

    public function register(array $data): array {
        $role = strtolower($data['role'] ?? 'patient');

        // Prevent public admin registration
        if ($role === 'admin') {
            throw new Exception('Administrative accounts cannot be registered publicly.', 403);
        }

        // Validate required fields
        if (empty($data['email']) || empty($data['password']) || empty($data['name'])) {
            throw new Exception('Name, email, and password are required.', 400);
        }

        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            throw new Exception('Invalid email address format.', 400);
        }

        if (strlen($data['password']) < 6) {
            throw new Exception('Password must be at least 6 characters long.', 400);
        }

        // Check if email already registered
        $existing = $this->userRepository->findByEmail($data['email']);
        if ($existing) {
            throw new Exception('This email address is already registered.', 409);
        }

        $hashedPassword = password_hash($data['password'], PASSWORD_BCRYPT);

        // Doctor registration starts with 'pending' status
        $status = ($role === 'doctor') ? 'pending' : 'active';

        $userId = $this->userRepository->create([
            'name' => trim($data['name']),
            'email' => strtolower(trim($data['email'])),
            'password' => $hashedPassword,
            'role' => $role,
            'phone' => $data['phone'] ?? null,
            'status' => $status
        ]);

        $profile = null;
        if ($role === 'doctor') {
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
        }

        $user = $this->userRepository->findById($userId);

        // If doctor is pending, do not issue an active session token that lets them bypass approval
        if ($status === 'pending') {
            return [
                'token' => '',
                'user' => $user,
                'profile' => $profile,
                'pendingApproval' => true,
                'message' => 'Your doctor registration has been received and is pending administrator approval.'
            ];
        }

        $token = Jwt::encode([
            'sub' => $user['id'],
            'email' => $user['email'],
            'role' => $user['role']
        ]);

        return [
            'token' => $token,
            'user' => $user,
            'profile' => $profile
        ];
    }

    public function login(string $email, string $password): array {
        $email = strtolower(trim($email));
        $user = $this->userRepository->findByEmail($email);

        if (!$user) {
            throw new Exception('Invalid email or password.', 401);
        }

        if (!password_verify($password, $user['password'])) {
            throw new Exception('Invalid email or password.', 401);
        }

        // Check if doctor is pending or rejected
        if ($user['role'] === 'doctor') {
            if ($user['status'] === 'pending') {
                throw new Exception('Your doctor account is awaiting administrative approval. You will receive access once approved.', 403);
            }
            if ($user['status'] === 'rejected') {
                throw new Exception('Your doctor application was not approved by the administration.', 403);
            }
        }

        if ($user['status'] === 'inactive') {
            throw new Exception('Your account is deactivated. Please contact support.', 403);
        }

        $profile = null;
        if ($user['role'] === 'doctor') {
            $profile = $this->userRepository->getDoctorProfile($user['id']);
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
            'profile' => $profile
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

        return [
            'user' => $user,
            'profile' => $profile
        ];
    }
}
