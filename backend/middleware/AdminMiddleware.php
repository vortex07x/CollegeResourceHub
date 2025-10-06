<?php

require_once BASE_PATH . DIRECTORY_SEPARATOR . 'middleware' . DIRECTORY_SEPARATOR . 'AuthMiddleware.php';
require_once BASE_PATH . DIRECTORY_SEPARATOR . 'config' . DIRECTORY_SEPARATOR . 'database.php';
require_once BASE_PATH . DIRECTORY_SEPARATOR . 'utils' . DIRECTORY_SEPARATOR . 'Response.php';

class AdminMiddleware
{
    public static function checkAdmin()
    {
        // First authenticate the user
        AuthMiddleware::authenticate();

        // Then check if user is admin
        $userId = $_SERVER['user_id'];

        $database = new Database();
        $db = $database->connect();

        if (!$db) {
            Response::error('Database connection failed', 500);
            exit();
        }

        $stmt = $db->prepare("SELECT role FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user || $user['role'] !== 'admin') {
            Response::error('Admin access required', 403);
            exit();
        }

        // Set admin flag for use in controllers
        $_SERVER['is_admin'] = true;
    }
}