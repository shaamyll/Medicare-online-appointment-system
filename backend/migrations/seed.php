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

if (!$existingDoc) {
    $docPass = password_hash('Doctor123!', PASSWORD_BCRYPT);
    $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role, phone, status) VALUES (?, ?, ?, 'doctor', ?, 'active')");
    $stmt->execute(['Dr. Sarah Jenkins, MD', $docEmail, $docPass, '+1 555-019-2831']);
    $docId = (int)$pdo->lastInsertId();

    $cardioId = $deptMap['Cardiology'] ?? null;
    $stmt = $pdo->prepare("INSERT INTO doctor_profiles (user_id, department_id, specialization, qualification, experience_years, consultation_fee, bio, room_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $docId,
        $cardioId,
        'Interventional Cardiology',
        'MD, FACC, Harvard Medical School',
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
}

// Seed a Pending Doctor for Approval Request Testing
$pendingDocEmail = 'dr.michael@medicare.com';
$stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$pendingDocEmail]);
if (!$stmt->fetch()) {
    $pendingPass = password_hash('Doctor123!', PASSWORD_BCRYPT);
    $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role, phone, status) VALUES (?, ?, ?, 'doctor', ?, 'pending')");
    $stmt->execute(['Dr. Michael Chang, MD', $pendingDocEmail, $pendingPass, '+1 555-019-9942']);
    $pendingId = (int)$pdo->lastInsertId();

    $neuroId = $deptMap['Neurology'] ?? null;
    $stmt = $pdo->prepare("INSERT INTO doctor_profiles (user_id, department_id, specialization, qualification, experience_years, consultation_fee, bio, room_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $pendingId,
        $neuroId,
        'Pediatric Neurology',
        'MD, Johns Hopkins University',
        8,
        150.00,
        'Dr. Michael Chang specializes in pediatric neurology, epilepsy, and developmental neurological disorders.',
        'Suite 305'
    ]);
    echo "Seeded Pending Doctor Request: {$pendingDocEmail}\n";
}

// Seed a Demo Patient
$patientEmail = 'patient@medicare.com';
$stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$patientEmail]);
if (!$stmt->fetch()) {
    $patientPass = password_hash('Patient123!', PASSWORD_BCRYPT);
    $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role, phone, status) VALUES (?, ?, ?, 'patient', ?, 'active')");
    $stmt->execute(['Johnathan Doe', $patientEmail, $patientPass, '+1 555-012-3456']);
    echo "Seeded Demo Patient: {$patientEmail} / Patient123!\n";
}

echo "Database seeding finished successfully!\n";
