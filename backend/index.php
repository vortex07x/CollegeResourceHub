<?php
// Set error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Load Composer autoload FIRST
if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    require_once __DIR__ . '/vendor/autoload.php';
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Dependencies not installed. Please run: composer install'
    ]);
    exit();
}

// Load Response utility before loading .env
require_once __DIR__ . DIRECTORY_SEPARATOR . 'utils' . DIRECTORY_SEPARATOR . 'Response.php';

// Load environment variables with better error handling
try {
    // Check if .env file exists
    $envPath = __DIR__;
    $envFile = $envPath . DIRECTORY_SEPARATOR . '.env';
    
    if (!file_exists($envFile)) {
        throw new Exception('.env file not found at: ' . $envFile);
    }
    
    if (!is_readable($envFile)) {
        throw new Exception('.env file is not readable. Check file permissions.');
    }
    
    $dotenv = Dotenv\Dotenv::createImmutable($envPath);
    $dotenv->load();
    
    // Verify required environment variables
    $required = ['DB_HOST', 'DB_NAME', 'DB_USER', 'JWT_SECRET', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
    foreach ($required as $var) {
        if (!isset($_ENV[$var]) && !getenv($var)) {
            throw new Exception("Required environment variable missing: {$var}");
        }
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Environment configuration error',
        'error' => $e->getMessage(),
        'debug' => [
            'env_path' => __DIR__,
            'env_file_exists' => file_exists(__DIR__ . '/.env'),
            'env_file_readable' => is_readable(__DIR__ . '/.env')
        ]
    ]);
    exit();
}

// CORS Headers - NOW we can use environment variables
$allowedOrigin = $_ENV['FRONTEND_URL'] ?? getenv('FRONTEND_URL') ?? 'http://localhost:5173';

// Remove trailing slash if present
$allowedOrigin = rtrim($allowedOrigin, '/');

header('Access-Control-Allow-Origin: ' . $allowedOrigin);
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 3600');

// Handle preflight requests BEFORE setting Content-Type
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// NOW set Content-Type for actual requests
header('Content-Type: application/json');

// Load and execute routes
require_once __DIR__ . DIRECTORY_SEPARATOR . 'routes' . DIRECTORY_SEPARATOR . 'api.php';