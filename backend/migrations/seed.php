<?php

require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;

Database::loadEnv();
$pdo = Database::getConnection();

echo "Running migrations...\n";
$schemaSql = file_get_contents(__DIR__ . '/schema.sql');

// Split queries by semicolon (ignoring comments)
$queries = explode(';', $schemaSql);
foreach ($queries as $query) {
    $trimmed = trim($query);
    if (!empty($trimmed)) {
        $pdo->exec($trimmed);
    }
}
echo "Schema migrated successfully.\n";

// Ensure new columns exist on doctor_profiles, appointments, users, and feedback idempotently
$requiredColumns = [
    'users' => [
        'gender' => "ALTER TABLE `users` ADD COLUMN `gender` ENUM('male', 'female', 'other') NULL AFTER `phone`",
        'date_of_birth' => "ALTER TABLE `users` ADD COLUMN `date_of_birth` DATE NULL AFTER `gender`"
    ],
    'feedback' => [
        'tags' => "ALTER TABLE `feedback` ADD COLUMN `tags` JSON NULL AFTER `comment`",
        'updated_at' => "ALTER TABLE `feedback` ADD COLUMN `updated_at` DATETIME NULL ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`"
    ],
    'doctor_profiles' => [
        'license_number' => "ALTER TABLE `doctor_profiles` ADD COLUMN `license_number` VARCHAR(50) NULL UNIQUE AFTER `qualification`",
        'image_path' => "ALTER TABLE `doctor_profiles` ADD COLUMN `image_path` VARCHAR(255) NULL AFTER `bio`",
        'thumbnail_path' => "ALTER TABLE `doctor_profiles` ADD COLUMN `thumbnail_path` VARCHAR(255) NULL AFTER `image_path`",
        'clinic_address' => "ALTER TABLE `doctor_profiles` ADD COLUMN `clinic_address` VARCHAR(255) NULL AFTER `room_number`"
    ],
    'appointments' => [
        'rejection_reason' => "ALTER TABLE `appointments` ADD COLUMN `rejection_reason` VARCHAR(255) NULL AFTER `reason_for_visit`",
        'reschedule_count' => "ALTER TABLE `appointments` ADD COLUMN `reschedule_count` INT DEFAULT 0 AFTER `rejection_reason`"
    ]
];

// Clean up any deprecated patient photo/avatar/medical columns from users table if present
$deprecatedPatientCols = ['image_path', 'thumbnail_path', 'avatar', 'blood_group', 'address', 'emergency_contact'];
foreach ($deprecatedPatientCols as $depCol) {
    $colCheck = $pdo->prepare("SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = ?");
    $colCheck->execute([$depCol]);
    if ((int)$colCheck->fetchColumn() > 0) {
        $pdo->exec("ALTER TABLE `users` DROP COLUMN `{$depCol}`");
        echo "Dropped deprecated column '{$depCol}' from users table.\n";
    }
}

foreach ($requiredColumns as $tableName => $cols) {
    foreach ($cols as $colName => $alterSql) {
        $colCheck = $pdo->prepare("
            SELECT COUNT(*) 
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
              AND TABLE_NAME = ? 
              AND COLUMN_NAME = ?
        ");
        $colCheck->execute([$tableName, $colName]);
        if ((int)$colCheck->fetchColumn() === 0) {
            $pdo->exec($alterSql);
            echo "Added column '{$colName}' to {$tableName}.\n";
        }
    }
}

// Seed Admin Account
$adminEmail = getenv('ADMIN_EMAIL') ?: 'admin@medicare.com';
$adminPass = getenv('ADMIN_PASSWORD') ?: 'AdminPassword123!';
$adminName = getenv('ADMIN_NAME') ?: 'Hospital Administrator';

$stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$adminEmail]);
$existingAdmin = $stmt->fetch();

if (!$existingAdmin) {
    $hashedPassword = password_hash($adminPass, PASSWORD_BCRYPT);
    $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, 'admin', 'active')");
    $stmt->execute([$adminName, $adminEmail, $hashedPassword]);
    echo "Seeded Admin: {$adminEmail} / {$adminPass}\n";
} else {
    echo "Admin {$adminEmail} already exists.\n";
}

