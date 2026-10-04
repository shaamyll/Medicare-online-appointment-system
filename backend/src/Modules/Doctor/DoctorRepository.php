<?php

namespace App\Modules\Doctor;

use App\Config\Database;
use App\Config\SortConfig;
use PDO;

class DoctorRepository {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function findAllApproved(?int $departmentId = null, ?string $search = null, ?string $sort = null, ?string $order = null): array {
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
                d.name AS department_name,
                COALESCE(fb.rating_avg, 0.0) AS rating_avg,
                COALESCE(fb.rating_count, 0) AS rating_count
            FROM users u
            JOIN doctor_profiles dp ON dp.user_id = u.id
            LEFT JOIN departments d ON d.id = dp.department_id
            LEFT JOIN (
                SELECT doctor_id, ROUND(AVG(rating), 1) AS rating_avg, COUNT(*) AS rating_count 
                FROM feedback 
                GROUP BY doctor_id
            ) fb ON fb.doctor_id = u.id
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

        $orderBy = SortConfig::buildOrderBy('doctors', $sort, $order, SortConfig::PUBLIC_DOCTORS);
        $sql .= " ORDER BY " . $orderBy;

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        // Fetch all active schedules in one query for efficient next_available calculation (no N+1)
        $schedRows = $this->db->query("
            SELECT doctor_id, day_of_week, start_time, end_time 
            FROM doctor_schedules 
            WHERE is_available = 1
        ")->fetchAll();

        $schedMap = [];
        foreach ($schedRows as $s) {
            $schedMap[$s['doctor_id']][] = $s;
        }

        return array_map(function ($row) use ($schedMap) {
            $formatted = $this->formatDoctorRow($row);
            $docSchedules = $schedMap[$row['user_id']] ?? [];
            $formatted['nextAvailable'] = $this->computeNextAvailable($docSchedules);
            return $formatted;
        }, $rows);
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
                d.name AS department_name,
                COALESCE(fb.rating_avg, 0.0) AS rating_avg,
                COALESCE(fb.rating_count, 0) AS rating_count
            FROM users u
            JOIN doctor_profiles dp ON dp.user_id = u.id
            LEFT JOIN departments d ON d.id = dp.department_id
            LEFT JOIN (
                SELECT doctor_id, ROUND(AVG(rating), 1) AS rating_avg, COUNT(*) AS rating_count 
                FROM feedback 
                GROUP BY doctor_id
            ) fb ON fb.doctor_id = u.id
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
        $schedules = $this->getSchedules($userId);
        $doctor['schedules'] = $schedules;
        $doctor['nextAvailable'] = $this->computeNextAvailable($schedules);
        return $doctor;
    }

    /**
     * Efficiently derive next available slot/day from weekly schedule
     */
    private function computeNextAvailable(array $schedules): ?string {
        if (empty($schedules)) {
            return null;
        }

        $now = new \DateTime();
        $currentTime = $now->format('H:i:s');

        for ($dayOffset = 0; $dayOffset < 7; $dayOffset++) {
            $checkDate = (clone $now)->modify("+{$dayOffset} days");
            $dayName = $checkDate->format('l');

            foreach ($schedules as $sched) {
                $schedDay = $sched['day_of_week'] ?? $sched['dayOfWeek'] ?? '';
                $isAvail = isset($sched['is_available']) ? (bool)$sched['is_available'] : (isset($sched['isAvailable']) ? (bool)$sched['isAvailable'] : true);

                if (strcasecmp($schedDay, $dayName) === 0 && $isAvail) {
                    $endTime = $sched['end_time'] ?? $sched['endTime'] ?? '23:59:59';
                    if (strlen($endTime) === 5) $endTime .= ':00';

                    if ($dayOffset === 0) {
                        if ($currentTime < $endTime) {
                            return 'Today';
                        }
                    } else {
                        return $checkDate->format('D, j M'); // e.g. "Mon, 12 Jan"
                    }
                }
            }
        }

        return null;
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
            'ratingAvg' => (float)($row['rating_avg'] ?? 0),
            'ratingCount' => (int)($row['rating_count'] ?? 0),
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

    public function findWithPassword(int $userId): ?array {
        $stmt = $this->db->prepare("SELECT id, email, password, role FROM users WHERE id = ? LIMIT 1");
        $stmt->execute([$userId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function updatePassword(int $userId, string $hashedPassword): bool {
        $stmt = $this->db->prepare("UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?");
        return $stmt->execute([$hashedPassword, $userId]);
    }
}
