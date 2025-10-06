<?php

require_once __DIR__ . '/../vendor/autoload.php';

use SendinBlue\Client\Configuration;
use SendinBlue\Client\Api\TransactionalEmailsApi;
use SendinBlue\Client\Model\SendSmtpEmail;

class EmailService {
    private $apiInstance;
    private $senderEmail;
    private $senderName;

    public function __construct() {
        $config = Configuration::getDefaultConfiguration()->setApiKey('api-key', $_ENV['BREVO_API_KEY']);
        $this->apiInstance = new TransactionalEmailsApi(new GuzzleHttp\Client(), $config);
        $this->senderEmail = $_ENV['BREVO_SENDER_EMAIL'];
        $this->senderName = $_ENV['BREVO_SENDER_NAME'];
    }

    public function sendOTP($recipientEmail, $recipientName, $otp) {
        try {
            $sendSmtpEmail = new SendSmtpEmail([
                'subject' => 'Password Reset OTP - College Hub',
                'sender' => [
                    'name' => $this->senderName,
                    'email' => $this->senderEmail
                ],
                'to' => [[
                    'email' => $recipientEmail,
                    'name' => $recipientName
                ]],
                'htmlContent' => $this->getOTPEmailTemplate($otp, $recipientName)
            ]);

            $result = $this->apiInstance->sendTransacEmail($sendSmtpEmail);
            return [
                'success' => true,
                'message' => 'OTP sent successfully',
                'messageId' => $result->getMessageId()
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to send email: ' . $e->getMessage()
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
                .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; margin: 20px 0; }
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
                    <p>&copy; 2024 College Hub. All rights reserved.</p>
                    <p>This is an automated email, please do not reply.</p>
                </div>
            </div>
        </body>
        </html>
        ';
    }

    public function sendPasswordResetConfirmation($recipientEmail, $recipientName) {
        try {
            $sendSmtpEmail = new SendSmtpEmail([
                'subject' => 'Password Reset Successful - College Hub',
                'sender' => [
                    'name' => $this->senderName,
                    'email' => $this->senderEmail
                ],
                'to' => [[
                    'email' => $recipientEmail,
                    'name' => $recipientName
                ]],
                'htmlContent' => $this->getPasswordResetConfirmationTemplate($recipientName)
            ]);

            $result = $this->apiInstance->sendTransacEmail($sendSmtpEmail);
            return ['success' => true];
        } catch (Exception $e) {
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    private function getPasswordResetConfirmationTemplate($name) {
        return '
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 10px; overflow: hidden; }
                .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center; }
                .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
                .content { padding: 40px 30px; }
                .success-icon { font-size: 64px; text-align: center; margin: 20px 0; }
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
            </div>
        </body>
        </html>
        ';
    }
}