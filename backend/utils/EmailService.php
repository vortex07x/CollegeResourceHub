<?php

class EmailService {
    private $apiKey;
    private $senderEmail;
    private $senderName;
    private $apiUrl = 'https://api.brevo.com/v3/smtp/email';

    public function __construct() {
        // Get environment variables with multiple fallback methods
        $this->apiKey = $this->getEnvVar('BREVO_API_KEY');
        $this->senderEmail = $this->getEnvVar('BREVO_SENDER_EMAIL');
        $this->senderName = $this->getEnvVar('BREVO_SENDER_NAME', 'College Resource Hub');

        // Log environment info for debugging
        $logFile = __DIR__ . '/../email-service-debug.log';
        $logMsg = "\n=== EmailService Init ===\n" . date('Y-m-d H:i:s') . "\n";
        $logMsg .= "API Key present: " . (!empty($this->apiKey) ? 'Yes (' . substr($this->apiKey, 0, 10) . '...)' : 'No') . "\n";
        $logMsg .= "Sender Email: " . ($this->senderEmail ?: 'Not set') . "\n";
        $logMsg .= "Sender Name: " . $this->senderName . "\n";
        
        // Check all environment sources
        $logMsg .= "\n--- Environment Check ---\n";
        $logMsg .= "BREVO_API_KEY in \$_ENV: " . (isset($_ENV['BREVO_API_KEY']) ? 'Yes' : 'No') . "\n";
        $logMsg .= "BREVO_API_KEY in getenv(): " . (getenv('BREVO_API_KEY') !== false ? 'Yes' : 'No') . "\n";
        $logMsg .= "BREVO_API_KEY in \$_SERVER: " . (isset($_SERVER['BREVO_API_KEY']) ? 'Yes' : 'No') . "\n";
        $logMsg .= "BREVO_SENDER_EMAIL in \$_ENV: " . (isset($_ENV['BREVO_SENDER_EMAIL']) ? 'Yes' : 'No') . "\n";
        $logMsg .= "BREVO_SENDER_EMAIL in getenv(): " . (getenv('BREVO_SENDER_EMAIL') !== false ? 'Yes' : 'No') . "\n";
        $logMsg .= "BREVO_SENDER_EMAIL in \$_SERVER: " . (isset($_SERVER['BREVO_SENDER_EMAIL']) ? 'Yes' : 'No') . "\n";
        
        @file_put_contents($logFile, $logMsg, FILE_APPEND);

        // Validate required configuration
        if (empty($this->apiKey)) {
            $error = 'BREVO_API_KEY environment variable is not set or empty';
            error_log('EmailService Error: ' . $error);
            @file_put_contents($logFile, "ERROR: " . $error . "\n", FILE_APPEND);
            throw new Exception($error);
        }

        if (empty($this->senderEmail)) {
            $error = 'BREVO_SENDER_EMAIL environment variable is not set or empty';
            error_log('EmailService Error: ' . $error);
            @file_put_contents($logFile, "ERROR: " . $error . "\n", FILE_APPEND);
            throw new Exception($error);
        }
    }

    /**
     * Get environment variable with multiple fallback methods
     */
    private function getEnvVar($key, $default = null) {
        // Method 1: $_ENV superglobal
        if (isset($_ENV[$key]) && $_ENV[$key] !== '' && $_ENV[$key] !== null) {
            return $_ENV[$key];
        }

        // Method 2: getenv() function
        $value = getenv($key);
        if ($value !== false && $value !== '' && $value !== null) {
            return $value;
        }

        // Method 3: $_SERVER superglobal
        if (isset($_SERVER[$key]) && $_SERVER[$key] !== '' && $_SERVER[$key] !== null) {
            return $_SERVER[$key];
        }

        return $default;
    }

    public function sendOTP($recipientEmail, $recipientName, $otp) {
        $logFile = __DIR__ . '/../email-service-debug.log';
        
        try {
            @file_put_contents($logFile, "\n=== Sending OTP ===\n" . date('Y-m-d H:i:s') . "\n", FILE_APPEND);
            @file_put_contents($logFile, "To: {$recipientEmail}\n", FILE_APPEND);
            @file_put_contents($logFile, "Name: {$recipientName}\n", FILE_APPEND);
            @file_put_contents($logFile, "OTP: {$otp}\n", FILE_APPEND);
            
            $subject = 'Password Reset OTP - College Resource Hub';
            $htmlContent = $this->getOTPEmailTemplate($otp, $recipientName);
            
            $result = $this->sendEmail($recipientEmail, $recipientName, $subject, $htmlContent);
            
            @file_put_contents($logFile, "Result: " . json_encode($result) . "\n", FILE_APPEND);
            
            return $result;
        } catch (Exception $e) {
            $errorMsg = 'EmailService sendOTP Error: ' . $e->getMessage();
            error_log($errorMsg);
            @file_put_contents($logFile, "EXCEPTION: {$errorMsg}\n", FILE_APPEND);
            
            return [
                'success' => false,
                'message' => 'Failed to send email: ' . $e->getMessage()
            ];
        }
    }

