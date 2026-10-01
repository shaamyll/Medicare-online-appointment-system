<?php

namespace App\Modules\Auth;

use App\Config\Database;
use PDO;

class UserRepository {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function findByEmail(string $email): ?array {
        $stmt = $this->db->prepare("SELECT * FROM users WHERE email = ? LIMIT 1");
        $stmt->execute([$email]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function findById(int $id): ?array {
        $stmt = $this->db->prepare("SELECT id, name, email, role, phone, status, created_at, updated_at FROM users WHERE id = ? LIMIT 1");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function create(array $data): int {
        $stmt = $this->db->prepare("
            INSERT INTO users (name, email, password, role, phone, status)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $data['name'],
            $data['email'],
            $data['password'],
            $data['role'],
            $data['phone'] ?? null,
            $data['status'] ?? 'active'
        ]);
        return (int)$this->db->lastInsertId();
    }

    public function findByLicenseNumber(string $licenseNumber): ?array {
        $stmt = $this->db->prepare("SELECT * FROM doctor_profiles WHERE license_number = ? LIMIT 1");
        $stmt->execute([trim($licenseNumber)]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function getDoctorProfile(int $userId): ?array {
        $stmt = $this->db->prepare("
            SELECT dp.*, d.name AS department_name
            FROM doctor_profiles dp
            LEFT JOIN departments d ON d.id = dp.department_id
            WHERE dp.user_id = ?
            LIMIT 1
        ");
        $stmt->execute([$userId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function createDoctorProfile(array $data): int {
        $stmt = $this->db->prepare("
            INSERT INTO doctor_profiles (user_id, department_id, specialization, qualification, license_number, image_path, thumbnail_path, experience_years, consultation_fee, bio, room_number)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $data['user_id'],
            $data['department_id'] ?? null,
            $data['specialization'],
            $data['qualification'] ?? 'MD',
            $data['license_number'] ?? null,
            $data['image_path'] ?? null,
            $data['thumbnail_path'] ?? null,
            $data['experience_years'] ?? 0,
            $data['consultation_fee'] ?? 0.00,
            $data['bio'] ?? null,
            $data['room_number'] ?? null
        ]);
        return (int)$this->db->lastInsertId();
    }

    public function getDb(): PDO {
        return $this->db;
    }

    public function updateStatus(int $userId, string $status): bool {
        $stmt = $this->db->prepare("UPDATE users SET status = ? WHERE id = ?");
        return $stmt->execute([$status, $userId]);
    }
}
