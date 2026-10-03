<?php

namespace App\Modules\Patient;

use App\Config\Database;
use PDO;

class PatientRepository {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function findById(int $id): ?array {
        $stmt = $this->db->prepare("
            SELECT id, name, email, role, phone, gender, date_of_birth, status, created_at, updated_at 
            FROM users 
            WHERE id = ? 
            LIMIT 1
        ");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function findWithPassword(int $id): ?array {
        $stmt = $this->db->prepare("SELECT id, email, password, role FROM users WHERE id = ? LIMIT 1");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function updateProfile(int $id, array $data): bool {
        $stmt = $this->db->prepare("
            UPDATE users 
            SET name = ?, phone = ?, gender = ?, date_of_birth = ?, updated_at = NOW() 
            WHERE id = ?
        ");
        return $stmt->execute([
            $data['name'],
            $data['phone'] ?? null,
            $data['gender'] ?? null,
            $data['date_of_birth'] ?? null,
            $id
        ]);
    }

    public function updatePassword(int $id, string $hashedPassword): bool {
        $stmt = $this->db->prepare("UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?");
        return $stmt->execute([$hashedPassword, $id]);
    }
}
