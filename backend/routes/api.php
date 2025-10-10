<?php

define('BASE_PATH', dirname(__DIR__));

require_once BASE_PATH . '/vendor/autoload.php';

// Only load .env if not in production
$isProduction = strpos($_SERVER['HTTP_HOST'] ?? '', 'render.com') !== false;
if (!$isProduction && file_exists(BASE_PATH . '/.env')) {
    $dotenv = Dotenv\Dotenv::createImmutable(BASE_PATH);
    $dotenv->load();
}

require_once BASE_PATH . '/utils/Response.php';
require_once BASE_PATH . '/controllers/AuthController.php';
require_once BASE_PATH . '/controllers/FileController.php';
require_once BASE_PATH . '/controllers/AdminController.php';
require_once BASE_PATH . '/middleware/AuthMiddleware.php';
require_once BASE_PATH . '/middleware/AdminMiddleware.php';

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = preg_replace('#^/backend#', '', $uri);

// Debug logging (only in development)
if (!$isProduction) {
    $logFile = BASE_PATH . '/debug.log';
    $logMessage = date('Y-m-d H:i:s') . " | Method: {$method} | URI: {$uri} | Raw: {$_SERVER['REQUEST_URI']}\n";
    @file_put_contents($logFile, $logMessage, FILE_APPEND);
}

try {
    // Test endpoint
    if ($uri === '/api/test' && $method === 'GET') {
        Response::success([
            'message' => 'API is working!',
            'environment' => $isProduction ? 'production' : 'development',
            'php_version' => PHP_VERSION
        ], 'Success');
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

    // Public File Routes
    if ($uri === '/api/files/top-downloaded' && $method === 'GET') {
        FileController::getTopDownloaded();
        exit();
    }

    if ($method === 'GET' && $uri === '/api/files') {
        FileController::getAllFiles();
        exit();
    }

    // Admin Routes
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

    if ($method === 'PATCH' && preg_match('#^/api/admin/users/(\d+)/role$#', $uri, $matches)) {
        AdminMiddleware::checkAdmin();
        AdminController::updateUserRole($matches[1]);
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

    // Protected File Routes - Exact matches first
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

    // Conversion Routes
    if ($method === 'GET' && $uri === '/api/files/download-converted') {
        AuthMiddleware::authenticate();
        FileController::downloadConvertedFile();
        exit();
    }

    if ($method === 'POST' && preg_match('#^/api/files/(\d+)/convert$#', $uri, $matches)) {
        AuthMiddleware::authenticate();
        FileController::convertFile($matches[1]);
        exit();
    }

    if ($method === 'POST' && preg_match('#^/api/files/(\d+)/save-converted$#', $uri, $matches)) {
        AuthMiddleware::authenticate();
        FileController::saveConvertedFile($matches[1]);
        exit();
    }

    if ($method === 'POST' && $uri === '/api/files/cleanup-temp') {
        AuthMiddleware::authenticate();
        FileController::cleanupTempFile();
        exit();
    }

    // Other file routes with ID
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

    // General file routes (lowest priority)
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

    // 404 - Route not found
    Response::error('Route not found', 404);
} catch (Exception $e) {
    // Log error in development
    if (!$isProduction) {
        $logFile = BASE_PATH . '/debug.log';
        @file_put_contents($logFile, date('Y-m-d H:i:s') . " | ERROR: {$e->getMessage()}\n", FILE_APPEND);
    }

    Response::error(
        $isProduction ? 'An error occurred' : $e->getMessage(),
        500
    );
}
