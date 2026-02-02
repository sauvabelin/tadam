<?php
/**
 * Tadam Festival - PHP Entry Point
 * Serves the built React app statically
 */

$distPath = __DIR__ . '/dist';
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Remove leading slash for file path
$filePath = ltrim($requestUri, '/');

// Check if requesting a static asset from dist
if ($filePath && file_exists($distPath . '/' . $filePath) && !is_dir($distPath . '/' . $filePath)) {
    // Determine content type
    $extension = pathinfo($filePath, PATHINFO_EXTENSION);
    $mimeTypes = [
        'html' => 'text/html',
        'css' => 'text/css',
        'js' => 'application/javascript',
        'svg' => 'image/svg+xml',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'gif' => 'image/gif',
        'woff' => 'font/woff',
        'woff2' => 'font/woff2',
    ];

    $contentType = $mimeTypes[$extension] ?? 'application/octet-stream';
    header('Content-Type: ' . $contentType);
    readfile($distPath . '/' . $filePath);
    exit;
}

// Serve index.html for all other routes (SPA fallback)
if (file_exists($distPath . '/index.html')) {
    include $distPath . '/index.html';
} else {
    http_response_code(404);
    echo 'Build not found. Run "npm run build" first.';
}