// Seed Secondary Admin Account: admin123@medicare.com / 123456
$admin2Email = 'admin123@medicare.com';
$admin2Pass = '123456';
$admin2Name = 'System Administrator';

$stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$admin2Email]);
$existingAdmin2 = $stmt->fetch();
$hashedAdmin2Pass = password_hash($admin2Pass, PASSWORD_BCRYPT);

if (!$existingAdmin2) {
    $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, 'admin', 'active')");
    $stmt->execute([$admin2Name, $admin2Email, $hashedAdmin2Pass]);
    echo "Seeded Admin: {$admin2Email} / {$admin2Pass}\n";
} else {
    $stmt = $pdo->prepare("UPDATE users SET password = ?, role = 'admin', status = 'active' WHERE id = ?");
    $stmt->execute([$hashedAdmin2Pass, $existingAdmin2['id']]);
    echo "Updated Admin: {$admin2Email} / {$admin2Pass}\n";
}

// Seed Departments
$departments = [
    [
        'name' => 'Cardiology',
        'description' => 'Comprehensive diagnosis and treatment for cardiovascular disorders and heart health.',
        'icon' => 'Heart'
    ],
    [
        'name' => 'Neurology',
        'description' => 'Specialized care for neurological disorders, stroke rehabilitation, and spine health.',
        'icon' => 'Brain'
    ],
    [
        'name' => 'Pediatrics',
        'description' => 'Compassionate care for infants, children, and adolescents with preventive medicine.',
        'icon' => 'Baby'
    ],
    [
        'name' => 'Orthopedics',
        'description' => 'Expert management of bone fractures, joint replacements, and sports medicine injuries.',
        'icon' => 'Bone'
    ],
    [
        'name' => 'Dermatology',
        'description' => 'Advanced dermatological care for skin ailments, cosmetic consultations, and laser therapy.',
        'icon' => 'Sparkles'
    ],
    [
        'name' => 'General Medicine',
        'description' => 'Primary care, chronic illness monitoring, health screening, and routine health checks.',
        'icon' => 'Stethoscope'
    ],
];

foreach ($departments as $dept) {
    $stmt = $pdo->prepare("SELECT id FROM departments WHERE name = ?");
    $stmt->execute([$dept['name']]);
    if (!$stmt->fetch()) {
        $stmt = $pdo->prepare("INSERT INTO departments (name, description, icon) VALUES (?, ?, ?)");
        $stmt->execute([$dept['name'], $dept['description'], $dept['icon']]);
    }
}
echo "Seeded departments.\n";

// Fetch department IDs
$deptStmt = $pdo->query("SELECT id, name FROM departments");
$deptMap = [];
while ($row = $deptStmt->fetch()) {
    $deptMap[$row['name']] = (int)$row['id'];
}

// Seed an Approved Doctor
$docEmail = 'dr.sarah@medicare.com';
$stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$docEmail]);
$existingDoc = $stmt->fetch();

$defaultAvatar = 'uploads/defaults/doctor-default.png';

