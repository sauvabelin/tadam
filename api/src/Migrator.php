<?php

namespace Tadam;

use DB;

class Migrator
{
    private string $migrationsPath;

    public function __construct(string $migrationsPath)
    {
        $this->migrationsPath = $migrationsPath;
    }

    /**
     * Run all pending migrations
     */
    public function migrate(): array
    {
        $this->ensureMigrationsTable();

        $ran = [];
        $migrations = $this->getPendingMigrations();

        foreach ($migrations as $migration) {
            $this->runMigration($migration);
            $ran[] = $migration;
        }

        return $ran;
    }

    /**
     * Create migrations tracking table if it doesn't exist
     */
    private function ensureMigrationsTable(): void
    {
        DB::query("
            CREATE TABLE IF NOT EXISTS migrations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                migration VARCHAR(255) NOT NULL UNIQUE,
                ran_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    }

    /**
     * Get list of migrations that haven't been run yet
     */
    private function getPendingMigrations(): array
    {
        // Get all migration files
        $files = glob($this->migrationsPath . '/*.php');
        $available = [];

        foreach ($files as $file) {
            $available[] = basename($file, '.php');
        }

        sort($available);

        // Get already run migrations
        $ran = DB::queryFirstColumn("SELECT migration FROM migrations");

        // Return pending ones
        return array_diff($available, $ran);
    }

    /**
     * Run a single migration
     */
    private function runMigration(string $migration): void
    {
        $file = $this->migrationsPath . '/' . $migration . '.php';

        if (!file_exists($file)) {
            throw new \RuntimeException("Migration file not found: {$file}");
        }

        // Load and execute the migration
        $migrationData = require $file;

        if (!isset($migrationData['up'])) {
            throw new \RuntimeException("Migration {$migration} missing 'up' function");
        }

        // Run the up migration
        $migrationData['up']();

        // Record that we ran it
        DB::insert('migrations', [
            'migration' => $migration
        ]);
    }

    /**
     * Check if database is set up (has migrations table)
     */
    public static function isDatabaseReady(): bool
    {
        try {
            $result = DB::queryFirstRow("SHOW TABLES LIKE 'migrations'");
            return $result !== null;
        } catch (\Exception $e) {
            return false;
        }
    }
}
