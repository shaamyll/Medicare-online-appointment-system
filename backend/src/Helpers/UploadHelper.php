<?php

namespace App\Helpers;

use App\Core\Response;

class UploadHelper {
    /**
     * Retrieve a file from $_FILES safely.
     */
    public static function getFile(string $key): ?array {
        if (!isset($_FILES[$key]) || !is_array($_FILES[$key])) {
            return null;
        }
        return $_FILES[$key];
    }

    /**
     * Check if a file was uploaded under the given key.
     */
    public static function hasFile(string $key): bool {
        return isset($_FILES[$key]) && is_array($_FILES[$key]) && ($_FILES[$key]['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE;
    }
}
