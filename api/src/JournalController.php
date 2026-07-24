<?php

namespace Tadam;

use DB;

class JournalController
{
    private const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private const ALLOWED_TYPES = ['application/pdf'];
    private const UPLOAD_DIR = __DIR__ . '/../../uploads/journaux/';

    /**
     * Upload a journal PDF. Returns the formatted record.
     */
    public function upload(array $file, string $title): array
    {
        if (!isset($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
            throw new \InvalidArgumentException('No file uploaded');
        }
        if ($file['error'] !== UPLOAD_ERR_OK) {
            throw new \InvalidArgumentException($this->getUploadErrorMessage($file['error']));
        }
        if ($file['size'] > self::MAX_FILE_SIZE) {
            throw new \InvalidArgumentException('File too large. Maximum size is 10MB.');
        }

        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($file['tmp_name']);
        if (!in_array($mimeType, self::ALLOWED_TYPES, true)) {
            throw new \InvalidArgumentException('Invalid file type. Only PDF is allowed.');
        }

        $filename = $this->generateUniqueFilename('pdf');

        if (!is_dir(self::UPLOAD_DIR)) {
            mkdir(self::UPLOAD_DIR, 0755, true);
        }

        $targetPath = self::UPLOAD_DIR . $filename;
        $success = @move_uploaded_file($file['tmp_name'], $targetPath);
        if (!$success) {
            if (!is_writable(self::UPLOAD_DIR)) {
                throw new \RuntimeException('Upload directory is not writable');
            }
            throw new \RuntimeException('Failed to save uploaded file');
        }

        $cleanTitle = trim($title) !== '' ? trim($title) : $file['name'];

        DB::insert('journaux', [
            'filename' => $filename,
            'original_name' => $file['name'],
            'title' => $cleanTitle,
            'size' => $file['size'],
        ]);

        return $this->formatRecord([
            'id' => DB::insertId(),
            'filename' => $filename,
            'title' => $cleanTitle,
            'created_at' => date('Y-m-d H:i:s'),
        ]);
    }

    /**
     * List all journaux, newest first.
     */
    public function list(): array
    {
        $rows = DB::query("SELECT * FROM journaux ORDER BY created_at DESC, id DESC");
        return array_map([$this, 'formatRecord'], $rows);
    }

    /**
     * Rename a journal. Returns the updated record or null if not found.
     */
    public function updateTitle(int $id, string $title): ?array
    {
        $row = DB::queryFirstRow("SELECT * FROM journaux WHERE id = %i", $id);
        if (!$row) {
            return null;
        }
        $clean = trim($title);
        if ($clean === '') {
            throw new \InvalidArgumentException('Title cannot be empty');
        }
        DB::update('journaux', ['title' => $clean], 'id = %i', $id);
        $row['title'] = $clean;
        return $this->formatRecord($row);
    }

    /**
     * Delete a journal (DB row + file on disk).
     */
    public function delete(int $id): bool
    {
        $row = DB::queryFirstRow("SELECT * FROM journaux WHERE id = %i", $id);
        if (!$row) {
            return false;
        }
        $filePath = self::UPLOAD_DIR . $row['filename'];
        if (file_exists($filePath)) {
            unlink($filePath);
        }
        DB::delete('journaux', "id = %i", $id);
        return true;
    }

    private function formatRecord(array $row): array
    {
        return [
            'id' => (int)$row['id'],
            'title' => $row['title'],
            'url' => '/uploads/journaux/' . $row['filename'],
            'created_at' => $row['created_at'],
        ];
    }

    private function generateUniqueFilename(string $extension): string
    {
        do {
            $filename = bin2hex(random_bytes(16)) . '.' . $extension;
        } while (file_exists(self::UPLOAD_DIR . $filename));
        return $filename;
    }

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
