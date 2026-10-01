<?php

namespace App\Modules\Appointment;

use App\Config\Database;
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

    public function findById(int $id): ?array {
        $stmt = $this->db->prepare("
            SELECT a.*,
                   p.name AS patient_name, p.email AS patient_email, p.phone AS patient_phone,
                   doc.name AS doctor_name, doc.email AS doctor_email, doc.phone AS doctor_phone,
                   dp.specialization AS doctor_specialization, dp.consultation_fee AS consultationFee,
                   d.name AS department_name,
                   cr.diagnosis, cr.prescription, cr.consultation_notes
            FROM appointments a
            JOIN users p ON p.id = a.patient_id
            JOIN users doc ON doc.id = a.doctor_id
            LEFT JOIN doctor_profiles dp ON dp.user_id = doc.id
            LEFT JOIN departments d ON d.id = dp.department_id
            LEFT JOIN consultation_records cr ON cr.appointment_id = a.id
            WHERE a.id = ?
            LIMIT 1
        ");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ? $this->formatAppointmentRow($row) : null;
    }

    public function findByPatient(int $patientId): array {
        $stmt = $this->db->prepare("
            SELECT a.*,
                   p.name AS patient_name, p.email AS patient_email, p.phone AS patient_phone,
                   doc.name AS doctor_name, doc.email AS doctor_email, doc.phone AS doctor_phone,
                   dp.specialization AS doctor_specialization, dp.consultation_fee AS consultationFee,
                   d.name AS department_name,
                   cr.diagnosis, cr.prescription, cr.consultation_notes
            FROM appointments a
            JOIN users p ON p.id = a.patient_id
            JOIN users doc ON doc.id = a.doctor_id
            LEFT JOIN doctor_profiles dp ON dp.user_id = doc.id
            LEFT JOIN departments d ON d.id = dp.department_id
            LEFT JOIN consultation_records cr ON cr.appointment_id = a.id
            WHERE a.patient_id = ?
            ORDER BY a.appointment_date DESC, a.start_time DESC
        ");
        $stmt->execute([$patientId]);
        $rows = $stmt->fetchAll();
        return array_map([$this, 'formatAppointmentRow'], $rows);
    }

    public function findByDoctor(int $doctorId, ?string $status = null): array {
        $sql = "
            SELECT a.*,
                   p.name AS patient_name, p.email AS patient_email, p.phone AS patient_phone,
                   doc.name AS doctor_name, doc.email AS doctor_email, doc.phone AS doctor_phone,
                   dp.specialization AS doctor_specialization, dp.consultation_fee AS consultationFee,
                   d.name AS department_name,
                   cr.diagnosis, cr.prescription, cr.consultation_notes
            FROM appointments a
            JOIN users p ON p.id = a.patient_id
            JOIN users doc ON doc.id = a.doctor_id
            LEFT JOIN doctor_profiles dp ON dp.user_id = doc.id
            LEFT JOIN departments d ON d.id = dp.department_id
            LEFT JOIN consultation_records cr ON cr.appointment_id = a.id
            WHERE a.doctor_id = ?
        ";
        $params = [$doctorId];

        if ($status !== null && trim($status) !== '') {
            $sql .= " AND a.status = ? ";
            $params[] = $status;
        }

        $sql .= " ORDER BY a.appointment_date ASC, a.start_time ASC ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();
        return array_map([$this, 'formatAppointmentRow'], $rows);
    }

    public function findAll(?string $status = null, ?string $date = null): array {
        $sql = "
            SELECT a.*,
                   p.name AS patient_name, p.email AS patient_email, p.phone AS patient_phone,
                   doc.name AS doctor_name, doc.email AS doctor_email, doc.phone AS doctor_phone,
                   dp.specialization AS doctor_specialization, dp.consultation_fee AS consultationFee,
                   d.name AS department_name,
                   cr.diagnosis, cr.prescription, cr.consultation_notes
            FROM appointments a
            JOIN users p ON p.id = a.patient_id
            JOIN users doc ON doc.id = a.doctor_id
            LEFT JOIN doctor_profiles dp ON dp.user_id = doc.id
            LEFT JOIN departments d ON d.id = dp.department_id
            LEFT JOIN consultation_records cr ON cr.appointment_id = a.id
            WHERE 1=1
        ";
        $params = [];

        if ($status) {
            $sql .= " AND a.status = ? ";
            $params[] = $status;
        }
        if ($date) {
            $sql .= " AND a.appointment_date = ? ";
            $params[] = $date;
        }

        $sql .= " ORDER BY a.appointment_date DESC, a.start_time DESC ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();
        return array_map([$this, 'formatAppointmentRow'], $rows);
    }

    public function updateStatus(int $id, string $status): bool {
        $stmt = $this->db->prepare("UPDATE appointments SET status = ? WHERE id = ?");
        return $stmt->execute([$status, $id]);
    }

    public function isSlotBooked(int $doctorId, string $date, string $startTime): bool {
        $stmt = $this->db->prepare("
            SELECT COUNT(*) AS total
            FROM appointments
            WHERE doctor_id = ? AND appointment_date = ? AND start_time = ?
              AND status NOT IN ('cancelled', 'rejected')
        ");
        $stmt->execute([$doctorId, $date, $startTime]);
        $row = $stmt->fetch();
        return ($row['total'] ?? 0) > 0;
    }

    public function getBookedSlotsForDoctorAndDate(int $doctorId, string $date): array {
        $stmt = $this->db->prepare("
            SELECT start_time, end_time
            FROM appointments
            WHERE doctor_id = ? AND appointment_date = ?
              AND status NOT IN ('cancelled', 'rejected')
        ");
        $stmt->execute([$doctorId, $date]);
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
        return [
            'id' => (int)$row['id'],
            'appointmentNumber' => $row['appointment_number'],
            'appointmentDate' => $row['appointment_date'],
            'startTime' => substr($row['start_time'], 0, 5),
            'endTime' => substr($row['end_time'], 0, 5),
            'status' => strtoupper($row['status']),
            'reasonForVisit' => $row['reason_for_visit'],
            'createdAt' => $row['created_at'],
            'patient' => [
                'id' => (int)$row['patient_id'],
                'name' => $row['patient_name'],
                'email' => $row['patient_email'],
                'phone' => $row['patient_phone'],
            ],
            'doctor' => [
                'id' => (int)$row['doctor_id'],
                'name' => $row['doctor_name'],
                'email' => $row['doctor_email'],
                'phone' => $row['doctor_phone'],
                'specialization' => $row['doctor_specialization'] ?? 'Specialist',
                'department' => $row['department_name'] ?? 'General',
                'consultationFee' => (float)($row['consultationFee'] ?? 0)
            ],
            'consultation' => !empty($row['diagnosis']) || !empty($row['prescription']) || !empty($row['consultation_notes']) ? [
                'diagnosis' => $row['diagnosis'],
                'prescription' => $row['prescription'],
                'consultationNotes' => $row['consultation_notes'],
            ] : null
        ];
    }
}
