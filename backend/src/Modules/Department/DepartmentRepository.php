<?php

namespace App\Modules\Department;

use App\Config\Database;
use App\Config\SortConfig;
use PDO;

class DepartmentRepository {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function findAll(bool $onlyActive = true, ?string $sort = null, ?string $order = null): array {
        $sql = "
            SELECT d.id, d.name, d.description, d.icon, d.is_active AS isActive, d.created_at AS createdAt,
                   COUNT(dp.id) AS doctorCount
            FROM departments d
            LEFT JOIN doctor_profiles dp ON dp.department_id = d.id
            LEFT JOIN users u ON u.id = dp.user_id AND u.status = 'active'
        ";
        if ($onlyActive) {
            $sql .= " WHERE d.is_active = 1 ";
        }
        $defaultSort = $onlyActive ? SortConfig::PUBLIC_DEPARTMENTS : SortConfig::ADMIN_DEPARTMENTS;
        $orderBy = SortConfig::buildOrderBy('departments', $sort, $order, $defaultSort);
        $sql .= " GROUP BY d.id ORDER BY " . $orderBy;

        $stmt = $this->db->query($sql);
        $results = $stmt->fetchAll();

        return array_map(function ($row) {
            $row['id'] = (int)$row['id'];
            $row['isActive'] = (bool)$row['isActive'];
            $row['doctorCount'] = (int)$row['doctorCount'];
            return $row;
        }, $results);
    }

    public function findById(int $id): ?array {
        $stmt = $this->db->prepare("
            SELECT id, name, description, icon, is_active AS isActive, created_at AS createdAt
            FROM departments
            WHERE id = ?
            LIMIT 1
        ");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if ($row) {
            $row['id'] = (int)$row['id'];
            $row['isActive'] = (bool)$row['isActive'];
            return $row;
        }
        return null;
    }

    public function create(array $data): int {
        $stmt = $this->db->prepare("
            INSERT INTO departments (name, description, icon, is_active)
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([
            $data['name'],
            $data['description'] ?? null,
            $data['icon'] ?? 'Activity',
            isset($data['isActive']) ? (int)$data['isActive'] : 1
        ]);
        return (int)$this->db->lastInsertId();
    }

    public function update(int $id, array $data): bool {
        $fields = [];
        $params = [];

        if (isset($data['name'])) {
            $fields[] = "name = ?";
            $params[] = $data['name'];
        }
        if (isset($data['description'])) {
            $fields[] = "description = ?";
            $params[] = $data['description'];
        }
        if (isset($data['icon'])) {
            $fields[] = "icon = ?";
            $params[] = $data['icon'];
        }
        if (isset($data['isActive'])) {
            $fields[] = "is_active = ?";
            $params[] = (int)$data['isActive'];
        }

        if (empty($fields)) {
            return false;
        }

        $params[] = $id;
        $sql = "UPDATE departments SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute($params);
    }

    public function getDoctorCount(int $id): int {
        $stmt = $this->db->prepare("
            SELECT COUNT(dp.id) AS count
            FROM doctor_profiles dp
            JOIN users u ON u.id = dp.user_id AND u.status = 'active'
            WHERE dp.department_id = ?
        ");
        $stmt->execute([$id]);
        return (int)$stmt->fetchColumn();
    }

    public function delete(int $id): bool {
        $stmt = $this->db->prepare("DELETE FROM departments WHERE id = ?");
        return $stmt->execute([$id]);
    }
}
