<?php

require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../config/jwt.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/EmailService.php';

class AuthController {
    
    public static function register() {
        $data = json_decode(file_get_contents("php://input"), true);

        if (empty($data['name']) || empty($data['email']) || empty($data['password']) || empty($data['college'])) {
            Response::error('All fields are required', 400);
        }

        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            Response::error('Invalid email format', 400);
        }

        if (strlen($data['password']) < 6) {
            Response::error('Password must be at least 6 characters', 400);
        }

        $user = new User();
        $user->name = htmlspecialchars(strip_tags($data['name']));
        $user->email = htmlspecialchars(strip_tags($data['email']));
        $user->password = $data['password'];
        $user->college = htmlspecialchars(strip_tags($data['college']));

        if ($user->emailExists()) {
            Response::error('Email already registered', 409);
        }

        if ($user->register()) {
            $jwt = new JWTHandler();
            $token = $jwt->generateToken($user->id, $user->email);

            Response::success([
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'college' => $user->college,
                    'bio' => null,
                    'avatar_style' => 'avataaars',
                    'avatar_seed' => str_replace(' ', '-', $user->name),
                    'role' => 'user' // New users default to 'user' role
                ],
                'token' => $token
            ], 'Registration successful', 201);
        } else {
            Response::error('Registration failed', 500);
        }
    }

    public static function login() {
        $data = json_decode(file_get_contents("php://input"), true);

        if (empty($data['email']) || empty($data['password'])) {
            Response::error('Email and password are required', 400);
        }

        $user = new User();
        $user->email = htmlspecialchars(strip_tags($data['email']));

        if (!$user->emailExists()) {
            Response::error('Invalid credentials', 401);
        }

        if (!$user->verifyPassword($data['password'])) {
            Response::error('Invalid credentials', 401);
        }

        $jwt = new JWTHandler();
        $token = $jwt->generateToken($user->id, $user->email);

        Response::success([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'college' => $user->college,
                'bio' => $user->bio,
                'avatar_style' => $user->avatar_style ?: 'avataaars',
                'avatar_seed' => $user->avatar_seed ?: str_replace(' ', '-', $user->name),
                'role' => $user->role ?: 'user' // Include role from emailExists()
            ],
            'token' => $token
        ], 'Login successful');
    }

    public static function getProfile() {
        $jwt = new JWTHandler();
        $token = $jwt->getTokenFromHeader();
        
        if (!$token) {
            Response::unauthorized('No token provided');
        }

        $validation = $jwt->validateToken($token);
        
        if (!$validation['valid']) {
            Response::unauthorized('Invalid token');
        }

        $user_id = $validation['data']->user_id;
        $user = new User();
        $user_data = $user->getById($user_id);

        if ($user_data) {
            $stats = $user->getUserStats($user_id);
            
            // Set default avatar if not set
            if (empty($user_data['avatar_style'])) {
                $user_data['avatar_style'] = 'avataaars';
            }
            if (empty($user_data['avatar_seed'])) {
                $user_data['avatar_seed'] = str_replace(' ', '-', $user_data['name']);
            }
            // IMPORTANT: Ensure role is included (fallback to 'user' if not set)
            if (!isset($user_data['role']) || empty($user_data['role'])) {
                $user_data['role'] = 'user';
            }
            
            Response::success([
                'profile' => $user_data,
                'stats' => $stats
            ], 'Profile retrieved successfully');
        } else {
            Response::notFound('User not found');
        }
    }

    public static function updateProfile() {
        $jwt = new JWTHandler();
        $token = $jwt->getTokenFromHeader();
        
        if (!$token) {
            Response::unauthorized('No token provided');
        }

        $validation = $jwt->validateToken($token);
        
        if (!$validation['valid']) {
            Response::unauthorized('Invalid token');
        }

        $user_id = $validation['data']->user_id;
        $data = json_decode(file_get_contents("php://input"), true);

        if (isset($data['email']) && !empty($data['email'])) {
            if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                Response::error('Invalid email format', 400);
            }

            $user = new User();
            $user->email = $data['email'];
            if ($user->emailExists() && $user->id != $user_id) {
                Response::error('Email already taken', 409);
            }
        }

        $user = new User();
        if ($user->updateProfile($user_id, $data)) {
            $updated_data = $user->getById($user_id);
            
            // Ensure role is in response
            if (!isset($updated_data['role']) || empty($updated_data['role'])) {
                $updated_data['role'] = 'user';
            }
            
            Response::success([
                'profile' => $updated_data
            ], 'Profile updated successfully');
        } else {
            Response::error('Failed to update profile', 500);
        }
    }

    public static function logout() {
        $jwt = new JWTHandler();
        $token = $jwt->getTokenFromHeader();
        
        if (!$token) {
            Response::unauthorized('No token provided');
        }

        $validation = $jwt->validateToken($token);
        
        if (!$validation['valid']) {
            Response::unauthorized('Invalid token');
        }

        Response::success(null, 'Logged out successfully');
    }

    public static function forgotPassword() {
        $data = json_decode(file_get_contents("php://input"), true);

        if (empty($data['email'])) {
            Response::error('Email is required', 400);
        }

        $email = htmlspecialchars(strip_tags($data['email']));

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::error('Invalid email format', 400);
        }

        $user = new User();
        $result = $user->createPasswordResetOTP($email);

        if (!$result['success']) {
            Response::error($result['message'], 404);
        }

        $emailService = new EmailService();
        $emailResult = $emailService->sendOTP($email, $result['name'], $result['otp']);

        if (!$emailResult['success']) {
            Response::error('Failed to send OTP email', 500);
        }

        Response::success([
            'email' => $email
        ], 'OTP sent to your email successfully');
    }

    public static function verifyOTP() {
        $data = json_decode(file_get_contents("php://input"), true);

        if (empty($data['email']) || empty($data['otp'])) {
            Response::error('Email and OTP are required', 400);
        }

        $email = htmlspecialchars(strip_tags($data['email']));
        $otp = htmlspecialchars(strip_tags($data['otp']));

        $user = new User();
        $result = $user->verifyOTP($email, $otp);

        if (!$result['valid']) {
            Response::error($result['message'], 400);
        }

        Response::success([
            'email' => $email,
            'verified' => true
        ], 'OTP verified successfully');
    }

    public static function resetPassword() {
        $data = json_decode(file_get_contents("php://input"), true);

        if (empty($data['email']) || empty($data['otp']) || empty($data['password'])) {
            Response::error('Email, OTP and new password are required', 400);
        }

        if (strlen($data['password']) < 6) {
            Response::error('Password must be at least 6 characters', 400);
        }

        $email = htmlspecialchars(strip_tags($data['email']));
        $otp = htmlspecialchars(strip_tags($data['otp']));
        $password = $data['password'];

        $user = new User();
        $result = $user->resetPassword($email, $otp, $password);

        if (!$result['success']) {
            Response::error($result['message'], 400);
        }

        $user->email = $email;
        if ($user->emailExists()) {
            $emailService = new EmailService();
            $emailService->sendPasswordResetConfirmation($email, $user->name);
        }

        Response::success(null, 'Password reset successfully. You can now login with your new password.');
    }
}