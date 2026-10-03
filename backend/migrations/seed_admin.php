<?php

require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;

Database::loadEnv();
$pdo = Database::getConnection();

$adminEmail = 'admin123@medicare.com';
$adminPass = '123456';
$adminName = 'System Administrator';

$hashedPassword = password_hash($adminPass, PASSWORD_BCRYPT);

$stmt = $pdo->prepare("SELECT id, email FROM users WHERE email = ?");
$stmt->execute([$adminEmail]);
$existing = $stmt->fetch();

if (!$existing) {
    $insertStmt = $pdo->prepare("
        INSERT INTO users (name, email, password, role, status)
        VALUES (?, ?, ?, 'admin', 'active')
    ");
    $insertStmt->execute([$adminName, $adminEmail, $hashedPassword]);
    echo "Successfully created admin account:\n";
    echo "  Email:    {$adminEmail}\n";
    echo "  Password: {$adminPass}\n";
    echo "  Role:     admin\n";
    echo "  Status:   active\n";
} else {
    $updateStmt = $pdo->prepare("
        UPDATE users 
        SET password = ?, role = 'admin', status = 'active'
        WHERE id = ?
    ");
    $updateStmt->execute([$hashedPassword, $existing['id']]);
    echo "Successfully updated existing admin account credentials:\n";
    echo "  Email:    {$adminEmail}\n";
    echo "  Password: {$adminPass}\n";
    echo "  Role:     admin\n";
    echo "  Status:   active\n";
}
