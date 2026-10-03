<?php

require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;
use App\Services\UploadService;

Database::loadEnv();
$pdo = Database::getConnection();
$uploadService = new UploadService();

echo "Starting thumbnail regeneration for doctor profiles...\n";

$stmt = $pdo->query("SELECT user_id, image_path, thumbnail_path FROM doctor_profiles WHERE image_path IS NOT NULL");
$doctors = $stmt->fetchAll(PDO::FETCH_ASSOC);

$updatedCount = 0;
$skippedCount = 0;

foreach ($doctors as $doc) {
    $userId = $doc['user_id'];
    $imagePath = $doc['image_path'];

    if (empty($imagePath) || str_contains($imagePath, 'uploads/defaults/')) {
        $skippedCount++;
        continue;
    }

    try {
        $newThumb = $uploadService->regenerateThumbnailForImage($imagePath);
        if ($newThumb) {
            $upStmt = $pdo->prepare("UPDATE doctor_profiles SET thumbnail_path = ? WHERE user_id = ?");
            $upStmt->execute([$newThumb, $userId]);
            echo "Doctor ID {$userId}: Regenerated thumbnail -> {$newThumb}\n";
            $updatedCount++;
        } else {
            echo "Doctor ID {$userId}: Skipped (source file not found or invalid)\n";
            $skippedCount++;
        }
    } catch (\Throwable $e) {
        echo "Doctor ID {$userId}: Failed to regenerate thumbnail - {$e->getMessage()}\n";
    }
}

echo "Thumbnail regeneration complete. Updated: {$updatedCount}, Skipped: {$skippedCount}\n";
