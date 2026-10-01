<?php

namespace App\Modules\Doctor;

use App\Config\Database;
use PDO;

class DoctorRepository {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function findAllApproved(?int $departmentId = null, ?string $search = null): array {
        $sql = "
            SELECT 
                dp.id AS profile_id,
                u.id AS user_id,
                u.name,
                u.email,
                u.phone,
                u.status,
                u.created_at AS user_created_at,
                dp.specialization,
                dp.qualification,
                dp.license_number AS licenseNumber,
                dp.image_path AS imagePath,
                dp.thumbnail_path AS thumbnailPath,
                dp.experience_years AS experienceYears,
                dp.consultation_fee AS consultationFee,
                dp.bio,
                dp.room_number AS roomNumber,
                d.id AS department_id,
                d.name AS department_name
            FROM users u
            JOIN doctor_profiles dp ON dp.user_id = u.id
            LEFT JOIN departments d ON d.id = dp.department_id
            WHERE u.role = 'doctor' AND u.status = 'active'
        ";
        $params = [];

        if ($departmentId !== null && $departmentId > 0) {
            $sql .= " AND dp.department_id = ? ";
            $params[] = $departmentId;
        }

        if ($search !== null && trim($search) !== '') {
            $sql .= " AND (u.name LIKE ? OR dp.specialization LIKE ? OR d.name LIKE ?) ";
            $like = '%' . trim($search) . '%';
            $params[] = $like;
            $params[] = $like;
            $params[] = $like;
        }

        $sql .= " ORDER BY u.name ASC ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        return array_map([$this, 'formatDoctorRow'], $rows);
    }

    public function findById(int $userId): ?array {
        $sql = "
            SELECT 
                dp.id AS profile_id,
                u.id AS user_id,
                u.name,
                u.email,
                u.phone,
                u.status,
                u.created_at AS user_created_at,
                dp.specialization,
                dp.qualification,
                dp.license_number AS licenseNumber,
                dp.image_path AS imagePath,
                dp.thumbnail_path AS thumbnailPath,
                dp.experience_years AS experienceYears,
                dp.consultation_fee AS consultationFee,
                dp.bio,
                dp.room_number AS roomNumber,
                d.id AS department_id,
                d.name AS department_name
            FROM users u
            JOIN doctor_profiles dp ON dp.user_id = u.id
            LEFT JOIN departments d ON d.id = dp.department_id
            WHERE u.role = 'doctor' AND u.id = ?
            LIMIT 1
        ";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$userId]);
        $row = $stmt->fetch();

        if (!$row) {
            return null;
        }

        $doctor = $this->formatDoctorRow($row);
        $doctor['schedules'] = $this->getSchedules($userId);
        return $doctor;
    }

