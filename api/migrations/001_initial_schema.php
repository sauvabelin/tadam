<?php

return [
    'up' => function () {
        // Bubbles table
        \DB::query("
            CREATE TABLE IF NOT EXISTS bubbles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                bubble_id VARCHAR(50) UNIQUE NOT NULL,
                content TEXT,
                category ENUM('journal', 'lettres', 'pages') NOT NULL DEFAULT 'pages',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_category (category),
                INDEX idx_bubble_id (bubble_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        // Images table
        \DB::query("
            CREATE TABLE IF NOT EXISTS images (
                id INT AUTO_INCREMENT PRIMARY KEY,
                filename VARCHAR(255) NOT NULL UNIQUE,
                original_name VARCHAR(255) NOT NULL,
                mime_type VARCHAR(100) NOT NULL,
                size INT NOT NULL,
                uploaded_by_bubble VARCHAR(50) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_filename (filename),
                INDEX idx_bubble (uploaded_by_bubble)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        // Sessions table
        \DB::query("
            CREATE TABLE IF NOT EXISTS sessions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                token VARCHAR(64) NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                INDEX idx_token (token),
                INDEX idx_expires (expires_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        // Rate limits table
        \DB::query("
            CREATE TABLE IF NOT EXISTS rate_limits (
                id INT AUTO_INCREMENT PRIMARY KEY,
                identifier VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_identifier (identifier),
                INDEX idx_created (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    },

    'down' => function () {
        \DB::query("DROP TABLE IF EXISTS rate_limits");
        \DB::query("DROP TABLE IF EXISTS sessions");
        \DB::query("DROP TABLE IF EXISTS images");
        \DB::query("DROP TABLE IF EXISTS bubbles");
    }
];
