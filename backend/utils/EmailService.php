<?php

class EmailService {
    private $apiKey;
    private $senderEmail;
    private $senderName;
    private $apiUrl = 'https://api.brevo.com/v3/smtp/email';

    public function __construct() {
        $this->apiKey = $_ENV['BREVO_API_KEY'] ?? getenv('BREVO_API_KEY');
        $this->senderEmail = $_ENV['BREVO_SENDER_EMAIL'] ?? getenv('BREVO_SENDER_EMAIL');
        $this->senderName = $_ENV['BREVO_SENDER_NAME'] ?? getenv('BREVO_SENDER_NAME') ?? 'College Hub';

        if (empty($this->apiKey)) {
            error_log('EmailService Error: BREVO_API_KEY not set');
            throw new Exception('Email service not configured - API key missing');
        }

        if (empty($this->senderEmail)) {
            error_log('EmailService Error: BREVO_SENDER_EMAIL not set');
            throw new Exception('Email service not configured - Sender email missing');
        }
    }

    public function sendOTP($recipientEmail, $recipientName, $otp) {
        try {
            $subject = 'Password Reset OTP - College Hub';
            $htmlContent = $this->getOTPEmailTemplate($otp, $recipientName);
            return $this->sendEmail($recipientEmail, $recipientName, $subject, $htmlContent);
        } catch (Exception $e) {
            error_log('EmailService sendOTP Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to send email: ' . $e->getMessage()
            ];
        }
    }

    public function sendPasswordResetConfirmation($recipientEmail, $recipientName) {
        try {
            $subject = 'Password Reset Successful - College Hub';
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

        $ch = curl_init($this->apiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'accept: application/json',
            'api-key: ' . $this->apiKey,
            'content-type: application/json'
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

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
                    <h1>📚 College Hub</h1>
                </div>
                <div class="content">
                    <h2>Hello ' . htmlspecialchars($name) . ',</h2>
                    <p>We received a request to reset your password. Use the OTP below to proceed:</p>
                    
                    <div class="otp-box">
                        <p style="margin: 0; color: #666; font-size: 14px;">Your OTP Code</p>
                        <div class="otp-code">' . $otp . '</div>
                        <p style="margin: 10px 0 0 0; color: #999; font-size: 12px;">Valid for 10 minutes</p>
                    </div>
                    
                    <p><strong>Security Tips:</strong></p>
                    <ul style="color: #666; line-height: 1.8;">
                        <li>Do not share this OTP with anyone</li>
                        <li>College Hub will never ask for your OTP via phone or email</li>
                        <li>If you did not request this, please ignore this email</li>
                    </ul>
                    
                    <p style="color: #666; margin-top: 30px;">If you have any questions, feel free to contact our support team.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2025 College Hub. All rights reserved.</p>
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
                    <h1>📚 College Hub</h1>
                </div>
                <div class="content">
                    <div class="success-icon">✅</div>
                    <h2>Password Reset Successful</h2>
                    <p>Hello ' . htmlspecialchars($name) . ',</p>
                    <p>Your password has been successfully reset. You can now login with your new password.</p>
                    <p style="color: #ef4444; margin-top: 30px;"><strong>If you did not make this change, please contact us immediately.</strong></p>
                </div>
                <div class="footer">
                    <p>&copy; 2025 College Hub. All rights reserved.</p>
                    <p>This is an automated email, please do not reply.</p>
                </div>
            </div>
        </body>
        </html>
        ';
    }
}