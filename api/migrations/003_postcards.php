<?php

return [
    'up' => function () {
        \DB::query("
            CREATE TABLE IF NOT EXISTS postcard_backgrounds (
                id INT AUTO_INCREMENT PRIMARY KEY,
                image_id INT NOT NULL,
                label VARCHAR(255) NULL,
                sort_order INT DEFAULT 0,
                active TINYINT(1) DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        \DB::query("
            CREATE TABLE IF NOT EXISTS postcards (
                id INT AUTO_INCREMENT PRIMARY KEY,
                background_id INT NOT NULL,
                message TEXT NOT NULL,
                role VARCHAR(50) NOT NULL,
                name VARCHAR(255) NOT NULL,
                troupe VARCHAR(255) NULL,
                patrouille VARCHAR(255) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_background (background_id),
                INDEX idx_created (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    },

    'down' => function () {
        \DB::query("DROP TABLE IF EXISTS postcards");
        \DB::query("DROP TABLE IF EXISTS postcard_backgrounds");
    }
];
