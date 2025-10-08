<?php

require_once __DIR__ . '/../config/database.php';

class User
{
    private $conn;
    private $table = 'users';
    private $password_resets_table = 'password_resets';

    public $id;
    public $name;
    public $email;
    public $password;
    public $college;
    public $bio;
    public $avatar_style;
    public $avatar_seed;
    public $role;
    public $created_at;

    public function __construct()
    {
        $database = new Database();
        $this->conn = $database->connect();
    }

    public function register()
    {
        $query = "INSERT INTO " . $this->table . " 
                  (name, email, password, college) 
                  VALUES (:name, :email, :password, :college)
                  RETURNING id";

        $stmt = $this->conn->prepare($query);

        $hashed_password = password_hash($this->password, PASSWORD_BCRYPT);

        $stmt->bindParam(':name', $this->name);
        $stmt->bindParam(':email', $this->email);
        $stmt->bindParam(':password', $hashed_password);
        $stmt->bindParam(':college', $this->college);

        if ($stmt->execute()) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->id = $row['id'];
            return true;
        }

        return false;
    }

    public function emailExists()
    {
        $query = "SELECT id, name, email, password, college, bio, avatar_style, avatar_seed, role, created_at 
                  FROM " . $this->table . " 
                  WHERE email = :email 
                  LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':email', $this->email);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->id = $row['id'];
            $this->name = $row['name'];
            $this->email = $row['email'];
            $this->password = $row['password'];
            $this->college = $row['college'];
            $this->bio = $row['bio'];
            $this->avatar_style = $row['avatar_style'];
            $this->avatar_seed = $row['avatar_seed'];
            $this->role = $row['role'] ?? 'user';
            $this->created_at = $row['created_at'];
            return true;
        }

        return false;
    }

    public function verifyPassword($input_password)
    {
        return password_verify($input_password, $this->password);
    }

    public function getById($id)
    {
        $query = "SELECT id, name, email, college, bio, avatar_style, avatar_seed, role, created_at 
                  FROM " . $this->table . " 
                  WHERE id = :id 
                  LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            return $stmt->fetch(PDO::FETCH_ASSOC);
        }

        return null;
    }

    public function updateProfile($id, $data)
    {
        $updates = [];
        $params = [':id' => $id];

        if (isset($data['name']) && !empty($data['name'])) {
            $updates[] = "name = :name";
            $params[':name'] = htmlspecialchars(strip_tags($data['name']));
        }

        if (isset($data['email']) && !empty($data['email'])) {
            $updates[] = "email = :email";
            $params[':email'] = htmlspecialchars(strip_tags($data['email']));
        }

        if (isset($data['college']) && !empty($data['college'])) {
            $updates[] = "college = :college";
            $params[':college'] = htmlspecialchars(strip_tags($data['college']));
        }

        if (isset($data['bio'])) {
            $updates[] = "bio = :bio";
            $params[':bio'] = htmlspecialchars(strip_tags($data['bio']));
        }

        if (isset($data['avatar_style'])) {
            $updates[] = "avatar_style = :avatar_style";
            $params[':avatar_style'] = htmlspecialchars(strip_tags($data['avatar_style']));
        }

        if (isset($data['avatar_seed'])) {
            $updates[] = "avatar_seed = :avatar_seed";
            $params[':avatar_seed'] = htmlspecialchars(strip_tags($data['avatar_seed']));
        }

        if (empty($updates)) {
            return false;
        }

        $updates[] = "updated_at = CURRENT_TIMESTAMP";

        $query = "UPDATE " . $this->table . " 
                  SET " . implode(', ', $updates) . " 
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }

        return $stmt->execute();
    }

    public function getUserStats($id)
    {
        $filesQuery = "SELECT COUNT(*) as files_count FROM files WHERE user_id = :id";
        $filesStmt = $this->conn->prepare($filesQuery);
        $filesStmt->bindParam(':id', $id);
        $filesStmt->execute();
        $filesCount = $filesStmt->fetch(PDO::FETCH_ASSOC)['files_count'];

        $viewsQuery = "SELECT COALESCE(SUM(download_count), 0) as total_views FROM files WHERE user_id = :id";
        $viewsStmt = $this->conn->prepare($viewsQuery);
        $viewsStmt->bindParam(':id', $id);
        $viewsStmt->execute();
        $totalViews = $viewsStmt->fetch(PDO::FETCH_ASSOC)['total_views'];

        $downloadsQuery = "SELECT COUNT(*) as downloads_made FROM downloads WHERE user_id = :id";
        $downloadsStmt = $this->conn->prepare($downloadsQuery);
        $downloadsStmt->bindParam(':id', $id);
        $downloadsStmt->execute();
        $downloadsMade = $downloadsStmt->fetch(PDO::FETCH_ASSOC)['downloads_made'];

        return [
            'files_uploaded' => (int)$filesCount,
            'total_views' => (int)$totalViews,
            'contributions' => (int)$filesCount + (int)$downloadsMade
        ];
    }

    public function createPasswordResetOTP($email)
    {
        $logFile = __DIR__ . '/../user-otp-debug.log';
        
        try {
            file_put_contents($logFile, "\n=== createPasswordResetOTP ===\n" . date('Y-m-d H:i:s') . "\n", FILE_APPEND);
            file_put_contents($logFile, "Email: " . $email . "\n", FILE_APPEND);
            
            $query = "SELECT name FROM " . $this->table . " WHERE email = :email LIMIT 1";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':email', $email);
            $stmt->execute();

            if ($stmt->rowCount() === 0) {
                file_put_contents($logFile, "Email not found in database\n", FILE_APPEND);
                return ['success' => false, 'message' => 'Email not found'];
            }

            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            file_put_contents($logFile, "User found: " . json_encode($user) . "\n", FILE_APPEND);

            // Generate 6-digit OTP
            $otp = str_pad(random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
            file_put_contents($logFile, "Generated OTP: " . $otp . "\n", FILE_APPEND);

            // Set expiry to 15 minutes (increased from 10)
            $expiryMinutes = 15;
            file_put_contents($logFile, "Expiry minutes: " . $expiryMinutes . "\n", FILE_APPEND);

            // Delete old unused OTPs for this email
            $deleteQuery = "DELETE FROM " . $this->password_resets_table . " 
                           WHERE email = :email AND is_used = FALSE";
            $deleteStmt = $this->conn->prepare($deleteQuery);
            $deleteStmt->bindParam(':email', $email);
            $deleteStmt->execute();
            file_put_contents($logFile, "Deleted " . $deleteStmt->rowCount() . " old OTPs\n", FILE_APPEND);

            // Hash the OTP before storing
            $hashedOTP = password_hash($otp, PASSWORD_DEFAULT);

            // Insert new OTP with PostgreSQL interval for expiry
            $insertQuery = "INSERT INTO " . $this->password_resets_table . " 
                           (email, otp, expires_at, created_at) 
                           VALUES (:email, :otp, NOW() + INTERVAL '{$expiryMinutes} minutes', NOW())";
            
            $insertStmt = $this->conn->prepare($insertQuery);
            $insertStmt->bindParam(':email', $email);
            $insertStmt->bindParam(':otp', $hashedOTP);

            if ($insertStmt->execute()) {
                file_put_contents($logFile, "OTP inserted successfully. Expires in {$expiryMinutes} minutes\n", FILE_APPEND);
                return [
                    'success' => true,
                    'otp' => $otp,
                    'name' => $user['name']
                ];
            }

            file_put_contents($logFile, "Failed to insert OTP\n", FILE_APPEND);
            return ['success' => false, 'message' => 'Failed to generate OTP'];
            
        } catch (PDOException $e) {
            file_put_contents($logFile, "PDO EXCEPTION: " . $e->getMessage() . "\n", FILE_APPEND);
            throw $e;
        } catch (Exception $e) {
            file_put_contents($logFile, "EXCEPTION: " . $e->getMessage() . "\n", FILE_APPEND);
            throw $e;
        }
    }

    public function verifyOTP($email, $otp)
    {
        $logFile = __DIR__ . '/../user-otp-debug.log';
        
        try {
            file_put_contents($logFile, "\n=== verifyOTP ===\n" . date('Y-m-d H:i:s') . "\n", FILE_APPEND);
            file_put_contents($logFile, "Email: " . $email . "\n", FILE_APPEND);
            file_put_contents($logFile, "OTP received: " . $otp . "\n", FILE_APPEND);
            
            $query = "SELECT id, otp, expires_at, is_used, created_at, 
                      EXTRACT(EPOCH FROM (expires_at - NOW())) as seconds_until_expiry
                      FROM " . $this->password_resets_table . " 
                      WHERE email = :email 
                      ORDER BY created_at DESC 
                      LIMIT 1";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':email', $email);
            $stmt->execute();

            if ($stmt->rowCount() === 0) {
                file_put_contents($logFile, "No OTP found for email\n", FILE_APPEND);
                return ['valid' => false, 'message' => 'Invalid or expired OTP'];
            }

            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            file_put_contents($logFile, "OTP record found:\n", FILE_APPEND);
            file_put_contents($logFile, "  ID: " . $row['id'] . "\n", FILE_APPEND);
            file_put_contents($logFile, "  Created: " . $row['created_at'] . "\n", FILE_APPEND);
            file_put_contents($logFile, "  Expires: " . $row['expires_at'] . "\n", FILE_APPEND);
            file_put_contents($logFile, "  Seconds until expiry: " . $row['seconds_until_expiry'] . "\n", FILE_APPEND);
            file_put_contents($logFile, "  Is used: " . json_encode($row['is_used']) . "\n", FILE_APPEND);

            // Check if OTP is already used
            if ($row['is_used'] === true || $row['is_used'] === 't' || $row['is_used'] === '1') {
                file_put_contents($logFile, "OTP already used\n", FILE_APPEND);
                return ['valid' => false, 'message' => 'OTP has already been used'];
            }

            // Check if expired using PostgreSQL calculation
            if ($row['seconds_until_expiry'] <= 0) {
                file_put_contents($logFile, "OTP expired (" . abs($row['seconds_until_expiry']) . " seconds ago)\n", FILE_APPEND);
                return ['valid' => false, 'message' => 'OTP has expired. Please request a new one.'];
            }

            // Verify hashed OTP
            file_put_contents($logFile, "Verifying OTP hash...\n", FILE_APPEND);
            if (!password_verify($otp, $row['otp'])) {
                file_put_contents($logFile, "OTP verification failed - incorrect OTP\n", FILE_APPEND);
                return ['valid' => false, 'message' => 'Invalid OTP'];
            }

            file_put_contents($logFile, "OTP verified successfully!\n", FILE_APPEND);
            return ['valid' => true, 'reset_id' => $row['id']];
            
        } catch (PDOException $e) {
            file_put_contents($logFile, "PDO EXCEPTION in verifyOTP: " . $e->getMessage() . "\n", FILE_APPEND);
            throw $e;
        } catch (Exception $e) {
            file_put_contents($logFile, "EXCEPTION in verifyOTP: " . $e->getMessage() . "\n", FILE_APPEND);
            throw $e;
        }
    }

    public function resetPassword($email, $otp, $newPassword)
    {
        $logFile = __DIR__ . '/../user-otp-debug.log';
        
        try {
            file_put_contents($logFile, "\n=== resetPassword ===\n" . date('Y-m-d H:i:s') . "\n", FILE_APPEND);
            
            $verification = $this->verifyOTP($email, $otp);

            if (!$verification['valid']) {
                file_put_contents($logFile, "Verification failed: " . $verification['message'] . "\n", FILE_APPEND);
                return $verification;
            }

            $hashedPassword = password_hash($newPassword, PASSWORD_BCRYPT);

            $updateQuery = "UPDATE " . $this->table . " 
                           SET password = :password, updated_at = CURRENT_TIMESTAMP 
                           WHERE email = :email";
            $updateStmt = $this->conn->prepare($updateQuery);
            $updateStmt->bindParam(':password', $hashedPassword);
            $updateStmt->bindParam(':email', $email);

            if ($updateStmt->execute()) {
                // Mark OTP as used
                $markUsedQuery = "UPDATE " . $this->password_resets_table . " 
                                 SET is_used = TRUE 
                                 WHERE id = :reset_id";
                $markUsedStmt = $this->conn->prepare($markUsedQuery);
                $markUsedStmt->bindParam(':reset_id', $verification['reset_id']);
                $markUsedStmt->execute();

                file_put_contents($logFile, "Password reset successful, OTP marked as used\n", FILE_APPEND);
                return ['success' => true, 'message' => 'Password reset successful'];
            }

            file_put_contents($logFile, "Failed to update password\n", FILE_APPEND);
            return ['success' => false, 'message' => 'Failed to reset password'];
            
        } catch (Exception $e) {
            file_put_contents($logFile, "EXCEPTION in resetPassword: " . $e->getMessage() . "\n", FILE_APPEND);
            throw $e;
        }
    }

    public function cleanupExpiredOTPs()
    {
        $query = "DELETE FROM " . $this->password_resets_table . " 
                  WHERE expires_at < NOW() OR is_used = TRUE";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute();
    }

    public function isAdmin($id)
    {
        $query = "SELECT role FROM " . $this->table . " WHERE id = :id LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return $row['role'] === 'admin';
        }

        return false;
    }
}