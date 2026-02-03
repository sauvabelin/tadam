<?php

/**
 * Configuration loaded from environment variables.
 * Set these in .env file or Docker environment.
 */

// Helper to get env var from multiple sources (Apache doesn't pass env to PHP by default)
function env(string $key, string $default = ''): string
{
    return $_ENV[$key] ?? $_SERVER[$key] ?? getenv($key) ?: $default;
}

/**
 * Parse a database URL into connection components
 * Format: mysql://user:password@host:port/database
 */
function parseDatabaseUrl(string $url): ?array
{
    if (empty($url)) {
        return null;
    }

    $parsed = parse_url($url);
    if ($parsed === false) {
        return null;
    }

    return [
        'host' => $parsed['host'] ?? 'localhost',
        'port' => $parsed['port'] ?? 3306,
        'name' => ltrim($parsed['path'] ?? '/tadam', '/'),
        'user' => $parsed['user'] ?? 'root',
        'pass' => $parsed['pass'] ?? '',
    ];
}

// Try to parse database URL first, fall back to individual env vars
$databaseUrl = env('MYSQL_DATABASE_URL');
$dbConfig = parseDatabaseUrl($databaseUrl);

if ($dbConfig === null) {
    // Fall back to individual environment variables
    $dbConfig = [
        'host' => env('DB_HOST', 'db'),
        'port' => (int) env('DB_PORT', '3306'),
        'name' => env('DB_NAME', 'tadam'),
        'user' => env('DB_USER', 'tadam'),
        'pass' => env('DB_PASS', 'tadampassword'),
    ];
}

return [
    'db' => $dbConfig,
    // Admin password for login
    'admin_password' => env('ADMIN_PASSWORD', 'acriter1912'),
    // Session expiry in seconds (24 hours)
    'session_expiry' => (int) env('SESSION_EXPIRY', '86400'),
    'allowed_origins' => array_filter(
        array_map('trim', explode(',', env('ALLOWED_ORIGINS', 'http://localhost:5173,http://localhost:8080')))
    ),
];
