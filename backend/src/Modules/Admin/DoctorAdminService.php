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

        return [
            'id' => $doctorId,
            'name' => $user['name'],
            'deleted' => true,
            'message' => "Dr. {$user['name']} has been permanently deleted."
        ];
    }
}