    public function sendPasswordResetConfirmation($recipientEmail, $recipientName) {
        try {
            $subject = 'Password Reset Successful - College Resource Hub';
            $htmlContent = $this->getPasswordResetConfirmationTemplate($recipientName);
            return $this->sendEmail($recipientEmail, $recipientName, $subject, $htmlContent);
        } catch (Exception $e) {
            error_log('EmailService sendPasswordResetConfirmation Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    private function sendEmail($recipientEmail, $recipientName, $subject, $htmlContent) {
        $logFile = __DIR__ . '/../email-service-debug.log';
        
        $data = [
            'sender' => [
                'name' => $this->senderName,
                'email' => $this->senderEmail
            ],
            'to' => [
                [
                    'email' => $recipientEmail,
                    'name' => $recipientName
                ]
            ],
            'subject' => $subject,
            'htmlContent' => $htmlContent
        ];

        @file_put_contents($logFile, "\n--- Sending to Brevo API ---\n", FILE_APPEND);
        @file_put_contents($logFile, "URL: {$this->apiUrl}\n", FILE_APPEND);
        @file_put_contents($logFile, "Payload: " . json_encode($data) . "\n", FILE_APPEND);

        $ch = curl_init($this->apiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'accept: application/json',
            'api-key: ' . $this->apiKey,
            'content-type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        @file_put_contents($logFile, "HTTP Code: {$httpCode}\n", FILE_APPEND);
        @file_put_contents($logFile, "Response: {$response}\n", FILE_APPEND);
        if ($curlError) {
            @file_put_contents($logFile, "cURL Error: {$curlError}\n", FILE_APPEND);
        }

        error_log("Brevo API Response Code: " . $httpCode);
        error_log("Brevo API Response: " . $response);

        if ($httpCode === 201) {
            return [
                'success' => true,
                'message' => 'Email sent successfully'
            ];
        } else {
            $errorMsg = "HTTP {$httpCode}";
            if (!empty($response)) {
                $decoded = json_decode($response, true);
                if (isset($decoded['message'])) {
                    $errorMsg .= ": " . $decoded['message'];
                } else if (isset($decoded['code'])) {
                    $errorMsg .= " - Code: " . $decoded['code'];
                }
            }
            if (!empty($curlError)) {
                $errorMsg .= " | cURL Error: " . $curlError;
            }
            
            error_log("Brevo API Error: " . $errorMsg);
            
            return [
                'success' => false,
                'message' => $errorMsg
            ];
        }
    }

    private function getOTPEmailTemplate($otp, $name) {
        return '
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
                .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
                .content { padding: 40px 30px; }
                .otp-box { background: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; }
                .otp-code { font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; margin: 10px 0; }
                .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📚 College Resource Hub</h1>
                </div>
                <div class="content">
                    <h2>Hello ' . htmlspecialchars($name) . ',</h2>
                    <p>We received a request to reset your password. Use the OTP below to proceed:</p>
                    
                    <div class="otp-box">
                        <p style="margin: 0; color: #666; font-size: 14px;">Your OTP Code</p>
                        <div class="otp-code">' . $otp . '</div>
                        <p style="margin: 10px 0 0 0; color: #999; font-size: 12px;">Valid for 15 minutes</p>
                    </div>
                    
                    <p><strong>Security Tips:</strong></p>
                    <ul style="color: #666; line-height: 1.8;">
                        <li>Do not share this OTP with anyone</li>
                        <li>College Resource Hub will never ask for your OTP via phone or email</li>
                        <li>If you did not request this, please ignore this email</li>
                    </ul>
                    
                    <p style="color: #666; margin-top: 30px;">If you have any questions, feel free to contact our support team.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2025 College Resource Hub. All rights reserved.</p>
                    <p>This is an automated email, please do not reply.</p>
                </div>
            </div>
        </body>
        </html>
        ';
    }

    private function getPasswordResetConfirmationTemplate($name) {
        return '
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center; }
                .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
                .content { padding: 40px 30px; }
                .success-icon { font-size: 64px; text-align: center; margin: 20px 0; }
                .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📚 College Resource Hub</h1>
                </div>
                <div class="content">
                    <div class="success-icon">✅</div>
                    <h2>Password Reset Successful</h2>
                    <p>Hello ' . htmlspecialchars($name) . ',</p>
                    <p>Your password has been successfully reset. You can now login with your new password.</p>
                    <p style="color: #ef4444; margin-top: 30px;"><strong>If you did not make this change, please contact us immediately.</strong></p>
                </div>
                <div class="footer">
                    <p>&copy; 2025 College Resource Hub. All rights reserved.</p>
                    <p>This is an automated email, please do not reply.</p>
                </div>
            </div>
        </body>
        </html>
        ';
    }
}