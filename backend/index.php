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

// Set Content-Type for actual requests
header('Content-Type: application/json; charset=utf-8');

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

// Helper function to get environment variable with fallbacks
function env($key, $default = null) {
    // Try $_ENV first
    if (isset($_ENV[$key]) && $_ENV[$key] !== '') {
        return $_ENV[$key];
    }
    
    // Try getenv()
    $value = getenv($key);
    if ($value !== false && $value !== '') {
        return $value;
    }
    
    // Try $_SERVER
    if (isset($_SERVER[$key]) && $_SERVER[$key] !== '') {
        return $_SERVER[$key];
    }
    
    return $default;
}

// Load environment variables
try {
    // For production (Render), environment variables are set via dashboard
    // For local development, load from .env file
    if (!$isProduction) {
        if (file_exists(__DIR__ . '/.env')) {
            $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
            $dotenv->load();
        }
    } else {
        // In production on Render, manually populate $_ENV from getenv()
        // This ensures consistency across different PHP configurations
        $envVars = [
            'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASS', 'DB_PASSWORD',
            'JWT_SECRET', 'JWT_EXPIRY',
            'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET', 'CLOUDINARY_UPLOAD_PRESET',
            'BREVO_API_KEY', 'BREVO_SENDER_EMAIL', 'BREVO_SENDER_NAME',
            'FRONTEND_URL', 'OTP_EXPIRY_MINUTES'
        ];
        
        foreach ($envVars as $var) {
            if (!isset($_ENV[$var])) {
                $value = getenv($var);
                if ($value !== false) {
                    $_ENV[$var] = $value;
                }
            }
        }
    }
    
    // Verify critical environment variables
    $required = [
        'DB_HOST', 
        'DB_NAME', 
        'DB_USER',
        'JWT_SECRET', 
        'CLOUDINARY_CLOUD_NAME', 
        'CLOUDINARY_API_KEY', 
        'CLOUDINARY_API_SECRET',
        'BREVO_API_KEY',
        'BREVO_SENDER_EMAIL'
    ];
    
    $missing = [];
    foreach ($required as $var) {
        if (env($var) === null) {
            $missing[] = $var;
        }
    }
    
    // Check for database password (supports both DB_PASS and DB_PASSWORD)
    if (env('DB_PASS') === null && env('DB_PASSWORD') === null) {
        $missing[] = 'DB_PASS or DB_PASSWORD';
    }
    
    if (!empty($missing)) {
        // Log missing variables
        error_log('Missing environment variables: ' . implode(', ', $missing));
        
        // In production, also check if they exist in $_SERVER
        if ($isProduction) {
            $serverCheck = [];
            foreach ($missing as $var) {
                $inServer = isset($_SERVER[$var]) ? 'YES' : 'NO';
                $inEnv = isset($_ENV[$var]) ? 'YES' : 'NO';
                $inGetenv = (getenv($var) !== false) ? 'YES' : 'NO';
                $serverCheck[] = "$var (SERVER:$inServer ENV:$inEnv GETENV:$inGetenv)";
            }
            error_log('Variable check: ' . implode(', ', $serverCheck));
        }
        
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
            'host' => $_SERVER['HTTP_HOST'] ?? 'unknown',
            'is_production' => $isProduction
        ] : null
    ]);
    exit();
}

// Load and execute routes
require_once __DIR__ . '/routes/api.php';