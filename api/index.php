<?php

declare(strict_types=1);

// Load Composer autoloader
require_once __DIR__ . '/vendor/autoload.php';

// Load configuration
$config = require __DIR__ . '/config/config.php';

// Initialize MeekroDB
\DB::$host = $config['db']['host'];
\DB::$port = $config['db']['port'] ?? 3306;
\DB::$user = $config['db']['user'];
\DB::$password = $config['db']['pass'];
\DB::$dbName = $config['db']['name'];
\DB::$encoding = 'utf8mb4';

use Tadam\AuthController;
use Tadam\BubbleController;
use Tadam\ImageController;
use Tadam\Migrator;
use Tadam\RateLimiter;

/**
 * Handle CORS headers
 */
function handleCors(array $allowedOrigins): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    if (in_array($origin, $allowedOrigins, true)) {
        header("Access-Control-Allow-Origin: {$origin}");
    }

    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Max-Age: 86400');

    // Handle preflight
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

/**
 * Send JSON response
 */
function jsonResponse(mixed $data, int $statusCode = 200): void
{
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Send error response
 */
function errorResponse(string $message, int $statusCode = 400): void
{
    jsonResponse(['error' => $message], $statusCode);
}

/**
 * Get bearer token from request
 */
function getBearerToken(): ?string
{
    // Try multiple sources for Authorization header (Apache can be tricky)
    $authHeader = '';

    if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    } elseif (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    } elseif (function_exists('getallheaders')) {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    }

    if (preg_match('/^Bearer\s+(.+)$/i', $authHeader, $matches)) {
        return $matches[1];
    }

    return null;
}

/**
 * Authenticate request using database sessions
 */
function authenticate(AuthController $authController): bool
{
    $token = getBearerToken();
    if ($token === null) {
        return false;
    }
    return $authController->verifyToken($token);
}

/**
 * Parse request path
 */
function getRequestPath(): string
{
    $uri = $_SERVER['REQUEST_URI'] ?? '/';
    $basePath = '/api';

    // Remove base path
    if (str_starts_with($uri, $basePath)) {
        $uri = substr($uri, strlen($basePath));
    }

    // Remove query string
    $path = parse_url($uri, PHP_URL_PATH) ?: '/';

    // Normalize
    return '/' . trim($path, '/');
}

/**
 * Get JSON request body
 */
function getJsonBody(): array
{
    $body = file_get_contents('php://input');
    if (empty($body)) {
        return [];
    }

    $data = json_decode($body, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        errorResponse('Invalid JSON body', 400);
    }

    return $data ?: [];
}

// ============================================
// MAIN REQUEST HANDLING
// ============================================

// Handle CORS
handleCors($config['allowed_origins']);

// Security headers
header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');

// Set content type
header('Content-Type: application/json; charset=utf-8');

// Get request info
$method = $_SERVER['REQUEST_METHOD'];
$path = getRequestPath();

// ============================================
// AUTO-RUN MIGRATIONS
// ============================================
try {
    $migrator = new Migrator(__DIR__ . '/migrations');
    $migrator->migrate();
} catch (\Exception $e) {
    // Log error but don't fail the request if DB isn't ready yet
    error_log('Migration error: ' . $e->getMessage());
}

// Initialize auth controller
$authController = new AuthController($config['session_expiry']);

// Route: POST /auth/login - Authenticate and get token
if ($method === 'POST' && $path === '/auth/login') {
    $clientIp = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    // Take first IP if X-Forwarded-For contains multiple
    $clientIp = trim(explode(',', $clientIp)[0]);

    $rateLimiter = new RateLimiter(5, 300); // 5 attempts per 5 minutes

    if (!$rateLimiter->isAllowed($clientIp)) {
        errorResponse('Too many login attempts. Try again in 5 minutes.', 429);
    }

    $data = getJsonBody();
    $password = $data['password'] ?? '';

    if (hash_equals($config['admin_password'], $password)) {
        $rateLimiter->clear($clientIp);
        $token = $authController->createSession();
        jsonResponse([
            'success' => true,
            'token' => $token
        ]);
    } else {
        $rateLimiter->record($clientIp);
        errorResponse('Invalid password', 401);
    }
}

