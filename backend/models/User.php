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
            file_put_contents($logFile, "Query: " . $query . "\n", FILE_APPEND);
            
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
            $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            file_put_contents($logFile, "Generated OTP: " . $otp . "\n", FILE_APPEND);

            $expiryMinutes = $_ENV['OTP_EXPIRY_MINUTES'] ?? getenv('OTP_EXPIRY_MINUTES') ?? 10;
            file_put_contents($logFile, "Expiry minutes: " . $expiryMinutes . "\n", FILE_APPEND);
            
            $expiresAt = date('Y-m-d H:i:s', strtotime("+{$expiryMinutes} minutes"));
            file_put_contents($logFile, "Expires at: " . $expiresAt . "\n", FILE_APPEND);

            // Delete old unused OTPs for this email
            $deleteQuery = "DELETE FROM " . $this->password_resets_table . " 
                           WHERE email = :email AND is_used = FALSE";
            file_put_contents($logFile, "Delete query: " . $deleteQuery . "\n", FILE_APPEND);
            
            $deleteStmt = $this->conn->prepare($deleteQuery);
            $deleteStmt->bindParam(':email', $email);
            $deleteStmt->execute();
            file_put_contents($logFile, "Deleted " . $deleteStmt->rowCount() . " old OTPs\n", FILE_APPEND);

            // Hash the OTP before storing (security best practice)
            $hashedOTP = password_hash($otp, PASSWORD_DEFAULT);
            file_put_contents($logFile, "Hashed OTP (first 20 chars): " . substr($hashedOTP, 0, 20) . "...\n", FILE_APPEND);

            // Insert new OTP
            $insertQuery = "INSERT INTO " . $this->password_resets_table . " 
                           (email, otp, expires_at) 
                           VALUES (:email, :otp, :expires_at)";
            file_put_contents($logFile, "Insert query: " . $insertQuery . "\n", FILE_APPEND);
            
            $insertStmt = $this->conn->prepare($insertQuery);
            $insertStmt->bindParam(':email', $email);
            $insertStmt->bindParam(':otp', $hashedOTP);
            $insertStmt->bindParam(':expires_at', $expiresAt);

            if ($insertStmt->execute()) {
                file_put_contents($logFile, "OTP inserted successfully\n", FILE_APPEND);
                return [
                    'success' => true,
                    'otp' => $otp, // Return plain OTP to send via email
                    'name' => $user['name']
                ];
            }

            file_put_contents($logFile, "Failed to insert OTP\n", FILE_APPEND);
            return ['success' => false, 'message' => 'Failed to generate OTP'];
            
        } catch (PDOException $e) {
            file_put_contents($logFile, "PDO EXCEPTION in createPasswordResetOTP: " . $e->getMessage() . "\n", FILE_APPEND);
            file_put_contents($logFile, "Stack: " . $e->getTraceAsString() . "\n", FILE_APPEND);
            throw $e;
        } catch (Exception $e) {
            file_put_contents($logFile, "EXCEPTION in createPasswordResetOTP: " . $e->getMessage() . "\n", FILE_APPEND);
            file_put_contents($logFile, "Stack: " . $e->getTraceAsString() . "\n", FILE_APPEND);
            throw $e;
        }
    }

    public function verifyOTP($email, $otp)
    {
        $query = "SELECT id, otp, expires_at, is_used 
                  FROM " . $this->password_resets_table . " 
                  WHERE email = :email 
                  ORDER BY created_at DESC 
                  LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':email', $email);
        $stmt->execute();

        if ($stmt->rowCount() === 0) {
            return ['valid' => false, 'message' => 'Invalid OTP'];
        }

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        // PostgreSQL boolean handling - returns actual boolean
        $isUsed = $row['is_used'];
        // Convert to boolean properly
        if ($isUsed === true || $isUsed === 't' || $isUsed === 1 || $isUsed === '1' || $isUsed === 'true') {
            return ['valid' => false, 'message' => 'OTP already used'];
        }

        // Check if expired
        if (strtotime($row['expires_at']) < time()) {
            return ['valid' => false, 'message' => 'OTP expired'];
        }

        // Verify hashed OTP
        if (!password_verify($otp, $row['otp'])) {
            return ['valid' => false, 'message' => 'Invalid OTP'];
        }

        return ['valid' => true, 'reset_id' => $row['id']];
    }

    public function resetPassword($email, $otp, $newPassword)
    {
        $verification = $this->verifyOTP($email, $otp);

        if (!$verification['valid']) {
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

            return ['success' => true, 'message' => 'Password reset successful'];
        }

        return ['success' => false, 'message' => 'Failed to reset password'];
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