<?php

namespace App\Modules\Admin;

use App\Config\Database;
use App\Services\UploadService;
use Exception;
use PDO;

class DoctorAdminService {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    /**
     * Calculate delete impact (total and upcoming appointments) for a doctor.
     */
    public function getDeleteImpact(int $doctorId): array {
        $stmt = $this->db->prepare("SELECT id, name, email, role FROM users WHERE id = ?");
        $stmt->execute([$doctorId]);
        $user = $stmt->fetch();

        if (!$user) {
            throw new Exception("Doctor not found.", 404);
        }

        if ($user['role'] === 'admin') {
            throw new Exception("Cannot delete administrative accounts.", 403);
        }

        if ($user['role'] !== 'doctor') {
            throw new Exception("User is not a doctor.", 400);
        }

        // Fetch doctor profile details
        $stmtProf = $this->db->prepare("SELECT specialization, image_path, thumbnail_path FROM doctor_profiles WHERE user_id = ?");
        $stmtProf->execute([$doctorId]);
        $profile = $stmtProf->fetch() ?: [];

        // Count total appointments
        $stmtTotal = $this->db->prepare("SELECT COUNT(*) AS total FROM appointments WHERE doctor_id = ?");
        $stmtTotal->execute([$doctorId]);
        $totalAppointments = (int)($stmtTotal->fetch()['total'] ?? 0);

        // Count upcoming appointments (today onwards, not cancelled or rejected)
        $today = date('Y-m-d');
        $stmtUpcoming = $this->db->prepare("
            SELECT COUNT(*) AS upcoming 
            FROM appointments 
            WHERE doctor_id = ? 
              AND appointment_date >= ? 
              AND status NOT IN ('cancelled', 'rejected')
        ");
        $stmtUpcoming->execute([$doctorId, $today]);
        $upcomingAppointments = (int)($stmtUpcoming->fetch()['upcoming'] ?? 0);

        return [
            'doctorId' => $doctorId,
            'doctor' => [
                'id' => $doctorId,
                'name' => $user['name'],
                'email' => $user['email'],
                'specialization' => $profile['specialization'] ?? '',
                'imagePath' => $profile['image_path'] ?? null,
                'thumbnailPath' => $profile['thumbnail_path'] ?? null,
            ],
            'totalAppointments' => $totalAppointments,
            'upcomingAppointments' => $upcomingAppointments
        ];
    }

    /**
     * Hard-delete doctor, dependent rows, and profile photos within a single transaction.
     */
    public function deleteDoctor(int $doctorId): array {
        $stmt = $this->db->prepare("SELECT id, name, email, role FROM users WHERE id = ?");
        $stmt->execute([$doctorId]);
        $user = $stmt->fetch();

        if (!$user) {
            throw new Exception("Doctor not found.", 404);
        }

        if ($user['role'] === 'admin') {
            throw new Exception("Cannot delete administrative accounts.", 403);
        }

        if ($user['role'] !== 'doctor') {
            throw new Exception("User is not a doctor.", 400);
        }

        // Fetch image paths before deletion
        $stmtProf = $this->db->prepare("SELECT image_path, thumbnail_path FROM doctor_profiles WHERE user_id = ?");
        $stmtProf->execute([$doctorId]);
        $profile = $stmtProf->fetch() ?: [];
        $imagePath = $profile['image_path'] ?? null;
        $thumbnailPath = $profile['thumbnail_path'] ?? null;

        // Perform hard deletion in transaction
        $this->db->beginTransaction();
        try {
            // 1. Delete consultation records for doctor's appointments
            $stmtCr = $this->db->prepare("
                DELETE cr FROM consultation_records cr
                INNER JOIN appointments a ON cr.appointment_id = a.id
                WHERE a.doctor_id = ?
            ");
            $stmtCr->execute([$doctorId]);

            // 2. Delete all appointments with this doctor
            $stmtAppt = $this->db->prepare("DELETE FROM appointments WHERE doctor_id = ?");
            $stmtAppt->execute([$doctorId]);

            // 3. Delete doctor schedules
            $stmtSched = $this->db->prepare("DELETE FROM doctor_schedules WHERE doctor_id = ?");
            $stmtSched->execute([$doctorId]);

            // 4. Delete doctor profile
            $stmtProfDel = $this->db->prepare("DELETE FROM doctor_profiles WHERE user_id = ?");
            $stmtProfDel->execute([$doctorId]);

            // 5. Delete user record
            $stmtUserDel = $this->db->prepare("DELETE FROM users WHERE id = ? AND role = 'doctor'");
            $stmtUserDel->execute([$doctorId]);

            $this->db->commit();
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw new Exception("Failed to delete doctor: " . $e->getMessage(), 500);
        }

        // After successful commit, remove image and thumbnail files (ignoring defaults)
        if (!empty($imagePath) || !empty($thumbnailPath)) {
            $uploadService = new UploadService();
            $uploadService->deleteFiles($imagePath, $thumbnailPath);
        }

        // Force logout any open session of the deleted doctor and refresh lists
        try {
            $notificationService = new \App\Modules\Notification\NotificationService();
            $notificationService->publishForceLogout($doctorId, 'Your account has been deleted by administration.');
            $notificationService->publishDataChanged([], ['doctors', 'admin-stats', 'doctor-requests']);
        } catch (\Throwable $ignored) {}

        return [
            'id' => $doctorId,
            'name' => $user['name'],
            'deleted' => true,
            'message' => "Dr. {$user['name']} has been permanently deleted."
        ];
    }

    /**
     * Retrieve aggregated doctor details for Admin Doctor Details Modal.
     */
    public function getDoctorDetails(int $doctorId): array {
        $stmt = $this->db->prepare("
            SELECT u.id, u.name, u.email, u.phone, u.status, u.created_at, u.updated_at,
                   dp.id AS profile_id, dp.department_id, dp.specialization, dp.qualification,
                   dp.license_number, dp.image_path, dp.thumbnail_path, dp.experience_years,
                   dp.consultation_fee, dp.bio, dp.room_number,
                   d.name AS department_name
            FROM users u
            LEFT JOIN doctor_profiles dp ON dp.user_id = u.id
            LEFT JOIN departments d ON d.id = dp.department_id
            WHERE u.id = ? AND u.role = 'doctor'
            LIMIT 1
        ");
        $stmt->execute([$doctorId]);
        $row = $stmt->fetch();

        if (!$row) {
            throw new Exception("Doctor not found.", 404);
        }

        // Fetch weekly schedules
        $schedStmt = $this->db->prepare("
            SELECT day_of_week, start_time, end_time, slot_duration_minutes, is_available
            FROM doctor_schedules
            WHERE doctor_id = ?
            ORDER BY FIELD(day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
        ");
        $schedStmt->execute([$doctorId]);
        $scheduleRows = $schedStmt->fetchAll();
        $schedule = array_map(function($s) {
            return [
                'dayOfWeek' => $s['day_of_week'],
                'startTime' => substr($s['start_time'], 0, 5),
                'endTime' => substr($s['end_time'], 0, 5),
                'slotDurationMinutes' => (int)($s['slot_duration_minutes'] ?? 30),
                'isAvailable' => (bool)$s['is_available']
            ];
        }, $scheduleRows);

        // Stats aggregated in single query
        $statsStmt = $this->db->prepare("
            SELECT 
                COUNT(*) AS total_appointments,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_appointments,
                SUM(CASE WHEN status IN ('pending', 'approved') AND appointment_date >= CURDATE() THEN 1 ELSE 0 END) AS upcoming_appointments,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_appointments,
                COUNT(DISTINCT patient_id) AS unique_patients
            FROM appointments
            WHERE doctor_id = ?
        ");
        $statsStmt->execute([$doctorId]);
        $statsRow = $statsStmt->fetch() ?: [];

        // Ratings aggregated
        $ratingStmt = $this->db->prepare("
            SELECT 
                COALESCE(ROUND(AVG(rating), 1), 0.0) AS rating_avg,
                COUNT(*) AS rating_count
            FROM feedback
            WHERE doctor_id = ?
        ");
        $ratingStmt->execute([$doctorId]);
        $ratingRow = $ratingStmt->fetch() ?: [];

        // Revenue (sum of paid amounts for this doctor's appointments)
        $revenueStmt = $this->db->prepare("
            SELECT COALESCE(SUM(p.amount), 0.00) AS total_revenue
            FROM payments p
            JOIN appointments a ON a.id = p.appointment_id
            WHERE a.doctor_id = ? AND p.status = 'paid'
        ");
        $revenueStmt->execute([$doctorId]);
        $revenueRow = $revenueStmt->fetch() ?: [];

        // Recent reviews (3)
        $revStmt = $this->db->prepare("
            SELECT f.id, f.rating, f.comment, f.tags, f.created_at, f.updated_at,
                   u.name AS patient_name
            FROM feedback f
            JOIN users u ON u.id = f.patient_id
            WHERE f.doctor_id = ?
            ORDER BY f.created_at DESC
            LIMIT 3
        ");
        $revStmt->execute([$doctorId]);
        $recentReviews = array_map(function($r) {
            $tags = !empty($r['tags']) ? (is_string($r['tags']) ? json_decode($r['tags'], true) : $r['tags']) : [];
            return [
                'id' => (int)$r['id'],
                'patientName' => $r['patient_name'],
                'rating' => (int)$r['rating'],
                'comment' => $r['comment'],
                'tags' => $tags,
                'createdAt' => $r['created_at'],
                'updatedAt' => $r['updated_at'] ?? null,
            ];
        }, $revStmt->fetchAll());

        // Recent appointments (5)
        $aptStmt = $this->db->prepare("
            SELECT a.id, a.appointment_number, a.appointment_date, a.start_time, a.status,
                   u.name AS patient_name,
                   p.status AS payment_status
            FROM appointments a
            JOIN users u ON u.id = a.patient_id
            LEFT JOIN payments p ON p.appointment_id = a.id
            WHERE a.doctor_id = ?
            ORDER BY a.appointment_date DESC, a.start_time DESC
            LIMIT 5
        ");
        $aptStmt->execute([$doctorId]);
        $recentAppointments = array_map(function($a) {
            return [
                'id' => (int)$a['id'],
                'appointmentNumber' => $a['appointment_number'],
                'patientName' => $a['patient_name'],
                'appointmentDate' => $a['appointment_date'],
                'startTime' => substr($a['start_time'], 0, 5),
                'status' => strtoupper($a['status']),
                'paymentStatus' => $a['payment_status'] ?? 'unpaid'
            ];
        }, $aptStmt->fetchAll());

        return [
            'profile' => [
                'id' => (int)$row['id'],
                'name' => $row['name'],
                'email' => $row['email'],
                'phone' => $row['phone'],
                'status' => $row['status'],
                'createdAt' => $row['created_at'],
                'approvedAt' => $row['status'] === 'active' ? $row['updated_at'] : null,
                'imagePath' => $row['image_path'],
                'thumbnailPath' => $row['thumbnail_path'],
            ],
            'professional' => [
                'specialization' => $row['specialization'] ?? '',
                'departmentId' => $row['department_id'] ? (int)$row['department_id'] : null,
                'departmentName' => $row['department_name'] ?? 'General Medicine',
                'qualification' => $row['qualification'] ?? '',
                'experienceYears' => (int)($row['experience_years'] ?? 0),
                'licenseNumber' => $row['license_number'] ?? '',
                'roomNumber' => $row['room_number'] ?? '',
                'consultationFee' => (float)($row['consultation_fee'] ?? 0),
                'bio' => $row['bio'] ?? '',
            ],
            'schedule' => $schedule,
            'stats' => [
                'totalAppointments' => (int)($statsRow['total_appointments'] ?? 0),
                'completedAppointments' => (int)($statsRow['completed_appointments'] ?? 0),
                'upcomingAppointments' => (int)($statsRow['upcoming_appointments'] ?? 0),
                'cancelledAppointments' => (int)($statsRow['cancelled_appointments'] ?? 0),
                'uniquePatients' => (int)($statsRow['unique_patients'] ?? 0),
                'ratingAvg' => (float)($ratingRow['rating_avg'] ?? 0),
                'ratingCount' => (int)($ratingRow['rating_count'] ?? 0),
                'totalRevenue' => (float)($revenueRow['total_revenue'] ?? 0),
            ],
            'recentReviews' => $recentReviews,
            'recentAppointments' => $recentAppointments,
        ];
    }
}
