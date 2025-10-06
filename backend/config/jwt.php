<?php

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class JWTHandler {
    private $secret_key;
    private $expiry;

    public function __construct() {
        $this->secret_key = $_ENV['JWT_SECRET'];
        $this->expiry = $_ENV['JWT_EXPIRY'] ?? 3600;
    }

    public function generateToken($user_id, $email) {
        $issued_at = time();
        $expiration_time = $issued_at + $this->expiry;
        
        $payload = [
            'iss' => 'college_resource_hub',
            'iat' => $issued_at,
            'exp' => $expiration_time,
            'data' => [
                'user_id' => $user_id,
                'email' => $email
            ]
        ];

        return JWT::encode($payload, $this->secret_key, 'HS256');
    }

    public function validateToken($token) {
        try {
            $decoded = JWT::decode($token, new Key($this->secret_key, 'HS256'));
            return [
                'valid' => true,
                'data' => $decoded->data
            ];
        } catch (Exception $e) {
            return [
                'valid' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    public function getTokenFromHeader() {
        $headers = null;
        
        // Method 1: Check $_SERVER (most reliable with Apache rewrites)
        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $headers = trim($_SERVER['HTTP_AUTHORIZATION']);
        } 
        // Method 2: Check REDIRECT_HTTP_AUTHORIZATION (Apache sometimes uses this)
        elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $headers = trim($_SERVER['REDIRECT_HTTP_AUTHORIZATION']);
        }
        // Method 3: Try apache_request_headers() if available
        elseif (function_exists('apache_request_headers')) {
            $requestHeaders = apache_request_headers();
            if (isset($requestHeaders['Authorization'])) {
                $headers = trim($requestHeaders['Authorization']);
            } elseif (isset($requestHeaders['authorization'])) {
                $headers = trim($requestHeaders['authorization']);
            }
        }
        
        // Extract token from "Bearer <token>" format
        if (!empty($headers)) {
            if (preg_match('/Bearer\s+(\S+)/', $headers, $matches)) {
                return $matches[1];
            }
        }
        
        return null;
    }
}