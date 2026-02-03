<?php

/**
 * Configuration loaded from environment variables.
 * Set these in .env file or Docker environment.
 */

// Load .env file if it exists (for traditional PHP hosting)
$envPaths = [
    __DIR__ . '/../../.env',  // Root of deployment
    __DIR__ . '/../.env',     // api/.env
];

foreach ($envPaths as $envPath) {
    if (file_exists($envPath)) {
        $dotenv = Dotenv\Dotenv::createImmutable(dirname($envPath));
        $dotenv->safeLoad();
        break;
    }
}

// Helper to get env var from multiple sources
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
        'host' => env('MYSQL_HOST', 'localhost'),
        'port' => (int) env('MYSQL_PORT', '3306'),
        'name' => env('MYSQL_DATABASE', 'tadam'),
        'user' => env('MYSQL_USER', 'tadam'),
        'pass' => env('MYSQL_PASSWORD', ''),
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
