<?php

namespace App\Services;

use Exception;

class UploadService {
    public const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
    public const ALLOWED_MIME_TYPES = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];

    private string $uploadBaseDir;

    public function __construct() {
        $this->uploadBaseDir = dirname(__DIR__, 2) . '/public/uploads';
    }

    /**
     * Validate and process doctor profile photo upload.
     * Generates a 300x300 cropped thumbnail.
     *
     * @param array $file Single $_FILES item (e.g. $_FILES['photo'])
     * @return array ['image_path' => string, 'thumbnail_path' => string, 'full_image_path' => string, 'full_thumbnail_path' => string]
     * @throws Exception with user-friendly error message on validation failure
     */
    public function uploadDoctorPhoto(array $file): array {
        if (!isset($file['error']) || is_array($file['error'])) {
            throw new Exception('Invalid upload parameters.', 400);
        }

        switch ($file['error']) {
            case UPLOAD_ERR_OK:
                break;
            case UPLOAD_ERR_NO_FILE:
                throw new Exception('Profile photo is required (JPG, PNG, or WebP up to 2MB).', 400);
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                throw new Exception('Uploaded image exceeds the maximum permitted size of 2 MB.', 400);
            default:
                throw new Exception('An error occurred during file upload. Please try again.', 400);
        }

        if ($file['size'] > self::MAX_FILE_SIZE) {
            throw new Exception('Uploaded image exceeds the maximum permitted size of 2 MB.', 400);
        }

        if (empty($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
            throw new Exception('Uploaded file could not be verified.', 400);
        }

        // Validate real MIME type with finfo
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($file['tmp_name']);

        if (!array_key_exists($mime, self::ALLOWED_MIME_TYPES)) {
            throw new Exception('Invalid file format. Only JPG, JPEG, PNG, and WebP images are allowed.', 400);
        }

        $extension = self::ALLOWED_MIME_TYPES[$mime];

        // Generate safe random filename
        $randomName = bin2hex(random_bytes(16)) . '.' . $extension;

        $doctorDir = $this->uploadBaseDir . '/doctors';
        $thumbDir = $doctorDir . '/thumbs';

        if (!is_dir($doctorDir)) {
            @mkdir($doctorDir, 0777, true);
        }
        if (!is_dir($thumbDir)) {
            @mkdir($thumbDir, 0777, true);
        }

        $targetImagePath = $doctorDir . '/' . $randomName;
        $targetThumbPath = $thumbDir . '/' . $randomName;

        if (!move_uploaded_file($file['tmp_name'], $targetImagePath)) {
            throw new Exception('Failed to save uploaded image.', 500);
        }

        // Generate 480x480 cropped thumbnail using GD
        try {
            $this->createCroppedThumbnail($targetImagePath, $targetThumbPath, $mime, 480, 480);
        } catch (\Throwable $e) {
            // Cleanup main image if thumbnail creation fails
            @unlink($targetImagePath);
            throw new Exception('Failed to process image thumbnail: ' . $e->getMessage(), 500);
        }

        return [
            'image_path' => 'uploads/doctors/' . $randomName,
            'thumbnail_path' => 'uploads/doctors/thumbs/' . $randomName,
            'full_image_path' => $targetImagePath,
            'full_thumbnail_path' => $targetThumbPath
        ];
    }

    /**
     * Regenerate 480x480 thumbnail from an existing image path.
     *
     * @param string $imageRelativePath Relative path e.g. uploads/doctors/xyz.jpg
     * @return string|null New thumbnail relative path or null on failure
     */
    public function regenerateThumbnailForImage(string $imageRelativePath): ?string {
        if (str_contains($imageRelativePath, 'uploads/defaults/')) {
            return null; // Skip default avatar
        }

        $publicDir = dirname(__DIR__, 2) . '/public';
        $fullSource = $publicDir . '/' . ltrim($imageRelativePath, '/');
        if (!is_file($fullSource)) {
            return null;
        }

        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($fullSource);
        if (!array_key_exists($mime, self::ALLOWED_MIME_TYPES)) {
            return null;
        }

        $thumbDir = $this->uploadBaseDir . '/doctors/thumbs';
        if (!is_dir($thumbDir)) {
            @mkdir($thumbDir, 0777, true);
        }

        $filename = basename($fullSource);
        $targetThumbPath = $thumbDir . '/' . $filename;

        $this->createCroppedThumbnail($fullSource, $targetThumbPath, $mime, 480, 480);

        return 'uploads/doctors/thumbs/' . $filename;
    }

    /**
     * Create a centered square crop and resize to target dimension.
     */
    public function createCroppedThumbnail(string $sourcePath, string $destPath, string $mime, int $targetWidth = 480, int $targetHeight = 480): void {
        if (!extension_loaded('gd')) {
            throw new Exception('PHP GD extension is not enabled.');
        }

        $sourceImage = match ($mime) {
            'image/jpeg' => @imagecreatefromjpeg($sourcePath),
            'image/png' => @imagecreatefrompng($sourcePath),
            'image/webp' => @imagecreatefromwebp($sourcePath),
            default => null,
        };

        if (!$sourceImage) {
            throw new Exception('Unable to open image for thumbnail creation.');
        }

        $srcWidth = imagesx($sourceImage);
        $srcHeight = imagesy($sourceImage);

        // Calculate center square crop
        $minDim = min($srcWidth, $srcHeight);
        $srcX = (int)(($srcWidth - $minDim) / 2);
        $srcY = (int)(($srcHeight - $minDim) / 2);

        $thumb = imagecreatetruecolor($targetWidth, $targetHeight);

        // Preserve transparency for PNG and WebP
        if ($mime === 'image/png' || $mime === 'image/webp') {
            imagealphablending($thumb, false);
            imagesavealpha($thumb, true);
            $transparent = imagecolorallocatealpha($thumb, 255, 255, 255, 127);
            imagefilledrectangle($thumb, 0, 0, $targetWidth, $targetHeight, $transparent);
        }

        imagecopyresampled(
            $thumb,
            $sourceImage,
            0, 0,
            $srcX, $srcY,
            $targetWidth, $targetHeight,
            $minDim, $minDim
        );

        $saved = match ($mime) {
            'image/jpeg' => imagejpeg($thumb, $destPath, 85),
            'image/png' => imagepng($thumb, $destPath, 6),
            'image/webp' => imagewebp($thumb, $destPath, 85),
            default => false
        };

        imagedestroy($sourceImage);
        imagedestroy($thumb);

        if (!$saved) {
            throw new Exception('Failed to write thumbnail image file.');
        }
    }

    /**
     * Clean up uploaded files (e.g. on transaction rollback or profile replacement).
     */
    public function deleteFiles(?string $imageRelativePath, ?string $thumbRelativePath): void {
        $publicDir = dirname(__DIR__, 2) . '/public';

        if ($imageRelativePath && !str_contains($imageRelativePath, 'uploads/defaults/')) {
            $path = $publicDir . '/' . ltrim($imageRelativePath, '/');
            if (is_file($path)) {
                @unlink($path);
            }
        }

        if ($thumbRelativePath && !str_contains($thumbRelativePath, 'uploads/defaults/')) {
            $path = $publicDir . '/' . ltrim($thumbRelativePath, '/');
            if (is_file($path)) {
                @unlink($path);
            }
        }
    }
}
