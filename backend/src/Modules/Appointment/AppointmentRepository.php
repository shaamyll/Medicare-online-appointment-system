<?php

namespace App\Modules\Appointment;

use App\Config\Database;
use App\Config\SortConfig;
use PDO;

class AppointmentRepository {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function create(array $data): int {
        $appointmentNumber = 'APT-' . strtoupper(substr(uniqid(), -6)) . '-' . rand(100, 999);
        $stmt = $this->db->prepare("
            INSERT INTO appointments (appointment_number, patient_id, doctor_id, appointment_date, start_time, end_time, status, reason_for_visit)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $appointmentNumber,
            $data['patient_id'],
            $data['doctor_id'],
            $data['appointment_date'],
            $data['start_time'],
            $data['end_time'],
            $data['status'] ?? 'pending',
            $data['reason_for_visit'] ?? null
        ]);
        return (int)$this->db->lastInsertId();
    }

    public function getConnection(): PDO {
        return $this->db;
    }

    private function getBaseSelect(): string {
        return "
            SELECT a.*,
                   p.name AS patient_name, p.email AS patient_email, p.phone AS patient_phone,
                   p.gender AS patient_gender, p.date_of_birth AS patient_dob,
                   doc.name AS doctor_name, doc.email AS doctor_email, doc.phone AS doctor_phone,
                   dp.specialization AS doctor_specialization, dp.consultation_fee AS consultationFee,
                   dp.image_path AS doctor_image_path, dp.thumbnail_path AS doctor_thumbnail_path,
                   d.name AS department_name,
                   cr.diagnosis, cr.prescription, cr.consultation_notes,
                   pm.id AS payment_id, pm.amount AS payment_amount, pm.status AS payment_status,
                   pm.method AS payment_method, pm.transaction_ref AS payment_transaction_ref, pm.paid_at AS payment_paid_at,
                   fb.id AS feedback_id, fb.rating AS feedback_rating, fb.comment AS feedback_comment, fb.tags AS feedback_tags,
                   fb.created_at AS feedback_created_at, fb.updated_at AS feedback_updated_at
            FROM appointments a
            JOIN users p ON p.id = a.patient_id
            JOIN users doc ON doc.id = a.doctor_id
            LEFT JOIN doctor_profiles dp ON dp.user_id = doc.id
            LEFT JOIN departments d ON d.id = dp.department_id
            LEFT JOIN consultation_records cr ON cr.appointment_id = a.id
            LEFT JOIN payments pm ON pm.appointment_id = a.id
            LEFT JOIN feedback fb ON fb.appointment_id = a.id
        ";
    }

    public function findById(int $id): ?array {
        $sql = $this->getBaseSelect() . " WHERE a.id = ? LIMIT 1 ";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ? $this->formatAppointmentRow($row) : null;
    }

    public function findByPatient(int $patientId, ?string $sort = null, ?string $order = null): array {
        $orderBy = SortConfig::buildOrderBy('appointments', $sort, $order, SortConfig::APPOINTMENTS_PATIENT_ALL);
        $sql = $this->getBaseSelect() . " WHERE a.patient_id = ? ORDER BY " . $orderBy;
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$patientId]);
        $rows = $stmt->fetchAll();
        return array_map([$this, 'formatAppointmentRow'], $rows);
    }

    public function findByDoctor(int $doctorId, ?string $status = null, ?string $sort = null, ?string $order = null): array {
        $sql = $this->getBaseSelect() . " WHERE a.doctor_id = ? ";
        $params = [$doctorId];

        if ($status !== null && trim($status) !== '') {
            $sql .= " AND a.status = ? ";
            $params[] = $status;
        }

        $defaultOrder = SortConfig::APPOINTMENTS_DOCTOR_UPCOMING;
        if ($status !== null) {
            $s = strtolower(trim($status));
            if ($s === 'pending') {
                $defaultOrder = SortConfig::APPOINTMENTS_DOCTOR_REQUESTS;
            } elseif (in_array($s, ['completed', 'cancelled', 'rejected'], true)) {
                $defaultOrder = SortConfig::APPOINTMENTS_DOCTOR_HISTORY;
            }
        }

        $orderBy = SortConfig::buildOrderBy('appointments', $sort, $order, $defaultOrder);
        $sql .= " ORDER BY " . $orderBy;

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();
        return array_map([$this, 'formatAppointmentRow'], $rows);
    }

    public function findAll(?string $status = null, ?string $date = null, ?int $doctorId = null, ?string $sort = null, ?string $order = null): array {
        $sql = $this->getBaseSelect() . " WHERE 1=1 ";
        $params = [];

        if ($status) {
            $sql .= " AND a.status = ? ";
            $params[] = $status;
        }
        if ($date) {
            $sql .= " AND a.appointment_date = ? ";
            $params[] = $date;
        }
        if ($doctorId) {
            $sql .= " AND a.doctor_id = ? ";
            $params[] = $doctorId;
        }

        $orderBy = SortConfig::buildOrderBy('appointments', $sort, $order, SortConfig::APPOINTMENTS_ADMIN);
        $sql .= " ORDER BY " . $orderBy;

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();
        return array_map([$this, 'formatAppointmentRow'], $rows);
    }

    public function updateStatus(int $id, string $status, ?string $rejectionReason = null): bool {
        if ($rejectionReason !== null) {
            $stmt = $this->db->prepare("UPDATE appointments SET status = ?, rejection_reason = ? WHERE id = ?");
            return $stmt->execute([$status, $rejectionReason, $id]);
        }
        $stmt = $this->db->prepare("UPDATE appointments SET status = ? WHERE id = ?");
        return $stmt->execute([$status, $id]);
    }

    public function recordReschedule(
        int $appointmentId,
        string $oldDate,
        string $oldStartTime,
        string $newDate,
        string $newStartTime,
        string $newEndTime,
        string $newStatus,
        int $rescheduledBy
    ): void {
        $this->db->beginTransaction();
        try {
            // Update appointment
            $upStmt = $this->db->prepare("
                UPDATE appointments 
                SET appointment_date = ?, start_time = ?, end_time = ?, status = ?, reschedule_count = reschedule_count + 1
                WHERE id = ?
            ");
            $upStmt->execute([$newDate, $newStartTime, $newEndTime, $newStatus, $appointmentId]);

            // Insert reschedule log
            $logStmt = $this->db->prepare("
                INSERT INTO appointment_reschedules (appointment_id, old_date, old_start_time, new_date, new_start_time, rescheduled_by)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $logStmt->execute([$appointmentId, $oldDate, $oldStartTime, $newDate, $newStartTime, $rescheduledBy]);

            $this->db->commit();
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function getReschedules(int $appointmentId): array {
        $stmt = $this->db->prepare("
            SELECT ar.*, u.name AS rescheduled_by_name, u.role AS rescheduled_by_role
            FROM appointment_reschedules ar
            JOIN users u ON u.id = ar.rescheduled_by
            WHERE ar.appointment_id = ?
            ORDER BY ar.created_at ASC
        ");
        $stmt->execute([$appointmentId]);
        return array_map(function ($row) {
            return [
                'id' => (int)$row['id'],
                'appointmentId' => (int)$row['appointment_id'],
                'oldDate' => $row['old_date'],
                'oldStartTime' => substr($row['old_start_time'], 0, 5),
                'newDate' => $row['new_date'],
                'newStartTime' => substr($row['new_start_time'], 0, 5),
                'rescheduledBy' => (int)$row['rescheduled_by'],
                'rescheduledByName' => $row['rescheduled_by_name'],
                'rescheduledByRole' => $row['rescheduled_by_role'],
                'createdAt' => $row['created_at'],
            ];
        }, $stmt->fetchAll());
    }

    public function isSlotBooked(int $doctorId, string $date, string $startTime, ?int $excludeAppointmentId = null): bool {
        $sql = "
            SELECT COUNT(*) AS total
            FROM appointments
            WHERE doctor_id = ? AND appointment_date = ? AND start_time = ?
              AND status NOT IN ('cancelled', 'rejected')
        ";
        $params = [$doctorId, $date, $startTime];
        if ($excludeAppointmentId !== null) {
            $sql .= " AND id != ? ";
            $params[] = $excludeAppointmentId;
        }
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $row = $stmt->fetch();
        return ($row['total'] ?? 0) > 0;
    }

    public function getBookedSlotsForDoctorAndDate(int $doctorId, string $date, ?int $excludeAppointmentId = null): array {
        $sql = "
            SELECT start_time, end_time
            FROM appointments
            WHERE doctor_id = ? AND appointment_date = ?
              AND status NOT IN ('cancelled', 'rejected')
        ";
        $params = [$doctorId, $date];
        if ($excludeAppointmentId !== null) {
            $sql .= " AND id != ? ";
            $params[] = $excludeAppointmentId;
        }
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function upsertConsultationRecord(int $appointmentId, array $data): void {
        $stmt = $this->db->prepare("
            INSERT INTO consultation_records (appointment_id, diagnosis, prescription, consultation_notes)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                diagnosis = VALUES(diagnosis),
                prescription = VALUES(prescription),
                consultation_notes = VALUES(consultation_notes)
        ");
        $stmt->execute([
            $appointmentId,
            $data['diagnosis'] ?? null,
            $data['prescription'] ?? null,
            $data['consultationNotes'] ?? $data['consultation_notes'] ?? null
        ]);
    }

    private function formatAppointmentRow(array $row): array {
        $patientAge = null;
        if (!empty($row['patient_dob'])) {
            $dob = new \DateTime($row['patient_dob']);
            $now = new \DateTime();
            $patientAge = $now->diff($dob)->y;
        }

        $feedbackTags = null;
        if (!empty($row['feedback_tags'])) {
            $feedbackTags = is_string($row['feedback_tags']) ? json_decode($row['feedback_tags'], true) : $row['feedback_tags'];
        }

        $canReview = (strtolower($row['status']) === 'completed' && empty($row['feedback_id']));

        $review = null;
        if (!empty($row['feedback_id'])) {
            $createdAtTs = strtotime($row['feedback_created_at']);
            $editableUntilTs = $createdAtTs + (7 * 86400);
            $isEditable = time() <= $editableUntilTs;
            $review = [
                'id' => (int)$row['feedback_id'],
                'rating' => (int)$row['feedback_rating'],
                'comment' => $row['feedback_comment'],
                'tags' => $feedbackTags,
                'createdAt' => $row['feedback_created_at'],
                'updatedAt' => $row['feedback_updated_at'] ?? null,
                'editableUntil' => date('c', $editableUntilTs),
                'isEditable' => $isEditable,
            ];
        }

        $aptStatus = strtolower($row['status'] ?? 'pending');
        $rawPaymentStatus = !empty($row['payment_status']) ? strtolower($row['payment_status']) : 'unpaid';

        if ($rawPaymentStatus === 'paid') {
            $paymentState = 'paid';
            $canPay = false;
        } elseif ($rawPaymentStatus === 'refunded') {
            $paymentState = 'refunded';
            $canPay = false;
        } elseif ($aptStatus === 'cancelled' || $aptStatus === 'rejected') {
            $paymentState = 'not_applicable';
            $canPay = false;
        } elseif ($aptStatus === 'pending') {
            $paymentState = 'awaiting_approval';
            $canPay = false;
        } elseif ($aptStatus === 'approved' || $aptStatus === 'completed') {
            if ($rawPaymentStatus === 'unpaid') {
                $paymentState = 'payable';
                $canPay = true;
            } else {
                $paymentState = $rawPaymentStatus;
                $canPay = false;
            }
        } else {
            $paymentState = 'not_applicable';
            $canPay = false;
        }

        return [
            'id' => (int)$row['id'],
            'appointmentNumber' => $row['appointment_number'],
            'appointmentDate' => $row['appointment_date'],
            'startTime' => substr($row['start_time'], 0, 5),
            'endTime' => substr($row['end_time'], 0, 5),
            'status' => strtoupper($row['status']),
            'reasonForVisit' => $row['reason_for_visit'],
            'rejectionReason' => $row['rejection_reason'] ?? null,
            'rescheduleCount' => (int)($row['reschedule_count'] ?? 0),
            'createdAt' => $row['created_at'],
            'can_pay' => $canPay,
            'canPay' => $canPay,
            'payment_state' => $paymentState,
            'paymentState' => $paymentState,
            'patient' => [
                'id' => (int)$row['patient_id'],
                'name' => $row['patient_name'],
                'email' => $row['patient_email'],
                'phone' => $row['patient_phone'],
                'gender' => $row['patient_gender'] ?? null,
                'dateOfBirth' => $row['patient_dob'] ?? null,
                'age' => $patientAge,
            ],
            'doctor' => [
                'id' => (int)$row['doctor_id'],
                'name' => $row['doctor_name'],
                'email' => $row['doctor_email'],
                'phone' => $row['doctor_phone'],
                'specialization' => $row['doctor_specialization'] ?? 'Specialist',
                'department' => $row['department_name'] ?? 'General',
                'consultationFee' => (float)($row['consultationFee'] ?? 0),
                'imagePath' => $row['doctor_image_path'] ?? null,
                'thumbnailPath' => $row['doctor_thumbnail_path'] ?? null,
            ],
            'payment' => !empty($row['payment_id']) ? [
                'id' => (int)$row['payment_id'],
                'amount' => (float)$row['payment_amount'],
                'status' => $row['payment_status'],
                'method' => $row['payment_method'],
                'transactionRef' => $row['payment_transaction_ref'],
                'paidAt' => $row['payment_paid_at'],
                'state' => $paymentState,
                'paymentState' => $paymentState,
                'canPay' => $canPay,
            ] : null,
            'feedback' => !empty($row['feedback_id']) ? [
                'id' => (int)$row['feedback_id'],
                'rating' => (int)$row['feedback_rating'],
                'comment' => $row['feedback_comment'],
                'tags' => $feedbackTags,
                'createdAt' => $row['feedback_created_at'],
                'updatedAt' => $row['feedback_updated_at'] ?? null,
                'editableUntil' => date('c', strtotime($row['feedback_created_at']) + (7 * 86400)),
                'isEditable' => time() <= (strtotime($row['feedback_created_at']) + (7 * 86400)),
            ] : null,
            'can_review' => $canReview,
            'canReview' => $canReview,
            'review' => $review,
            'reschedules' => $this->getReschedules((int)$row['id']),
            'consultation' => !empty($row['diagnosis']) || !empty($row['prescription']) || !empty($row['consultation_notes']) ? [
                'diagnosis' => $row['diagnosis'],
                'prescription' => $row['prescription'],
                'consultationNotes' => $row['consultation_notes'],
            ] : null
        ];
    }
}