    public function getSchedules(int $doctorUserId): array {
        $stmt = $this->db->prepare("
            SELECT id, day_of_week AS dayOfWeek, start_time AS startTime, end_time AS endTime,
                   slot_duration_minutes AS slotDurationMinutes, is_available AS isAvailable
            FROM doctor_schedules
            WHERE doctor_id = ?
            ORDER BY FIELD(day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'), start_time ASC
        ");
        $stmt->execute([$doctorUserId]);
        $results = $stmt->fetchAll();

        return array_map(function ($row) {
            $row['id'] = (int)$row['id'];
            $row['slotDurationMinutes'] = (int)$row['slotDurationMinutes'];
            $row['isAvailable'] = (bool)$row['isAvailable'];
            return $row;
        }, $results);
    }

    public function saveSchedules(int $doctorUserId, array $schedules): void {
        $this->db->beginTransaction();
        try {
            $deleteStmt = $this->db->prepare("DELETE FROM doctor_schedules WHERE doctor_id = ?");
            $deleteStmt->execute([$doctorUserId]);

            $insertStmt = $this->db->prepare("
                INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, is_available)
                VALUES (?, ?, ?, ?, ?, ?)
            ");

            foreach ($schedules as $sched) {
                if (empty($sched['dayOfWeek']) || empty($sched['startTime']) || empty($sched['endTime'])) {
                    continue;
                }
                $insertStmt->execute([
                    $doctorUserId,
                    $sched['dayOfWeek'],
                    $sched['startTime'],
                    $sched['endTime'],
                    $sched['slotDurationMinutes'] ?? 30,
                    isset($sched['isAvailable']) ? (int)$sched['isAvailable'] : 1
                ]);
            }
            $this->db->commit();
        } catch (\Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function updateProfile(int $doctorUserId, array $data): bool {
        // Update user table if name or phone provided
        if (isset($data['name']) || isset($data['phone'])) {
            $userFields = [];
            $userParams = [];
            if (isset($data['name'])) {
                $userFields[] = "name = ?";
                $userParams[] = $data['name'];
            }
            if (isset($data['phone'])) {
                $userFields[] = "phone = ?";
                $userParams[] = $data['phone'];
            }
            $userParams[] = $doctorUserId;
            $userSql = "UPDATE users SET " . implode(', ', $userFields) . " WHERE id = ?";
            $this->db->prepare($userSql)->execute($userParams);
        }

        // Update doctor_profiles table
        $profFields = [];
        $profParams = [];

        if (isset($data['specialization'])) {
            $profFields[] = "specialization = ?";
            $profParams[] = $data['specialization'];
        }
        if (isset($data['departmentId'])) {
            $profFields[] = "department_id = ?";
            $profParams[] = $data['departmentId'] ?: null;
        }
        if (isset($data['qualification'])) {
            $profFields[] = "qualification = ?";
            $profParams[] = $data['qualification'];
        }
        if (isset($data['imagePath']) || isset($data['image_path'])) {
            $profFields[] = "image_path = ?";
            $profParams[] = $data['imagePath'] ?? $data['image_path'];
        }
        if (isset($data['thumbnailPath']) || isset($data['thumbnail_path'])) {
            $profFields[] = "thumbnail_path = ?";
            $profParams[] = $data['thumbnailPath'] ?? $data['thumbnail_path'];
        }
        if (isset($data['experienceYears'])) {
            $profFields[] = "experience_years = ?";
            $profParams[] = (int)$data['experienceYears'];
        }
        if (isset($data['consultationFee'])) {
            $profFields[] = "consultation_fee = ?";
            $profParams[] = (float)$data['consultationFee'];
        }
        if (isset($data['bio'])) {
            $profFields[] = "bio = ?";
            $profParams[] = $data['bio'];
        }
        if (isset($data['roomNumber'])) {
            $profFields[] = "room_number = ?";
            $profParams[] = $data['roomNumber'];
        }

        if (!empty($profFields)) {
            $profParams[] = $doctorUserId;
            $profSql = "UPDATE doctor_profiles SET " . implode(', ', $profFields) . " WHERE user_id = ?";
            $this->db->prepare($profSql)->execute($profParams);
        }

        return true;
    }

    private function formatDoctorRow(array $row): array {
        return [
            'id' => (int)$row['user_id'], // Doctor ID references users.id
            'profileId' => (int)$row['profile_id'],
            'specialization' => $row['specialization'],
            'qualification' => $row['qualification'],
            'licenseNumber' => $row['licenseNumber'] ?? null,
            'imagePath' => $row['imagePath'] ?? null,
            'thumbnailPath' => $row['thumbnailPath'] ?? null,
            'experienceYears' => (int)$row['experienceYears'],
            'consultationFee' => (float)$row['consultationFee'],
            'bio' => $row['bio'],
            'roomNumber' => $row['roomNumber'],
            'user' => [
                'id' => (int)$row['user_id'],
                'name' => $row['name'],
                'email' => $row['email'],
                'role' => 'doctor',
                'phone' => $row['phone'],
                'status' => $row['status'],
                'createdAt' => $row['user_created_at']
            ],
            'department' => $row['department_id'] ? [
                'id' => (int)$row['department_id'],
                'name' => $row['department_name']
            ] : null
        ];
    }
}