// Route: GET /auth/verify - Verify token is valid
if ($method === 'GET' && $path === '/auth/verify') {
    $token = getBearerToken();
    if ($token && $authController->verifyToken($token)) {
        // Optionally extend session on verify
        $authController->extendSession($token);
        jsonResponse(['valid' => true]);
    } else {
        errorResponse('Invalid token', 401);
    }
}

// Route: POST /auth/logout - Invalidate token
if ($method === 'POST' && $path === '/auth/logout') {
    $token = getBearerToken();
    if ($token) {
        $authController->invalidateToken($token);
    }
    jsonResponse(['success' => true]);
}

// Route: GET /status - Database and migration status
if ($method === 'GET' && $path === '/status') {
    try {
        $migrations = \DB::query("SELECT migration, ran_at FROM migrations ORDER BY id");
        jsonResponse([
            'status' => 'ok',
            'database' => 'connected',
            'migrations' => $migrations
        ]);
    } catch (\Exception $e) {
        jsonResponse([
            'status' => 'error',
            'database' => 'not connected',
            'error' => $e->getMessage()
        ], 500);
    }
}

// Public endpoint check (GET requests don't require auth, except for listing images)
$requiresAuth = $method !== 'GET' || str_starts_with($path, '/images');

// Authenticate for non-GET requests
if ($requiresAuth && !authenticate($authController)) {
    errorResponse('Unauthorized', 401);
}

// Initialize controller
$controller = new BubbleController();

// Route: GET /bubbles - List all bubbles
if ($method === 'GET' && $path === '/bubbles') {
    $category = $_GET['category'] ?? null;
    $bubbles = $controller->list($category);
    jsonResponse($bubbles);
}

// Route: GET /bubbles/{id} - Get single bubble
if ($method === 'GET' && preg_match('#^/bubbles/([a-zA-Z]+)$#', $path, $matches)) {
    $bubbleId = $matches[1];

    if (!$controller->isValidBubbleId($bubbleId)) {
        errorResponse('Invalid bubble ID', 400);
    }

    $bubble = $controller->get($bubbleId);

    if ($bubble === null) {
        // Return empty bubble structure if not found yet
        jsonResponse([
            'id' => null,
            'bubble_id' => $bubbleId,
            'content' => null,
            'category' => null,
            'created_at' => null,
            'updated_at' => null,
            'tabs' => []
        ]);
    }

    jsonResponse($bubble);
}

// Route: POST /bubbles/{id} - Create/update bubble
if ($method === 'POST' && preg_match('#^/bubbles/([a-zA-Z]+)$#', $path, $matches)) {
    $bubbleId = $matches[1];

    if (!$controller->isValidBubbleId($bubbleId)) {
        errorResponse('Invalid bubble ID', 400);
    }

    $data = getJsonBody();

    if (!isset($data['content'])) {
        errorResponse('Missing content field', 400);
    }

    try {
        $bubble = $controller->save($bubbleId, $data);
        jsonResponse($bubble);
    } catch (\Exception $e) {
        errorResponse('Failed to save bubble: ' . $e->getMessage(), 500);
    }
}

// ============================================
// BUBBLE TAB ROUTES
// ============================================

// Route: POST /bubbles/{id}/tabs - Create a new tab
if ($method === 'POST' && preg_match('#^/bubbles/([a-zA-Z]+)/tabs$#', $path, $matches)) {
    $bubbleId = $matches[1];

    if (!$controller->isValidBubbleId($bubbleId)) {
        errorResponse('Invalid bubble ID', 400);
    }

    $data = getJsonBody();
    $tabName = $data['tab_name'] ?? '';

    if (empty($tabName)) {
        errorResponse('Missing tab_name field', 400);
    }

    try {
        $tab = $controller->createTab($bubbleId, $tabName, $data['content'] ?? null);
        jsonResponse($tab, 201);
    } catch (\Exception $e) {
        errorResponse('Failed to create tab: ' . $e->getMessage(), 500);
    }
}

// Route: POST /bubbles/{id}/tabs/reorder - Reorder tabs
if ($method === 'POST' && preg_match('#^/bubbles/([a-zA-Z]+)/tabs/reorder$#', $path, $matches)) {
    $bubbleId = $matches[1];

    if (!$controller->isValidBubbleId($bubbleId)) {
        errorResponse('Invalid bubble ID', 400);
    }

    $data = getJsonBody();
    $tabIds = $data['tab_ids'] ?? [];

    if (empty($tabIds) || !is_array($tabIds)) {
        errorResponse('Missing or invalid tab_ids array', 400);
    }

    try {
        $tabs = $controller->reorderTabs($bubbleId, $tabIds);
        jsonResponse($tabs);
    } catch (\Exception $e) {
        errorResponse('Failed to reorder tabs: ' . $e->getMessage(), 500);
    }
}

