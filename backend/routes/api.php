<?php

define('BASE_PATH', dirname(__DIR__));

require_once BASE_PATH . DIRECTORY_SEPARATOR . 'vendor' . DIRECTORY_SEPARATOR . 'autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(BASE_PATH);
$dotenv->load();

require_once BASE_PATH . DIRECTORY_SEPARATOR . 'utils' . DIRECTORY_SEPARATOR . 'Response.php';
require_once BASE_PATH . DIRECTORY_SEPARATOR . 'controllers' . DIRECTORY_SEPARATOR . 'AuthController.php';
require_once BASE_PATH . DIRECTORY_SEPARATOR . 'controllers' . DIRECTORY_SEPARATOR . 'FileController.php';
require_once BASE_PATH . DIRECTORY_SEPARATOR . 'controllers' . DIRECTORY_SEPARATOR . 'AdminController.php';
require_once BASE_PATH . DIRECTORY_SEPARATOR . 'middleware' . DIRECTORY_SEPARATOR . 'AuthMiddleware.php';
require_once BASE_PATH . DIRECTORY_SEPARATOR . 'middleware' . DIRECTORY_SEPARATOR . 'AdminMiddleware.php';

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = preg_replace('#^/backend#', '', $uri);

// DEBUG LOGGING - Check backend/debug.log file after testing
$logFile = BASE_PATH . DIRECTORY_SEPARATOR . 'debug.log';
$logMessage = date('Y-m-d H:i:s') . " | Method: {$method} | URI: {$uri} | Raw: {$_SERVER['REQUEST_URI']}\n";
file_put_contents($logFile, $logMessage, FILE_APPEND);

