<?php
// Set error reporting based on environment
$isProduction = strpos($_SERVER['HTTP_HOST'] ?? '', 'render.com') !== false;

if ($isProduction) {
    error_reporting(E_ALL & ~E_DEPRECATED & ~E_STRICT);
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
} else {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
}

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

// Load Response utility
require_once __DIR__ . '/utils/Response.php';

// Helper function to get environment variable
function env($key, $default = null) {
    $value = getenv($key);
    if ($value === false) {
        $value = $_ENV[$key] ?? $_SERVER[$key] ?? $default;
    }
    return $value;
}

// Load environment variables
try {
    // For production (Render), environment variables are already set
    // For local development, load from .env file
    if (!$isProduction && file_exists(__DIR__ . '/.env')) {
        $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
        $dotenv->load();
    }
    
    // Verify required environment variables
    $required = [
        'DB_HOST', 
        'DB_NAME', 
        'DB_USER', 
        'DB_PASSWORD',
        'JWT_SECRET', 
        'CLOUDINARY_CLOUD_NAME', 
        'CLOUDINARY_API_KEY', 
        'CLOUDINARY_API_SECRET'
    ];
    $missing = [];
    
    foreach ($required as $var) {
        if (env($var) === null) {
            $missing[] = $var;
        }
    }
    
    if (!empty($missing)) {
        throw new Exception("Required environment variables missing: " . implode(', ', $missing));
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Environment configuration error',
        'error' => $isProduction ? 'Configuration error' : $e->getMessage(),
        'debug' => !$isProduction ? [
            'missing' => $missing ?? [],
            'host' => $_SERVER['HTTP_HOST'] ?? 'unknown'
        ] : null
    ]);
    exit();
}

// CORS Headers - Enhanced for production
$allowedOrigins = [
    'https://college-resource-hub-azure.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
];

// Add FRONTEND_URL from environment if set
$frontendUrl = env('FRONTEND_URL');
if ($frontendUrl && !in_array($frontendUrl, $allowedOrigins)) {
    array_unshift($allowedOrigins, rtrim($frontendUrl, '/'));
}

// Remove trailing slashes from all origins
$allowedOrigins = array_map(function($origin) {
    return rtrim($origin, '/');
}, $allowedOrigins);

// Get the request origin
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// Determine which origin to allow
$allowedOrigin = '';

if ($isProduction) {
    // In production, check if origin matches exactly or is a Vercel domain
    foreach ($allowedOrigins as $allowed) {
        if ($origin === $allowed || strpos($origin, '.vercel.app') !== false) {
            $allowedOrigin = $origin;
            break;
        }
    }
    // Fallback to first allowed origin if no match
    if (empty($allowedOrigin)) {
        $allowedOrigin = $allowedOrigins[0];
    }
} else {
    // In development, allow localhost
    if (strpos($origin, 'localhost') !== false || strpos($origin, '127.0.0.1') !== false) {
        $allowedOrigin = $origin;
    } elseif (in_array($origin, $allowedOrigins)) {
        $allowedOrigin = $origin;
    } else {
        $allowedOrigin = $allowedOrigins[0];
    }
}

// Set CORS headers - ALWAYS set them
header('Access-Control-Allow-Origin: ' . $allowedOrigin);
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 3600');

// Handle preflight requests - MUST respond with 200 and stop
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    header('Content-Length: 0');
    header('Content-Type: text/plain');
    exit();
}

// Set Content-Type for actual requests
header('Content-Type: application/json; charset=utf-8');

// Set security headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// Load and execute routes
require_once __DIR__ . '/routes/api.php';