if (!$existingDoc) {
    $docPass = password_hash('Doctor123!', PASSWORD_BCRYPT);
    $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role, phone, status) VALUES (?, ?, ?, 'doctor', ?, 'active')");
    $stmt->execute(['Dr. Sarah Jenkins, MD', $docEmail, $docPass, '+1 555-019-2831']);
    $docId = (int)$pdo->lastInsertId();

    $cardioId = $deptMap['Cardiology'] ?? null;
    $stmt = $pdo->prepare("INSERT INTO doctor_profiles (user_id, department_id, specialization, qualification, license_number, image_path, thumbnail_path, experience_years, consultation_fee, bio, room_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $docId,
        $cardioId,
        'Interventional Cardiology',
        'MD, FACC, Harvard Medical School',
        'MED-CA-2014-8842',
        $defaultAvatar,
        $defaultAvatar,
        12,
        120.00,
        'Dr. Sarah Jenkins is an experienced board-certified cardiologist with over a decade of clinical expertise in cardiac interventions and preventive cardiovascular health.',
        'Suite 402 - Cardiology Wing'
    ]);

    // Seed Doctor Schedule
    $days = ['Monday', 'Wednesday', 'Friday'];
    foreach ($days as $day) {
        $schedStmt = $pdo->prepare("INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, is_available) VALUES (?, ?, '09:00:00', '16:00:00', 30, 1)");
        $schedStmt->execute([$docId, $day]);
    }
    echo "Seeded Approved Doctor: {$docEmail} / Doctor123!\n";
} else {
    // Ensure existing approved doctor has license and avatar
    $upStmt = $pdo->prepare("
        UPDATE doctor_profiles 
        SET license_number = COALESCE(license_number, 'MED-CA-2014-8842'),
            image_path = COALESCE(image_path, ?),
            thumbnail_path = COALESCE(thumbnail_path, ?)
        WHERE user_id = ?
    ");
    $upStmt->execute([$defaultAvatar, $defaultAvatar, (int)$existingDoc['id']]);
    echo "Updated existing Approved Doctor credentials: {$docEmail}\n";
}

// Seed a Pending Doctor for Approval Request Testing
$pendingDocEmail = 'dr.michael@medicare.com';
$stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$pendingDocEmail]);
$existingPending = $stmt->fetch();

if (!$existingPending) {
    $pendingPass = password_hash('Doctor123!', PASSWORD_BCRYPT);
    $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role, phone, status) VALUES (?, ?, ?, 'doctor', ?, 'pending')");
    $stmt->execute(['Dr. Michael Chang, MD', $pendingDocEmail, $pendingPass, '+1 555-019-9942']);
    $pendingId = (int)$pdo->lastInsertId();

    $neuroId = $deptMap['Neurology'] ?? null;
    $stmt = $pdo->prepare("INSERT INTO doctor_profiles (user_id, department_id, specialization, qualification, license_number, image_path, thumbnail_path, experience_years, consultation_fee, bio, room_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $pendingId,
        $neuroId,
        'Pediatric Neurology',
        'MD, Johns Hopkins University',
        'MED-MD-2018-4921',
        $defaultAvatar,
        $defaultAvatar,
        8,
        150.00,
        'Dr. Michael Chang specializes in pediatric neurology, epilepsy, and developmental neurological disorders.',
        'Suite 305'
    ]);
    echo "Seeded Pending Doctor Request: {$pendingDocEmail}\n";
} else {
    // Ensure existing pending doctor has license and avatar
    $upStmt = $pdo->prepare("
        UPDATE doctor_profiles 
        SET license_number = COALESCE(license_number, 'MED-MD-2018-4921'),
            image_path = COALESCE(image_path, ?),
            thumbnail_path = COALESCE(thumbnail_path, ?)
        WHERE user_id = ?
    ");
    $upStmt->execute([$defaultAvatar, $defaultAvatar, (int)$existingPending['id']]);
    echo "Updated existing Pending Doctor credentials: {$pendingDocEmail}\n";
}

// Seed an Inactive Doctor for Testing
$inactiveDocEmail = 'dr.emily@medicare.com';
$stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$inactiveDocEmail]);
$existingInactive = $stmt->fetch();

if (!$existingInactive) {
    $inactivePass = password_hash('Doctor123!', PASSWORD_BCRYPT);
    $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role, phone, status) VALUES (?, ?, ?, 'doctor', ?, 'inactive')");
    $stmt->execute(['Dr. Emily Watson, MD', $inactiveDocEmail, $inactivePass, '+1 555-019-3829']);
    $inactiveId = (int)$pdo->lastInsertId();

    $dermaId = $deptMap['Dermatology'] ?? null;
    $stmt = $pdo->prepare("INSERT INTO doctor_profiles (user_id, department_id, specialization, qualification, license_number, image_path, thumbnail_path, experience_years, consultation_fee, bio, room_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $inactiveId,
        $dermaId,
        'Clinical Dermatology',
        'MD, Stanford University School of Medicine',
        'MED-CA-2016-5912',
        $defaultAvatar,
        $defaultAvatar,
        9,
        140.00,
        'Dr. Emily Watson is a clinical dermatologist specializing in inflammatory skin diseases and advanced laser therapeutics.',
        'Room 204'
    ]);
    echo "Seeded Inactive Doctor: {$inactiveDocEmail}\n";
}

