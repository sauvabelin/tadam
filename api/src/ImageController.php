<?php

namespace Tadam;

use DB;

class ImageController
{
    private const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    private const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    private const UPLOAD_DIR = __DIR__ . '/../../uploads/images/';

    /**
     * Upload an image file
     */
    public function upload(array $file, ?string $bubbleId = null): array
    {
        // Validate file upload
        if (!isset($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
            throw new \InvalidArgumentException('No file uploaded');
        }

        if ($file['error'] !== UPLOAD_ERR_OK) {
            throw new \InvalidArgumentException($this->getUploadErrorMessage($file['error']));
        }

        // Validate file size
        if ($file['size'] > self::MAX_FILE_SIZE) {
            throw new \InvalidArgumentException('File too large. Maximum size is 5MB.');
        }

        // Validate MIME type
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($file['tmp_name']);

        if (!in_array($mimeType, self::ALLOWED_TYPES, true)) {
            throw new \InvalidArgumentException('Invalid file type. Allowed: JPG, PNG, GIF, WebP.');
        }

        // Generate unique filename
        $extension = $this->getExtensionFromMime($mimeType);
        $filename = $this->generateUniqueFilename($extension);

        // Ensure upload directory exists
        if (!is_dir(self::UPLOAD_DIR)) {
            mkdir(self::UPLOAD_DIR, 0755, true);
        }

        $targetPath = self::UPLOAD_DIR . $filename;

        // Move uploaded file (suppress warnings, throw exception on failure)
        $success = @move_uploaded_file($file['tmp_name'], $targetPath);
        if (!$success) {
            // Check for common issues
            if (!is_writable(self::UPLOAD_DIR)) {
                throw new \RuntimeException('Upload directory is not writable');
            }
            throw new \RuntimeException('Failed to save uploaded file');
        }

        // Store in database
        DB::insert('images', [
            'filename' => $filename,
            'original_name' => $file['name'],
            'mime_type' => $mimeType,
            'size' => $file['size'],
            'uploaded_by_bubble' => $bubbleId,
        ]);

        $id = DB::insertId();

        return $this->formatImageRecord([
            'id' => $id,
            'filename' => $filename,
            'original_name' => $file['name'],
            'mime_type' => $mimeType,
            'size' => $file['size'],
            'uploaded_by_bubble' => $bubbleId,
            'created_at' => date('Y-m-d H:i:s'),
        ]);
    }

    /**
     * Delete an image by ID
     */
    public function delete(int $id): bool
    {
        $image = DB::queryFirstRow("SELECT * FROM images WHERE id = %i", $id);

        if (!$image) {
            return false;
        }

        // Delete file from disk
        $filePath = self::UPLOAD_DIR . $image['filename'];
        if (file_exists($filePath)) {
            unlink($filePath);
        }

        // Delete from database
        DB::delete('images', "id = %i", $id);

        return true;
    }

    /**
     * List all images
     */
    public function list(): array
    {
        $images = DB::query(
            "SELECT * FROM images ORDER BY created_at DESC"
        );

        return array_map([$this, 'formatImageRecord'], $images);
    }

    /**
     * Get images not referenced in any bubble content
     */
    public function getUnusedImages(): array
    {
        $images = $this->list();
        $bubbles = DB::query("SELECT content FROM bubbles WHERE content IS NOT NULL AND content != ''");

        // Combine all bubble content for searching
        $allContent = implode(' ', array_column($bubbles, 'content'));

        // Filter to images not found in content
        $unused = array_filter($images, function ($image) use ($allContent) {
            return strpos($allContent, $image['filename']) === false;
        });

        return array_values($unused);
    }

    /**
     * Delete all unused images
     */
    public function deleteUnusedImages(): int
    {
        $unused = $this->getUnusedImages();
        $count = 0;

        foreach ($unused as $image) {
            if ($this->delete($image['id'])) {
                $count++;
            }
        }

        return $count;
    }

    /**
     * Format image record for API response
     */
    private function formatImageRecord(array $image): array
    {
        return [
            'id' => (int)$image['id'],
            'filename' => $image['filename'],
            'original_name' => $image['original_name'],
            'mime_type' => $image['mime_type'],
            'size' => (int)$image['size'],
            'uploaded_by_bubble' => $image['uploaded_by_bubble'],
            'url' => '/uploads/images/' . $image['filename'],
            'created_at' => $image['created_at'],
        ];
    }

    /**
     * Generate unique filename
     */
    private function generateUniqueFilename(string $extension): string
    {
        do {
            $filename = bin2hex(random_bytes(16)) . '.' . $extension;
        } while (file_exists(self::UPLOAD_DIR . $filename));

        return $filename;
    }

    /**
     * Get file extension from MIME type
     */
    private function getExtensionFromMime(string $mimeType): string
    {
        $map = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/gif' => 'gif',
            'image/webp' => 'webp',
        ];

        return $map[$mimeType] ?? 'bin';
    }

    /**
     * Get human-readable upload error message
     */
    private function getUploadErrorMessage(int $errorCode): string
    {
        $messages = [
            UPLOAD_ERR_INI_SIZE => 'File exceeds upload_max_filesize',
            UPLOAD_ERR_FORM_SIZE => 'File exceeds MAX_FILE_SIZE',
            UPLOAD_ERR_PARTIAL => 'File was only partially uploaded',
            UPLOAD_ERR_NO_FILE => 'No file was uploaded',
            UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder',
            UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
            UPLOAD_ERR_EXTENSION => 'File upload stopped by extension',
        ];

        return $messages[$errorCode] ?? 'Unknown upload error';
    }
}
