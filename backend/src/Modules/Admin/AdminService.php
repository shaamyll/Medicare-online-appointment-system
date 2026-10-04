<?php

namespace App\Modules\Admin;

use App\Config\Database;
use App\Config\SortConfig;
use App\Modules\Notification\NotificationService;
use App\Modules\Notification\NotificationTypes;
use Exception;
use PDO;

class AdminService {
    private PDO $db;
    private NotificationService $notificationService;

    public function __construct() {
        $this->db = Database::getConnection();
        $this->notificationService = new NotificationService();
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

        // Payment metrics
        $stmt = $this->db->query("
            SELECT 
                COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) AS total_revenue,
                SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid_count,
                SUM(CASE WHEN status = 'unpaid' THEN 1 ELSE 0 END) AS unpaid_count,
                SUM(CASE WHEN status = 'refunded' THEN 1 ELSE 0 END) AS refunded_count
            FROM payments
        ");
        $payStats = $stmt->fetch();
        $totalRevenue = (float)($payStats['total_revenue'] ?? 0);
        $paidCount = (int)($payStats['paid_count'] ?? 0);
        $unpaidCount = (int)($payStats['unpaid_count'] ?? 0);
        $refundedCount = (int)($payStats['refunded_count'] ?? 0);

        // Recent appointments
        $stmt = $this->db->query("
            SELECT a.id, a.appointment_number AS appointmentNumber, a.appointment_date AS appointmentDate,
                   a.start_time AS startTime, a.status,
                   p.name AS patientName, doc.name AS doctorName, d.name AS departmentName,
                   pm.status AS paymentStatus, pm.amount AS paymentAmount
            FROM appointments a
            JOIN users p ON p.id = a.patient_id
            JOIN users doc ON doc.id = a.doctor_id
            LEFT JOIN doctor_profiles dp ON dp.user_id = doc.id
            LEFT JOIN departments d ON d.id = dp.department_id
            LEFT JOIN payments pm ON pm.appointment_id = a.id
            ORDER BY a.created_at DESC
            LIMIT 5
        ");
        $recentAppointments = $stmt->fetchAll();

        // Doctor earnings & consultation revenue breakdown
        $docRevStmt = $this->db->query("
            SELECT 
                doc.id AS doctorId,
                doc.name AS doctorName,
                dp.specialization,
                d.name AS departmentName,
                dp.image_path AS imagePath,
                dp.thumbnail_path AS thumbnailPath,
                COALESCE(SUM(CASE WHEN pm.status = 'paid' THEN pm.amount ELSE 0 END), 0) AS totalEarned,
                SUM(CASE WHEN pm.status = 'paid' THEN 1 ELSE 0 END) AS paidAppointments,
                COUNT(a.id) AS totalAppointments
            FROM users doc
            JOIN doctor_profiles dp ON dp.user_id = doc.id
            LEFT JOIN departments d ON d.id = dp.department_id
            LEFT JOIN appointments a ON a.doctor_id = doc.id
            LEFT JOIN payments pm ON pm.appointment_id = a.id
            WHERE doc.role = 'doctor'
            GROUP BY doc.id, doc.name, dp.specialization, d.name, dp.image_path, dp.thumbnail_path
            ORDER BY totalEarned DESC, paidAppointments DESC
        ");
        $doctorRevenue = array_map(function ($row) {
            $row['doctorId'] = (int)$row['doctorId'];
            $row['totalEarned'] = (float)$row['totalEarned'];
            $row['paidAppointments'] = (int)$row['paidAppointments'];
            $row['totalAppointments'] = (int)$row['totalAppointments'];
            return $row;
        }, $docRevStmt->fetchAll());

        return [
            'totalDoctors' => $totalDoctors,
            'pendingApprovals' => $pendingApprovals,
            'totalPatients' => $totalPatients,
            'todayAppointments' => $todayAppointments,
            'upcomingAppointments' => $upcomingAppointments,
            'totalDepartments' => $totalDepartments,
            'totalRevenue' => $totalRevenue,
            'paidCount' => $paidCount,
            'unpaidCount' => $unpaidCount,
            'refundedCount' => $refundedCount,
            'payment' => [
                'totalRevenue' => $totalRevenue,
                'paidCount' => $paidCount,
                'unpaidCount' => $unpaidCount,
                'refundedCount' => $refundedCount,
            ],
            'doctorRevenue' => $doctorRevenue,
            'recentAppointments' => array_map(function ($row) {
                $row['startTime'] = substr($row['startTime'], 0, 5);
                $row['status'] = strtoupper($row['status']);
                return $row;
            }, $recentAppointments)
        ];
    }

    public function getAllDoctors(?string $status = null, ?string $sort = null, ?string $order = null): array {
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

        $orderBy = SortConfig::buildOrderBy('doctors', $sort, $order, SortConfig::ADMIN_DOCTORS);
        $sql .= " ORDER BY " . $orderBy;

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

        $stmt = $this->db->prepare("SELECT id, name, email, role, status FROM users WHERE id = ? AND role = 'doctor'");
        $stmt->execute([$doctorId]);
        $doctor = $stmt->fetch();

        if (!$doctor) {
            throw new Exception("Doctor not found.", 404);
        }

        $prevStatus = $doctor['status'];

        $updateStmt = $this->db->prepare("UPDATE users SET status = ? WHERE id = ?");
        $updateStmt->execute([$status, $doctorId]);

        // Send notifications based on status transition
        $eventType = null;
        if ($status === 'active' && $prevStatus === 'pending') {
            $eventType = NotificationTypes::DOCTOR_APPROVED;
        } elseif ($status === 'rejected') {
            $eventType = NotificationTypes::DOCTOR_REJECTED;
        } elseif ($status === 'inactive') {
            $eventType = NotificationTypes::DOCTOR_DEACTIVATED;
        } elseif ($status === 'active' && $prevStatus === 'inactive') {
            $eventType = NotificationTypes::DOCTOR_ACTIVATED;
        }

        if ($eventType) {
            $meta = NotificationTypes::build($eventType, [
                'doctorName' => $doctor['name'],
            ]);
            $this->notificationService->notify(
                $doctorId,
                $eventType,
                $meta['title'],
                $meta['message'],
                ['doctorId' => $doctorId, 'status' => $status],
                $meta['link']
            );
        }

        // If deactivated or rejected, terminate any open session immediately
        if ($status === 'inactive' || $status === 'rejected') {
            $this->notificationService->publishForceLogout(
                $doctorId,
                $status === 'inactive'
                    ? 'Your doctor account has been deactivated by administration.'
                    : 'Your doctor application was not approved.'
            );
        }

        // Invalidate admin and doctor lists
        $this->notificationService->publishDataChanged([$doctorId], ['doctors', 'admin-stats', 'doctor-requests']);

        return [
            'id' => $doctorId,
            'name' => $doctor['name'],
            'status' => $status
        ];
    }

    public function getPatients(?string $sort = null, ?string $order = null): array {
        $orderBy = SortConfig::buildOrderBy('doctors', $sort, $order, SortConfig::ADMIN_PATIENTS);
        $stmt = $this->db->query("
            SELECT u.id, u.name, u.email, u.phone, u.status, u.created_at AS createdAt,
                   COUNT(a.id) AS appointmentCount
            FROM users u
            LEFT JOIN appointments a ON a.patient_id = u.id
            WHERE u.role = 'patient'
            GROUP BY u.id
            ORDER BY {$orderBy}
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

        // Payment status breakdown & revenue
        $payStmt = $this->db->query("
            SELECT 
                status,
                COUNT(*) AS count,
                COALESCE(SUM(amount), 0) AS total_amount
            FROM payments
            GROUP BY status
        ");
        $paymentBreakdown = $payStmt->fetchAll();

        $revStmt = $this->db->query("
            SELECT 
                COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) AS total_revenue,
                SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid_count,
                SUM(CASE WHEN status = 'unpaid' THEN 1 ELSE 0 END) AS unpaid_count,
                SUM(CASE WHEN status = 'refunded' THEN 1 ELSE 0 END) AS refunded_count
            FROM payments
        ");
        $payTotals = $revStmt->fetch();

        return [
            'appointmentsByStatus' => $statusBreakdown,
            'doctorsByDepartment' => $departmentBreakdown,
            'paymentsByStatus' => $paymentBreakdown,
            'paymentMetrics' => [
                'totalRevenue' => (float)($payTotals['total_revenue'] ?? 0),
                'paidCount' => (int)($payTotals['paid_count'] ?? 0),
                'unpaidCount' => (int)($payTotals['unpaid_count'] ?? 0),
                'refundedCount' => (int)($payTotals['refunded_count'] ?? 0),
            ]
        ];
    }

    public function createDoctor(array $data, ?array $photoFile = null): array {
        $name = trim($data['name'] ?? '');
        if (mb_strlen($name) < 2 || mb_strlen($name) > 100) {
            throw new Exception("Doctor name must be between 2 and 100 characters.", 422);
        }

        $email = strtolower(trim($data['email'] ?? ''));
        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new Exception("A valid email address is required.", 422);
        }

        $existingUser = $this->db->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
        $existingUser->execute([$email]);
        if ($existingUser->fetch()) {
            throw new Exception("This email address is already registered.", 409);
        }

        $licenseNumber = trim($data['license_number'] ?? ($data['licenseNumber'] ?? ''));
        if (empty($licenseNumber)) {
            throw new Exception("Medical license number is required.", 422);
        }

        if (!preg_match('/^[A-Za-z0-9\-\/]{5,30}$/', $licenseNumber)) {
            throw new Exception("License number must be 5-30 characters containing only letters, numbers, hyphens, and slashes.", 422);
        }

        $existingLicense = $this->db->prepare("SELECT id FROM doctor_profiles WHERE license_number = ? LIMIT 1");
        $existingLicense->execute([$licenseNumber]);
        if ($existingLicense->fetch()) {
            throw new Exception("This license number is already registered.", 409);
        }

        $phone = isset($data['phone']) ? trim($data['phone']) : null;
        if ($phone !== null && $phone !== '') {
            $cleanDigits = preg_replace('/[^0-9]/', '', $phone);
            if (strlen($cleanDigits) < 10 || strlen($cleanDigits) > 15) {
                throw new Exception("Phone number must contain between 10 and 15 digits.", 422);
            }
        } else {
            $phone = null;
        }

        $departmentId = !empty($data['department_id']) ? (int)$data['department_id'] : (!empty($data['departmentId']) ? (int)$data['departmentId'] : null);
        if ($departmentId !== null) {
            $deptCheck = $this->db->prepare("SELECT id FROM departments WHERE id = ? LIMIT 1");
            $deptCheck->execute([$departmentId]);
            if (!$deptCheck->fetch()) {
                throw new Exception("Selected department does not exist.", 422);
            }
        }

        $specialization = trim($data['specialization'] ?? '');
        if (empty($specialization)) {
            throw new Exception("Medical specialization is required.", 422);
        }

        $qualification = trim($data['qualification'] ?? '');
        if (empty($qualification)) {
            throw new Exception("Medical qualification is required.", 422);
        }

        $experience = (int)($data['experience'] ?? ($data['experience_years'] ?? ($data['experienceYears'] ?? 0)));
        if ($experience < 0) {
            $experience = 0;
        }

        $consultationFee = (float)($data['consultation_fee'] ?? ($data['consultationFee'] ?? 0.00));
        if ($consultationFee < 0) {
            $consultationFee = 0.00;
        }

        $roomNumber = isset($data['room_number']) ? trim($data['room_number']) : (isset($data['roomNumber']) ? trim($data['roomNumber']) : null);
        $bio = isset($data['bio']) ? trim($data['bio']) : null;
        $clinicAddress = isset($data['clinic_address']) ? trim($data['clinic_address']) : (isset($data['clinicAddress']) ? trim($data['clinicAddress']) : $roomNumber);

        $imagePath = null;
        $thumbnailPath = null;
        $uploadService = null;
        if ($photoFile && isset($photoFile['error']) && $photoFile['error'] !== UPLOAD_ERR_NO_FILE) {
            $uploadService = new \App\Services\UploadService();
            $uploadResult = $uploadService->uploadDoctorPhoto($photoFile);
            $imagePath = $uploadResult['image_path'];
            $thumbnailPath = $uploadResult['thumbnail_path'];
        }

        $tempPassword = $this->generateTempPassword(12);
        $hashedPassword = password_hash($tempPassword, PASSWORD_BCRYPT);

        $this->db->beginTransaction();
        try {
            $userStmt = $this->db->prepare("
                INSERT INTO users (name, email, password, role, phone, status, created_at, updated_at)
                VALUES (?, ?, ?, 'doctor', ?, 'active', NOW(), NOW())
            ");
            $userStmt->execute([$name, $email, $hashedPassword, $phone]);
            $userId = (int)$this->db->lastInsertId();

            $profStmt = $this->db->prepare("
                INSERT INTO doctor_profiles (
                    user_id, department_id, specialization, qualification, license_number,
                    image_path, thumbnail_path, experience_years, consultation_fee, bio,
                    room_number, clinic_address, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ");
            $profStmt->execute([
                $userId,
                $departmentId,
                $specialization,
                $qualification,
                $licenseNumber,
                $imagePath,
                $thumbnailPath,
                $experience,
                $consultationFee,
                $bio,
                $roomNumber,
                $clinicAddress
            ]);

            $this->db->commit();
        } catch (\Throwable $e) {
            $this->db->rollBack();
            if ($uploadService && ($imagePath || $thumbnailPath)) {
                $uploadService->deleteFiles($imagePath, $thumbnailPath);
            }
            throw $e;
        }

        try {
            $this->notificationService->publishDataChanged([], ['doctors', 'admin-stats', 'departments']);
        } catch (\Throwable $ignored) {}

        $fetchStmt = $this->db->prepare("
            SELECT 
                u.id, u.name, u.email, u.phone, u.status, u.created_at AS createdAt,
                dp.specialization, dp.qualification, dp.experience_years AS experienceYears,
                dp.consultation_fee AS consultationFee, dp.room_number AS roomNumber,
                dp.license_number AS licenseNumber, dp.image_path AS imagePath, dp.thumbnail_path AS thumbnailPath,
                d.name AS departmentName, d.id AS departmentId
            FROM users u
            LEFT JOIN doctor_profiles dp ON dp.user_id = u.id
            LEFT JOIN departments d ON d.id = dp.department_id
            WHERE u.id = ?
            LIMIT 1
        ");
        $fetchStmt->execute([$userId]);
        $row = $fetchStmt->fetch();

        $row['id'] = (int)$row['id'];
        $row['experienceYears'] = (int)($row['experienceYears'] ?? 0);
        $row['consultationFee'] = (float)($row['consultationFee'] ?? 0);
        $row['departmentId'] = $row['departmentId'] ? (int)$row['departmentId'] : null;
        $row['tempPassword'] = $tempPassword;

        return $row;
    }

    public function createPatient(array $data): array {
        $name = trim($data['name'] ?? '');
        if (mb_strlen($name) < 2 || mb_strlen($name) > 80) {
            throw new Exception("Patient name must be between 2 and 80 characters.", 422);
        }

        $email = strtolower(trim($data['email'] ?? ''));
        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new Exception("A valid email address is required.", 422);
        }

        $existingUser = $this->db->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
        $existingUser->execute([$email]);
        if ($existingUser->fetch()) {
            throw new Exception("This email address is already registered.", 409);
        }

        $phone = isset($data['phone']) ? trim($data['phone']) : null;
        if ($phone !== null && $phone !== '') {
            $cleanDigits = preg_replace('/[^0-9]/', '', $phone);
            if (strlen($cleanDigits) < 10 || strlen($cleanDigits) > 15) {
                throw new Exception("Phone number must contain between 10 and 15 digits.", 422);
            }
        } else {
            $phone = null;
        }

        $gender = isset($data['gender']) ? strtolower(trim($data['gender'])) : null;
        if ($gender !== null && $gender !== '') {
            if (!in_array($gender, ['male', 'female', 'other'], true)) {
                throw new Exception("Gender must be male, female, or other.", 422);
            }
        } else {
            $gender = null;
        }

        $dobStr = isset($data['date_of_birth']) ? trim($data['date_of_birth']) : (isset($data['dateOfBirth']) ? trim($data['dateOfBirth']) : null);
        $dob = null;
        if ($dobStr !== null && $dobStr !== '') {
            $parsedDate = \DateTime::createFromFormat('Y-m-d', $dobStr);
            if (!$parsedDate || $parsedDate->format('Y-m-d') !== $dobStr) {
                throw new Exception("Date of birth must be a valid date in YYYY-MM-DD format.", 422);
            }
            $now = new \DateTime('today');
            if ($parsedDate > $now) {
                throw new Exception("Date of birth cannot be in the future.", 422);
            }
            $age = $now->diff($parsedDate)->y;
            if ($age < 0 || $age > 120) {
                throw new Exception("Age must be between 0 and 120 years.", 422);
            }
            $dob = $dobStr;
        }

        $tempPassword = $this->generateTempPassword(12);
        $hashedPassword = password_hash($tempPassword, PASSWORD_BCRYPT);

        $stmt = $this->db->prepare("
            INSERT INTO users (name, email, password, role, phone, gender, date_of_birth, status, created_at, updated_at)
            VALUES (?, ?, ?, 'patient', ?, ?, ?, 'active', NOW(), NOW())
        ");
        $stmt->execute([
            $name,
            $email,
            $hashedPassword,
            $phone,
            $gender,
            $dob
        ]);
        $userId = (int)$this->db->lastInsertId();

        try {
            $this->notificationService->publishDataChanged([], ['patients', 'admin-stats']);
        } catch (\Throwable $ignored) {}

        $fetchStmt = $this->db->prepare("
            SELECT u.id, u.name, u.email, u.phone, u.gender, u.date_of_birth AS dateOfBirth, u.status, u.created_at AS createdAt,
                   0 AS appointmentCount
            FROM users u
            WHERE u.id = ?
            LIMIT 1
        ");
        $fetchStmt->execute([$userId]);
        $row = $fetchStmt->fetch();

        $row['id'] = (int)$row['id'];
        $row['appointmentCount'] = 0;
        $row['tempPassword'] = $tempPassword;

        return $row;
    }

    private function generateTempPassword(int $length = 12): string {
        $chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $max = strlen($chars) - 1;
        $bytes = random_bytes($length);
        $pwd = '';
        for ($i = 0; $i < $length; $i++) {
            $pwd .= $chars[ord($bytes[$i]) % ($max + 1)];
        }
        if (!preg_match('/[A-Z]/', $pwd) || !preg_match('/[a-z]/', $pwd) || !preg_match('/\d/', $pwd)) {
            return $this->generateTempPassword($length);
        }
        return $pwd;
    }
}