try {
    // Test endpoint
    if ($uri === '/api/test' && $method === 'GET') {
        Response::success(['message' => 'API is working!'], 'Success');
        exit();
    }

    // Test conversion routes endpoint
    if ($uri === '/api/files/test-conversion' && $method === 'GET') {
        Response::success(['message' => 'Conversion routes are accessible!'], 'Success');
        exit();
    }

    // Public Routes - Authentication
    if ($uri === '/api/auth/register' && $method === 'POST') {
        AuthController::register();
        exit();
    }

    if ($uri === '/api/auth/login' && $method === 'POST') {
        AuthController::login();
        exit();
    }

    if ($uri === '/api/auth/forgot-password' && $method === 'POST') {
        AuthController::forgotPassword();
        exit();
    }

    if ($uri === '/api/auth/verify-otp' && $method === 'POST') {
        AuthController::verifyOTP();
        exit();
    }

    if ($uri === '/api/auth/reset-password' && $method === 'POST') {
        AuthController::resetPassword();
        exit();
    }

    // Protected Auth Routes
    if ($uri === '/api/auth/profile' && $method === 'GET') {
        AuthMiddleware::authenticate();
        AuthController::getProfile();
        exit();
    }

    if ($uri === '/api/auth/profile' && $method === 'PUT') {
        AuthMiddleware::authenticate();
        AuthController::updateProfile();
        exit();
    }

    if ($uri === '/api/auth/logout' && $method === 'POST') {
        AuthMiddleware::authenticate();
        AuthController::logout();
        exit();
    }

    // Public File Routes - THESE DO NOT REQUIRE AUTHENTICATION
    if ($uri === '/api/files/top-downloaded' && $method === 'GET') {
        FileController::getTopDownloaded();
        exit();
    }

    // Make getAllFiles public - anyone can browse files
    if ($method === 'GET' && $uri === '/api/files') {
        FileController::getAllFiles();
        exit();
    }

    // Admin Routes - Must come before regular file routes to avoid conflicts
    if ($uri === '/api/admin/dashboard' && $method === 'GET') {
        AdminMiddleware::checkAdmin();
        AdminController::getDashboardStats();
        exit();
    }

    if ($uri === '/api/admin/users' && $method === 'GET') {
        AdminMiddleware::checkAdmin();
        AdminController::getAllUsers();
        exit();
    }

    if ($method === 'PUT' && preg_match('#^/api/admin/users/(\d+)$#', $uri, $matches)) {
        AdminMiddleware::checkAdmin();
        AdminController::updateUser($matches[1]);
        exit();
    }

    if ($method === 'DELETE' && preg_match('#^/api/admin/users/(\d+)$#', $uri, $matches)) {
        AdminMiddleware::checkAdmin();
        AdminController::deleteUser($matches[1]);
        exit();
    }

    if ($uri === '/api/admin/files' && $method === 'GET') {
        AdminMiddleware::checkAdmin();
        AdminController::getAllFilesAdmin();
        exit();
    }

    if ($method === 'PUT' && preg_match('#^/api/admin/files/(\d+)$#', $uri, $matches)) {
        AdminMiddleware::checkAdmin();
        AdminController::updateFileAdmin($matches[1]);
        exit();
    }

    if ($method === 'DELETE' && preg_match('#^/api/admin/files/(\d+)$#', $uri, $matches)) {
        AdminMiddleware::checkAdmin();
        AdminController::deleteFileAdmin($matches[1]);
        exit();
    }

    // Protected File Routes - Order matters! More specific routes FIRST

    // Exact match routes (highest priority) - REQUIRE AUTHENTICATION
    if ($method === 'GET' && $uri === '/api/files/my-files') {
        AuthMiddleware::authenticate();
        FileController::getMyFiles();
        exit();
    }

    if ($method === 'GET' && $uri === '/api/files/pinned') {
        AuthMiddleware::authenticate();
        FileController::getPinnedFiles();
        exit();
    }

    if ($method === 'POST' && $uri === '/api/files/upload') {
        AuthMiddleware::authenticate();
        FileController::uploadFile();
        exit();
    }

    // Conversion Routes - CRITICAL: Must come before other /api/files/{id} routes
    if ($method === 'GET' && $uri === '/api/files/download-converted') {
        file_put_contents($logFile, date('Y-m-d H:i:s') . " | HIT: download-converted route\n", FILE_APPEND);
        AuthMiddleware::authenticate();
        FileController::downloadConvertedFile();
        exit();
    }

    if ($method === 'POST' && preg_match('#^/api/files/(\d+)/convert$#', $uri, $matches)) {
        file_put_contents($logFile, date('Y-m-d H:i:s') . " | HIT: convert route for file ID: {$matches[1]}\n", FILE_APPEND);
        AuthMiddleware::authenticate();
        FileController::convertFile($matches[1]);
        exit();
    }

    if ($method === 'POST' && preg_match('#^/api/files/(\d+)/save-converted$#', $uri, $matches)) {
        file_put_contents($logFile, date('Y-m-d H:i:s') . " | HIT: save-converted route for file ID: {$matches[1]}\n", FILE_APPEND);
        AuthMiddleware::authenticate();
        FileController::saveConvertedFile($matches[1]);
        exit();
    }

    // Clean up temp file after conversion operations are complete
    if ($method === 'POST' && $uri === '/api/files/cleanup-temp') {
        file_put_contents($logFile, date('Y-m-d H:i:s') . " | HIT: cleanup-temp route\n", FILE_APPEND);
        AuthMiddleware::authenticate();
        FileController::cleanupTempFile();
        exit();
    }

    // Other /api/files/{id}/action routes - REQUIRE AUTHENTICATION
    if ($method === 'GET' && preg_match('#^/api/files/(\d+)/download$#', $uri, $matches)) {
        AuthMiddleware::authenticate();
        FileController::downloadFile($matches[1]);
        exit();
    }

    if ($method === 'GET' && preg_match('#^/api/files/(\d+)/info$#', $uri, $matches)) {
        AuthMiddleware::authenticate();
        FileController::getFileInfo($matches[1]);
        exit();
    }

    if ($method === 'PATCH' && preg_match('#^/api/files/(\d+)/position$#', $uri, $matches)) {
        AuthMiddleware::authenticate();
        FileController::updateFilePosition($matches[1]);
        exit();
    }

    if ($method === 'POST' && preg_match('#^/api/files/(\d+)/pin$#', $uri, $matches)) {
        AuthMiddleware::authenticate();
        FileController::pinFile($matches[1]);
        exit();
    }

    if ($method === 'POST' && preg_match('#^/api/files/(\d+)/unpin$#', $uri, $matches)) {
        AuthMiddleware::authenticate();
        FileController::unpinFile($matches[1]);
        exit();
    }

    if ($method === 'GET' && preg_match('#^/api/files/(\d+)/pin-status$#', $uri, $matches)) {
        AuthMiddleware::authenticate();
        FileController::checkPinStatus($matches[1]);
        exit();
    }

    // General /api/files/{id} routes (lowest priority - must be LAST) - REQUIRE AUTHENTICATION
    if ($method === 'PUT' && preg_match('#^/api/files/(\d+)$#', $uri, $matches)) {
        AuthMiddleware::authenticate();
        FileController::updateFile($matches[1]);
        exit();
    }

    if ($method === 'DELETE' && preg_match('#^/api/files/(\d+)$#', $uri, $matches)) {
        AuthMiddleware::authenticate();
        FileController::deleteFile($matches[1]);
        exit();
    }

    // Log 404s for debugging
    file_put_contents($logFile, date('Y-m-d H:i:s') . " | 404: No route matched\n", FILE_APPEND);
    Response::error('Route not found', 404);
} catch (Exception $e) {
    file_put_contents($logFile, date('Y-m-d H:i:s') . " | ERROR: {$e->getMessage()}\n", FILE_APPEND);
    Response::error($e->getMessage(), 500);
}