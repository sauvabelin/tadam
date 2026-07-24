<?php

return [
    'up' => function () {
        \DB::query("
            CREATE TABLE IF NOT EXISTS journaux (
                id            INT AUTO_INCREMENT PRIMARY KEY,
                filename      VARCHAR(255) NOT NULL,
                original_name VARCHAR(255) NOT NULL,
                title         VARCHAR(255) NOT NULL,
                size          INT NOT NULL,
                created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_created (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    },

    'down' => function () {
        \DB::query("DROP TABLE IF EXISTS journaux");
    }
];
