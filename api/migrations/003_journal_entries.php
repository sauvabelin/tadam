<?php

return [
    'up' => function () {
        \DB::query("
            CREATE TABLE IF NOT EXISTS journal_entries (
                id INT AUTO_INCREMENT PRIMARY KEY,
                entry_date DATE NOT NULL UNIQUE,
                title VARCHAR(255) NOT NULL DEFAULT '',
                content TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_entry_date (entry_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    },

    'down' => function () {
        \DB::query("DROP TABLE IF EXISTS journal_entries");
    }
];
