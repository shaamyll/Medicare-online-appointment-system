<?php

namespace App\Middleware;

use App\Core\Request;
use App\Core\Response;
use App\Services\UploadService;

class UploadMiddleware {
    /**
     * Optional middleware to pre-validate that an uploaded file exists and is within limits.
     */
    public static function handle(Request $request, string $field = 'profilePhoto'): void {
        $file = $_FILES[$field] ?? $_FILES['photo'] ?? null;
        if (!$file || !isset($file['error']) || $file['error'] === UPLOAD_ERR_NO_FILE) {
            Response::error('Profile photo is required (JPG, PNG, or WebP up to 2MB).', 400);
            return;
        }

        if ($file['size'] > UploadService::MAX_FILE_SIZE) {
            Response::error('Uploaded image exceeds the maximum permitted size of 2 MB.', 400);
            return;
        }
    }
}
