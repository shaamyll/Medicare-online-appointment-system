<?php

namespace App\Modules\Payment;

use App\Config\Database;
use PDO;

class PaymentRepository {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function findByAppointmentId(int $appointmentId): ?array {
        $stmt = $this->db->prepare("
            SELECT p.*,
                   a.appointment_number, a.appointment_date, a.start_time, a.end_time, a.status AS appointment_status,
                   u_pat.id AS patient_id, u_pat.name AS patient_name, u_pat.email AS patient_email, u_pat.phone AS patient_phone,
                   u_doc.id AS doctor_id, u_doc.name AS doctor_name, u_doc.email AS doctor_email,
                   dp.specialization AS doctor_specialization,
                   dept.name AS department_name
            FROM payments p
            JOIN appointments a ON a.id = p.appointment_id
            JOIN users u_pat ON u_pat.id = a.patient_id
            JOIN users u_doc ON u_doc.id = a.doctor_id
            LEFT JOIN doctor_profiles dp ON dp.user_id = u_doc.id
            LEFT JOIN departments dept ON dept.id = dp.department_id
            WHERE p.appointment_id = ?
            LIMIT 1
        ");
        $stmt->execute([$appointmentId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function createOrGetForAppointment(int $appointmentId, float $amount): array {
        $existing = $this->findByAppointmentId($appointmentId);
        if ($existing) {
            return $existing;
        }

        $stmt = $this->db->prepare("
            INSERT INTO payments (appointment_id, amount, status)
            VALUES (?, ?, 'unpaid')
        ");
        $stmt->execute([$appointmentId, $amount]);

        return $this->findByAppointmentId($appointmentId);
    }

    public function markAsPaid(int $paymentId, string $method, string $transactionRef, string $paidAt): bool {
        $stmt = $this->db->prepare("
            UPDATE payments
            SET status = 'paid', method = ?, transaction_ref = ?, paid_at = ?
            WHERE id = ?
        ");
        return $stmt->execute([$method, $transactionRef, $paidAt, $paymentId]);
    }

    public function markAsRefunded(int $appointmentId): bool {
        $stmt = $this->db->prepare("
            UPDATE payments
            SET status = 'refunded'
            WHERE appointment_id = ? AND status = 'paid'
        ");
        return $stmt->execute([$appointmentId]);
    }

    public function getPaymentSummary(): array {
        $stmt = $this->db->query("
            SELECT 
                COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) AS total_revenue,
                SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid_count,
                SUM(CASE WHEN status = 'unpaid' THEN 1 ELSE 0 END) AS unpaid_count,
                SUM(CASE WHEN status = 'refunded' THEN 1 ELSE 0 END) AS refunded_count
            FROM payments
        ");
        $row = $stmt->fetch();
        return [
            'totalRevenue' => (float)($row['total_revenue'] ?? 0),
            'paidCount' => (int)($row['paid_count'] ?? 0),
            'unpaidCount' => (int)($row['unpaid_count'] ?? 0),
            'refundedCount' => (int)($row['refunded_count'] ?? 0),
        ];
    }
}
