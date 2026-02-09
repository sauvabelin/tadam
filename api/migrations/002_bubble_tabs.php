<?php

return [
    'up' => function () {
        \DB::query("
            CREATE TABLE IF NOT EXISTS bubble_tabs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                bubble_id VARCHAR(50) NOT NULL,
                tab_name VARCHAR(100) NOT NULL,
                content TEXT,
                sort_order INT NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_bubble_id (bubble_id),
                INDEX idx_sort_order (bubble_id, sort_order)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    },

    'down' => function () {
        \DB::query("DROP TABLE IF EXISTS bubble_tabs");
    }
];
