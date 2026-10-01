<?php

namespace App\Modules\Admin;

use App\Config\Database;
use Exception;
use PDO;

class AdminService {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function getDashboardStats(): array {
        // Total active doctors
        $stmt = $this->db->query("SELECT COUNT(*) AS total FROM users WHERE role = 'doctor' AND status = 'active'");
        $totalDoctors = (int)$stmt->fetch()['total'];

        // Pending doctor approvals
        $stmt = $this->db->query("SELECT COUNT(*) AS total FROM users WHERE role = 'doctor' AND status = 'pending'");
        $pendingApprovals = (int)$stmt->fetch()['total'];

        // Total patients
        $stmt = $this->db->query("SELECT COUNT(*) AS total FROM users WHERE role = 'patient'");
        $totalPatients = (int)$stmt->fetch()['total'];

        // Today's appointments
        $today = date('Y-m-d');
        $stmt = $this->db->prepare("SELECT COUNT(*) AS total FROM appointments WHERE appointment_date = ?");
        $stmt->execute([$today]);
        $todayAppointments = (int)$stmt->fetch()['total'];

        // Upcoming appointments (future dates)
        $stmt = $this->db->prepare("SELECT COUNT(*) AS total FROM appointments WHERE appointment_date >= ? AND status NOT IN ('cancelled', 'rejected')");
        $stmt->execute([$today]);
        $upcomingAppointments = (int)$stmt->fetch()['total'];

        // Total departments
        $stmt = $this->db->query("SELECT COUNT(*) AS total FROM departments WHERE is_active = 1");
        $totalDepartments = (int)$stmt->fetch()['total'];

        // Recent appointments
        $stmt = $this->db->query("
            SELECT a.id, a.appointment_number AS appointmentNumber, a.appointment_date AS appointmentDate,
                   a.start_time AS startTime, a.status,
                   p.name AS patientName, doc.name AS doctorName, d.name AS departmentName
            FROM appointments a
            JOIN users p ON p.id = a.patient_id
            JOIN users doc ON doc.id = a.doctor_id
            LEFT JOIN doctor_profiles dp ON dp.user_id = doc.id
            LEFT JOIN departments d ON d.id = dp.department_id
            ORDER BY a.created_at DESC
            LIMIT 5
        ");
        $recentAppointments = $stmt->fetchAll();

        return [
            'totalDoctors' => $totalDoctors,
            'pendingApprovals' => $pendingApprovals,
            'totalPatients' => $totalPatients,
            'todayAppointments' => $todayAppointments,
            'upcomingAppointments' => $upcomingAppointments,
            'totalDepartments' => $totalDepartments,
            'recentAppointments' => array_map(function ($row) {
                $row['startTime'] = substr($row['startTime'], 0, 5);
                $row['status'] = strtoupper($row['status']);
                return $row;
            }, $recentAppointments)
        ];
    }

    public function getAllDoctors(?string $status = null): array {
        $sql = "
            SELECT 
                u.id, u.name, u.email, u.phone, u.status, u.created_at AS createdAt,
                dp.specialization, dp.qualification, dp.experience_years AS experienceYears,
                dp.consultation_fee AS consultationFee, dp.room_number AS roomNumber,
                dp.license_number AS licenseNumber, dp.image_path AS imagePath, dp.thumbnail_path AS thumbnailPath,
                d.name AS departmentName, d.id AS departmentId
            FROM users u
            LEFT JOIN doctor_profiles dp ON dp.user_id = u.id
            LEFT JOIN departments d ON d.id = dp.department_id
            WHERE u.role = 'doctor'
        ";
        $params = [];

        if ($status) {
            $sql .= " AND u.status = ? ";
            $params[] = $status;
        }

        $sql .= " ORDER BY u.created_at DESC ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        return array_map(function ($row) {
            $row['id'] = (int)$row['id'];
            $row['experienceYears'] = (int)($row['experienceYears'] ?? 0);
            $row['consultationFee'] = (float)($row['consultationFee'] ?? 0);
            $row['licenseNumber'] = $row['licenseNumber'] ?? null;
            $row['imagePath'] = $row['imagePath'] ?? null;
            $row['thumbnailPath'] = $row['thumbnailPath'] ?? null;
            return $row;
        }, $rows);
    }

    public function setDoctorStatus(int $doctorId, string $status): array {
        $allowed = ['active', 'pending', 'rejected', 'inactive'];
        if (!in_array($status, $allowed, true)) {
            throw new Exception("Invalid status '{$status}'.", 400);
        }

        $stmt = $this->db->prepare("SELECT id, name, email, role FROM users WHERE id = ? AND role = 'doctor'");
        $stmt->execute([$doctorId]);
        $doctor = $stmt->fetch();

        if (!$doctor) {
            throw new Exception("Doctor not found.", 404);
        }

        $updateStmt = $this->db->prepare("UPDATE users SET status = ? WHERE id = ?");
        $updateStmt->execute([$status, $doctorId]);

        return [
            'id' => $doctorId,
            'name' => $doctor['name'],
            'status' => $status
        ];
    }

    public function getPatients(): array {
        $stmt = $this->db->query("
            SELECT u.id, u.name, u.email, u.phone, u.status, u.created_at AS createdAt,
                   COUNT(a.id) AS appointmentCount
            FROM users u
            LEFT JOIN appointments a ON a.patient_id = u.id
            WHERE u.role = 'patient'
            GROUP BY u.id
            ORDER BY u.created_at DESC
        ");
        $rows = $stmt->fetchAll();

        return array_map(function ($row) {
            $row['id'] = (int)$row['id'];
            $row['appointmentCount'] = (int)$row['appointmentCount'];
            return $row;
        }, $rows);
    }

    public function getReports(): array {
        // Appointments by status
        $statusStmt = $this->db->query("
            SELECT status, COUNT(*) AS count
            FROM appointments
            GROUP BY status
        ");
        $statusBreakdown = $statusStmt->fetchAll();

        // Doctors per department
        $deptStmt = $this->db->query("
            SELECT d.name, COUNT(dp.id) AS count
            FROM departments d
            LEFT JOIN doctor_profiles dp ON dp.department_id = d.id
            LEFT JOIN users u ON u.id = dp.user_id AND u.status = 'active'
            GROUP BY d.id
        ");
        $departmentBreakdown = $deptStmt->fetchAll();

        return [
            'appointmentsByStatus' => $statusBreakdown,
            'doctorsByDepartment' => $departmentBreakdown
        ];
    }
}