// Route: POST /bubbles/{id}/tabs/{tabId} - Update a tab
if ($method === 'POST' && preg_match('#^/bubbles/([a-zA-Z]+)/tabs/(\d+)$#', $path, $matches)) {
    $bubbleId = $matches[1];
    $tabId = (int)$matches[2];

    if (!$controller->isValidBubbleId($bubbleId)) {
        errorResponse('Invalid bubble ID', 400);
    }

    $data = getJsonBody();

    try {
        $tab = $controller->updateTab($tabId, $bubbleId, $data);

        if ($tab === null) {
            errorResponse('Tab not found', 404);
        }

        jsonResponse($tab);
    } catch (\Exception $e) {
        errorResponse('Failed to update tab: ' . $e->getMessage(), 500);
    }
}

// Route: DELETE /bubbles/{id}/tabs/{tabId} - Delete a tab
if ($method === 'DELETE' && preg_match('#^/bubbles/([a-zA-Z]+)/tabs/(\d+)$#', $path, $matches)) {
    $bubbleId = $matches[1];
    $tabId = (int)$matches[2];

    if (!$controller->isValidBubbleId($bubbleId)) {
        errorResponse('Invalid bubble ID', 400);
    }

    try {
        if ($controller->deleteTab($tabId, $bubbleId)) {
            jsonResponse(['success' => true]);
        } else {
            errorResponse('Tab not found', 404);
        }
    } catch (\Exception $e) {
        errorResponse('Failed to delete tab: ' . $e->getMessage(), 500);
    }
}

// ============================================
// IMAGE ROUTES
// ============================================

$imageController = new ImageController();

// Route: POST /images - Upload image
if ($method === 'POST' && $path === '/images') {
    if (!isset($_FILES['file'])) {
        errorResponse('No file provided', 400);
    }

    $bubbleId = $_POST['bubble_id'] ?? null;

    try {
        $image = $imageController->upload($_FILES['file'], $bubbleId);
        jsonResponse($image, 201);
    } catch (\InvalidArgumentException $e) {
        errorResponse($e->getMessage(), 400);
    } catch (\Exception $e) {
        errorResponse('Failed to upload image: ' . $e->getMessage(), 500);
    }
}

// Route: GET /images - List all images
if ($method === 'GET' && $path === '/images') {
    try {
        $images = $imageController->list();
        jsonResponse($images);
    } catch (\Exception $e) {
        error_log('Failed to list images: ' . $e->getMessage());
        errorResponse('Failed to list images: ' . $e->getMessage(), 500);
    }
}

// Route: GET /images/unused - List unused images
if ($method === 'GET' && $path === '/images/unused') {
    try {
        $images = $imageController->getUnusedImages();
        jsonResponse($images);
    } catch (\Exception $e) {
        error_log('Failed to get unused images: ' . $e->getMessage());
        errorResponse('Failed to get unused images: ' . $e->getMessage(), 500);
    }
}

// Route: DELETE /images/unused - Delete all unused images
if ($method === 'DELETE' && $path === '/images/unused') {
    try {
        $count = $imageController->deleteUnusedImages();
        jsonResponse(['deleted' => $count]);
    } catch (\Exception $e) {
        error_log('Failed to delete unused images: ' . $e->getMessage());
        errorResponse('Failed to delete unused images: ' . $e->getMessage(), 500);
    }
}

// Route: DELETE /images/{id} - Delete single image
if ($method === 'DELETE' && preg_match('#^/images/(\d+)$#', $path, $matches)) {
    $imageId = (int)$matches[1];

    try {
        if ($imageController->delete($imageId)) {
            jsonResponse(['success' => true]);
        } else {
            errorResponse('Image not found', 404);
        }
    } catch (\Exception $e) {
        error_log('Failed to delete image: ' . $e->getMessage());
        errorResponse('Failed to delete image: ' . $e->getMessage(), 500);
    }
}

// Route not found
errorResponse('Not found', 404);
