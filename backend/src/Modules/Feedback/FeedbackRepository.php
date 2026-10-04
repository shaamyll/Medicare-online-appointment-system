<?php

namespace App\Modules\Feedback;

use App\Config\Database;
use PDO;

class FeedbackRepository {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function create(array $data): int {
        $tagsJson = isset($data['tags']) && !empty($data['tags']) ? json_encode(array_values($data['tags'])) : null;
        $stmt = $this->db->prepare("
            INSERT INTO feedback (appointment_id, patient_id, doctor_id, rating, comment, tags)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $data['appointment_id'],
            $data['patient_id'],
            $data['doctor_id'],
            $data['rating'],
            $data['comment'] ?? null,
            $tagsJson
        ]);
        return (int)$this->db->lastInsertId();
    }

    public function update(int $id, array $data): bool {
        $tagsJson = isset($data['tags']) && !empty($data['tags']) ? json_encode(array_values($data['tags'])) : null;
        $stmt = $this->db->prepare("
            UPDATE feedback 
            SET rating = ?, comment = ?, tags = ?, updated_at = NOW() 
            WHERE id = ?
        ");
        return $stmt->execute([
            $data['rating'],
            $data['comment'] ?? null,
            $tagsJson,
            $id
        ]);
    }

    public function findByAppointmentId(int $appointmentId): ?array {
        $stmt = $this->db->prepare("SELECT * FROM feedback WHERE appointment_id = ? LIMIT 1");
        $stmt->execute([$appointmentId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function findById(int $id): ?array {
        $stmt = $this->db->prepare("SELECT * FROM feedback WHERE id = ? LIMIT 1");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function delete(int $id): bool {
        $stmt = $this->db->prepare("DELETE FROM feedback WHERE id = ?");
        return $stmt->execute([$id]);
    }

    public function deleteByAppointmentId(int $appointmentId): bool {
        $stmt = $this->db->prepare("DELETE FROM feedback WHERE appointment_id = ?");
        return $stmt->execute([$appointmentId]);
    }

    public function getDoctorFeedbackSummary(int $doctorId): array {
        $stmt = $this->db->prepare("
            SELECT 
                COUNT(*) AS total_count,
                COALESCE(ROUND(AVG(rating), 1), 0.0) AS avg_rating,
                SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) AS stars_5,
                SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) AS stars_4,
                SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) AS stars_3,
                SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) AS stars_2,
                SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) AS stars_1
            FROM feedback
            WHERE doctor_id = ?
        ");
        $stmt->execute([$doctorId]);
        $row = $stmt->fetch();

        return [
            'ratingAvg' => (float)($row['avg_rating'] ?? 0),
            'ratingCount' => (int)($row['total_count'] ?? 0),
            'distribution' => [
                5 => (int)($row['stars_5'] ?? 0),
                4 => (int)($row['stars_4'] ?? 0),
                3 => (int)($row['stars_3'] ?? 0),
                2 => (int)($row['stars_2'] ?? 0),
                1 => (int)($row['stars_1'] ?? 0),
            ]
        ];
    }

    public function paginateByDoctor(int $doctorId, int $page = 1, int $limit = 10, bool $maskPatient = true): array {
        $offset = ($page - 1) * $limit;

        $countStmt = $this->db->prepare("SELECT COUNT(*) FROM feedback WHERE doctor_id = ?");
        $countStmt->execute([$doctorId]);
        $total = (int)$countStmt->fetchColumn();

        $stmt = $this->db->prepare("
            SELECT f.*, u.name AS patient_name, u.email AS patient_email
            FROM feedback f
            JOIN users u ON u.id = f.patient_id
            WHERE f.doctor_id = ?
            ORDER BY f.created_at DESC, f.id DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->bindValue(1, $doctorId, PDO::PARAM_INT);
        $stmt->bindValue(2, $limit, PDO::PARAM_INT);
        $stmt->bindValue(3, $offset, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll();

        $items = array_map(function ($row) use ($maskPatient) {
            $patientName = $row['patient_name'];
            if ($maskPatient) {
                $patientName = $this->maskName($patientName);
            }
            $tags = !empty($row['tags']) ? (is_string($row['tags']) ? json_decode($row['tags'], true) : $row['tags']) : [];
            return [
                'id' => (int)$row['id'],
                'appointmentId' => (int)$row['appointment_id'],
                'patientId' => (int)$row['patient_id'],
                'patientName' => $patientName,
                'rating' => (int)$row['rating'],
                'comment' => $row['comment'],
                'tags' => $tags,
                'createdAt' => $row['created_at'],
                'updatedAt' => $row['updated_at'] ?? null,
            ];
        }, $rows);

        return [
            'items' => $items,
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'totalPages' => ceil($total / max(1, $limit))
        ];
    }

    public function paginateAdmin(array $filters = [], int $page = 1, int $limit = 10): array {
        $offset = ($page - 1) * $limit;
        $where = ["1=1"];
        $params = [];

        if (!empty($filters['doctorId'])) {
            $where[] = "f.doctor_id = ?";
            $params[] = (int)$filters['doctorId'];
        }

        if (!empty($filters['rating'])) {
            $where[] = "f.rating = ?";
            $params[] = (int)$filters['rating'];
        }

        $whereClause = implode(" AND ", $where);

        $countStmt = $this->db->prepare("SELECT COUNT(*) FROM feedback f WHERE {$whereClause}");
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        $sql = "
            SELECT f.*,
                   u_pat.name AS patient_name, u_pat.email AS patient_email,
                   u_doc.name AS doctor_name, u_doc.email AS doctor_email,
                   dp.specialization AS doctor_specialization,
                   a.appointment_number
            FROM feedback f
            JOIN users u_pat ON u_pat.id = f.patient_id
            JOIN users u_doc ON u_doc.id = f.doctor_id
            LEFT JOIN doctor_profiles dp ON dp.user_id = u_doc.id
            LEFT JOIN appointments a ON a.id = f.appointment_id
            WHERE {$whereClause}
            ORDER BY f.created_at DESC, f.id DESC
            LIMIT ? OFFSET ?
        ";

        $stmt = $this->db->prepare($sql);
        $bindIdx = 1;
        foreach ($params as $val) {
            $stmt->bindValue($bindIdx++, $val);
        }
        $stmt->bindValue($bindIdx++, $limit, PDO::PARAM_INT);
        $stmt->bindValue($bindIdx++, $offset, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll();

        $items = array_map(function ($row) {
            return [
                'id' => (int)$row['id'],
                'appointmentId' => (int)$row['appointment_id'],
                'appointmentNumber' => $row['appointment_number'],
                'patient' => [
                    'id' => (int)$row['patient_id'],
                    'name' => $row['patient_name'],
                    'email' => $row['patient_email'],
                ],
                'doctor' => [
                    'id' => (int)$row['doctor_id'],
                    'name' => $row['doctor_name'],
                    'email' => $row['doctor_email'],
                    'specialization' => $row['doctor_specialization'] ?? 'Specialist',
                ],
                'rating' => (int)$row['rating'],
                'comment' => $row['comment'],
                'tags' => !empty($row['tags']) ? (is_string($row['tags']) ? json_decode($row['tags'], true) : $row['tags']) : [],
                'createdAt' => $row['created_at'],
                'updatedAt' => $row['updated_at'] ?? null,
            ];
        }, $rows);

        return [
            'items' => $items,
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'totalPages' => ceil($total / max(1, $limit))
        ];
    }

    private function maskName(string $name): string {
        $parts = preg_split('/\s+/', trim($name));
        if (count($parts) <= 1) {
            return $name;
        }
        $first = $parts[0];
        $lastInitial = mb_substr($parts[count($parts) - 1], 0, 1) . '.';
        return "{$first} {$lastInitial}";
    }
}
