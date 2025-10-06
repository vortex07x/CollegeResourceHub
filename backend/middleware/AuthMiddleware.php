<?php

require_once __DIR__ . '/../config/jwt.php';
require_once __DIR__ . '/../utils/Response.php';

class AuthMiddleware {
    
    public static function authenticate() {
        $jwt = new JWTHandler();
        $token = $jwt->getTokenFromHeader();
        
        if (!$token) {
            Response::unauthorized('Access token not found');
            exit();
        }

        $validation = $jwt->validateToken($token);
        
        if (!$validation['valid']) {
            Response::unauthorized('Invalid or expired token: ' . $validation['message']);
            exit();
        }

        // CRITICAL: Store user_id in $_SERVER so FileController can access it
        $_SERVER['user_id'] = $validation['data']->user_id;
        
        return $validation['data'];
    }
}