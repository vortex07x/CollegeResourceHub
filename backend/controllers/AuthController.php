<?php

require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../config/jwt.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/EmailService.php';

class AuthController
{

    public static function register()
    {
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
                    'role' => 'user'
                ],
                'token' => $token
            ], 'Registration successful', 201);
        } else {
            Response::error('Registration failed', 500);
        }
    }

    public static function login()
    {
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
                'role' => $user->role ?: 'user'
            ],
            'token' => $token
        ], 'Login successful');
    }

    public static function getProfile()
    {
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

            if (empty($user_data['avatar_style'])) {
                $user_data['avatar_style'] = 'avataaars';
            }
            if (empty($user_data['avatar_seed'])) {
                $user_data['avatar_seed'] = str_replace(' ', '-', $user_data['name']);
            }
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

    public static function updateProfile()
    {
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

    public static function logout()
    {
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

    public static function forgotPassword()
{
    $logFile = __DIR__ . '/../forgot-password-debug.log';
    
    try {
        file_put_contents($logFile, "\n=== NEW REQUEST ===\n" . date('Y-m-d H:i:s') . "\n", FILE_APPEND);
        
        $rawInput = file_get_contents("php://input");
        file_put_contents($logFile, "Raw input: " . $rawInput . "\n", FILE_APPEND);
        
        $data = json_decode($rawInput, true);
        file_put_contents($logFile, "Decoded data: " . json_encode($data) . "\n", FILE_APPEND);

        if (empty($data['email'])) {
            file_put_contents($logFile, "ERROR: Email is empty\n", FILE_APPEND);
            Response::error('Email is required', 400);
            return;
        }

        $email = htmlspecialchars(strip_tags($data['email']));
        file_put_contents($logFile, "Email: " . $email . "\n", FILE_APPEND);

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            file_put_contents($logFile, "ERROR: Invalid email format\n", FILE_APPEND);
            Response::error('Invalid email format', 400);
            return;
        }

        file_put_contents($logFile, "Creating User instance\n", FILE_APPEND);
        $user = new User();
        
        file_put_contents($logFile, "Calling createPasswordResetOTP\n", FILE_APPEND);
        $result = $user->createPasswordResetOTP($email);
        
        file_put_contents($logFile, "OTP creation result: " . json_encode($result) . "\n", FILE_APPEND);

        if (!$result['success']) {
            file_put_contents($logFile, "OTP creation failed, but returning success (security)\n", FILE_APPEND);
            Response::success(['email' => $email], 'If the email exists, an OTP has been sent');
            return;
        }

        file_put_contents($logFile, "Creating EmailService instance\n", FILE_APPEND);
        $emailService = new EmailService();
        
        file_put_contents($logFile, "Sending OTP email\n", FILE_APPEND);
        $emailResult = $emailService->sendOTP($email, $result['name'], $result['otp']);
        
        file_put_contents($logFile, "Email send result: " . json_encode($emailResult) . "\n", FILE_APPEND);

        if (!$emailResult['success']) {
            file_put_contents($logFile, "Email failed: " . $emailResult['message'] . "\n", FILE_APPEND);
            Response::error('Failed to send email. Please try again later.', 500);
            return;
        }

        file_put_contents($logFile, "Success! Returning response\n", FILE_APPEND);
        Response::success(['email' => $email], 'OTP sent to your email successfully');
        
    } catch (PDOException $e) {
        file_put_contents($logFile, "PDO EXCEPTION: " . $e->getMessage() . "\n", FILE_APPEND);
        file_put_contents($logFile, "Stack: " . $e->getTraceAsString() . "\n", FILE_APPEND);
        Response::error('Database error occurred', 500);
        
    } catch (Exception $e) {
        file_put_contents($logFile, "EXCEPTION: " . $e->getMessage() . "\n", FILE_APPEND);
        file_put_contents($logFile, "Stack: " . $e->getTraceAsString() . "\n", FILE_APPEND);
        Response::error('An error occurred: ' . $e->getMessage(), 500);
    }
}

    public static function verifyOTP()
    {
        $data = json_decode(file_get_contents("php://input"), true);

        if (empty($data['email']) || empty($data['otp'])) {
            Response::error('Email and OTP are required', 400);
            return;
        }

        $email = htmlspecialchars(strip_tags($data['email']));
        $otp = htmlspecialchars(strip_tags($data['otp']));

        $user = new User();
        $result = $user->verifyOTP($email, $otp);

        if (!$result['valid']) {
            Response::error($result['message'], 400);
            return;
        }

        Response::success([
            'email' => $email,
            'verified' => true
        ], 'OTP verified successfully');
    }

    public static function resetPassword()
    {
        $data = json_decode(file_get_contents("php://input"), true);

        if (empty($data['email']) || empty($data['otp']) || empty($data['password'])) {
            Response::error('Email, OTP and new password are required', 400);
            return;
        }

        if (strlen($data['password']) < 6) {
            Response::error('Password must be at least 6 characters', 400);
            return;
        }

        $email = htmlspecialchars(strip_tags($data['email']));
        $otp = htmlspecialchars(strip_tags($data['otp']));
        $password = $data['password'];

        $user = new User();
        $result = $user->resetPassword($email, $otp, $password);

        if (!$result['success']) {
            Response::error($result['message'], 400);
            return;
        }

        // Send confirmation email
        $user->email = $email;
        if ($user->emailExists()) {
            try {
                $emailService = new EmailService();
                $emailService->sendPasswordResetConfirmation($email, $user->name);
            } catch (Exception $e) {
                error_log('Failed to send password reset confirmation: ' . $e->getMessage());
            }
        }

        Response::success(null, 'Password reset successfully. You can now login with your new password.');
    }
}