// Seed a Demo Patient with gender and date_of_birth
$patientEmail = 'patient@medicare.com';
$stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$patientEmail]);
$patient = $stmt->fetch();
if (!$patient) {
    $patientPass = password_hash('Patient123!', PASSWORD_BCRYPT);
    $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role, phone, gender, date_of_birth, status) VALUES (?, ?, ?, 'patient', ?, 'male', '1990-05-15', 'active')");
    $stmt->execute(['Johnathan Doe', $patientEmail, $patientPass, '+1 555-012-3456']);
    $patientId = (int)$pdo->lastInsertId();
    echo "Seeded Demo Patient: {$patientEmail} / Patient123!\n";
} else {
    $patientId = (int)$patient['id'];
    $pdo->prepare("UPDATE users SET phone = COALESCE(phone, '+1 555-012-3456'), gender = COALESCE(gender, 'male'), date_of_birth = COALESCE(date_of_birth, '1990-05-15') WHERE id = ?")->execute([$patientId]);
}

// Fetch approved doctor ID
$stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute(['dr.sarah@medicare.com']);
$docUser = $stmt->fetch();
$approvedDocId = $docUser ? (int)$docUser['id'] : null;

// Backfill payments for all existing appointments that lack a payment row
$unpaidAppts = $pdo->query("
    SELECT a.id, a.doctor_id, dp.consultation_fee 
    FROM appointments a
    LEFT JOIN payments p ON p.appointment_id = a.id
    LEFT JOIN doctor_profiles dp ON dp.user_id = a.doctor_id
    WHERE p.id IS NULL
")->fetchAll(PDO::FETCH_ASSOC);

if (!empty($unpaidAppts)) {
    $payStmt = $pdo->prepare("INSERT INTO payments (appointment_id, amount, status) VALUES (?, ?, 'unpaid')");
    foreach ($unpaidAppts as $uAppt) {
        $amount = (float)($uAppt['consultation_fee'] ?: 100.00);
        $payStmt->execute([$uAppt['id'], $amount]);
    }
    echo "Backfilled payments for " . count($unpaidAppts) . " existing appointments.\n";
}

// Ensure sample appointments exist for demonstration (each checked individually by appointment_number)
if ($approvedDocId && $patientId) {
    $sampleData = [
        [
            'num' => 'APT-202610-0001',
            'date' => date('Y-m-d', strtotime('+2 days')),
            'start' => '09:00:00',
            'end' => '09:30:00',
            'status' => 'pending',
            'reason' => 'Routine cardiology consultation and BP checkup.',
            'pay_status' => 'unpaid',
            'pay_method' => null,
            'pay_ref' => null,
            'is_completed' => false,
            'is_rescheduled' => false,
        ],
        [
            'num' => 'APT-202610-0002',
            'date' => date('Y-m-d', strtotime('+3 days')),
            'start' => '10:00:00',
            'end' => '10:30:00',
            'status' => 'approved',
            'reason' => 'Follow up on previous ECG findings and chest tightness.',
            'pay_status' => 'paid',
            'pay_method' => 'upi',
            'pay_ref' => 'MC-20261001-A1B2C3',
            'is_completed' => false,
            'is_rescheduled' => true,
        ],
        [
            'num' => 'APT-202609-0003',
            'date' => date('Y-m-d', strtotime('-5 days')),
            'start' => '11:00:00',
            'end' => '11:30:00',
            'status' => 'completed',
            'reason' => 'Chest pain evaluation after physical exercise.',
            'pay_status' => 'paid',
            'pay_method' => 'card',
            'pay_ref' => 'MC-20260928-XY89ZK',
            'is_completed' => true,
            'has_review' => true,
            'is_rescheduled' => false,
        ],
        [
            'num' => 'APT-202609-0005',
            'date' => date('Y-m-d', strtotime('-2 days')),
            'start' => '15:00:00',
            'end' => '15:30:00',
            'status' => 'completed',
            'reason' => 'Routine cardiology checkup and medication review.',
            'pay_status' => 'paid',
            'pay_method' => 'upi',
            'pay_ref' => 'MC-20261001-COMP02',
            'is_completed' => true,
            'has_review' => false,
            'is_rescheduled' => false,
        ],
        [
            'num' => 'APT-202609-0004',
            'date' => date('Y-m-d', strtotime('-1 days')),
            'start' => '14:00:00',
            'end' => '14:30:00',
            'status' => 'rejected',
            'reason' => 'Annual heart health assessment.',
            'rejection_reason' => 'Doctor called for emergency cardiovascular surgery at regional hospital.',
            'pay_status' => 'refunded',
            'pay_method' => 'upi',
            'pay_ref' => 'MC-20261002-REF001',
            'is_completed' => false,
            'has_review' => false,
            'is_rescheduled' => false,
        ],
    ];

    foreach ($sampleData as $item) {
        $chk = $pdo->prepare("SELECT id FROM appointments WHERE appointment_number = ?");
        $chk->execute([$item['num']]);
        if ($chk->fetch()) {
            continue;
        }

        $insAppt = $pdo->prepare("
            INSERT INTO appointments (appointment_number, patient_id, doctor_id, appointment_date, start_time, end_time, status, reason_for_visit, rejection_reason, reschedule_count)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $resCount = $item['is_rescheduled'] ? 1 : 0;
        $rejReason = $item['rejection_reason'] ?? null;
        $insAppt->execute([
            $item['num'],
            $patientId,
            $approvedDocId,
            $item['date'],
            $item['start'],
            $item['end'],
            $item['status'],
            $item['reason'],
            $rejReason,
            $resCount
        ]);
        $apptId = (int)$pdo->lastInsertId();

        // Payment
        $payIns = $pdo->prepare("
            INSERT INTO payments (appointment_id, amount, status, method, transaction_ref, paid_at)
            VALUES (?, 120.00, ?, ?, ?, ?)
        ");
        $paidAt = $item['pay_status'] === 'unpaid' ? null : date('Y-m-d H:i:s', strtotime('-1 hour'));
        $payIns->execute([$apptId, $item['pay_status'], $item['pay_method'], $item['pay_ref'], $paidAt]);

        // Reschedule log if applicable
        if ($item['is_rescheduled']) {
            $oldDate = date('Y-m-d', strtotime('+1 day'));
            $resIns = $pdo->prepare("
                INSERT INTO appointment_reschedules (appointment_id, old_date, old_start_time, new_date, new_start_time, rescheduled_by)
                VALUES (?, ?, '11:00:00', ?, ?, ?)
            ");
            $resIns->execute([$apptId, $oldDate, $item['date'], $item['start'], $patientId]);
        }

        // Completed consultation record & feedback
        if ($item['is_completed']) {
            $consIns = $pdo->prepare("
                INSERT INTO consultation_records (appointment_id, diagnosis, prescription, consultation_notes)
                VALUES (?, ?, ?, ?)
            ");
            $consIns->execute([
                $apptId,
                'Mild benign sinus tachycardia; no structural coronary anomaly detected on resting ECG.',
                'Metoprolol Succinate 25mg once daily morning for 30 days. Maintain hydration.',
                'Patient advised to monitor resting pulse rate and reduce caffeine intake. Follow-up in 6 weeks if symptoms persist.'
            ]);

            // Feedback only if has_review is true
            if (!empty($item['has_review'])) {
                $tagsJson = json_encode(['Good listener', 'Clear explanation']);
                $fbIns = $pdo->prepare("
                    INSERT INTO feedback (appointment_id, patient_id, doctor_id, rating, comment, tags)
                    VALUES (?, ?, ?, 5, 'Dr. Sarah was exceptionally thorough and explained my ECG results with great clarity. Highly recommended!', ?)
                ");
                $fbIns->execute([$apptId, $patientId, $approvedDocId, $tagsJson]);
            }
        }
    }
    echo "Sample appointments and feedback seeded successfully.\n";
}

echo "Database seeding finished successfully!\n";

