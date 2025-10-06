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
                  VALUES (:name, :email, :password, :college)";

        $stmt = $this->conn->prepare($query);

        $hashed_password = password_hash($this->password, PASSWORD_BCRYPT);

        $stmt->bindParam(':name', $this->name);
        $stmt->bindParam(':email', $this->email);
        $stmt->bindParam(':password', $hashed_password);
        $stmt->bindParam(':college', $this->college);

        if ($stmt->execute()) {
            // PostgreSQL: Get last insert ID with sequence name
            $this->id = $this->conn->lastInsertId('users_id_seq');
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
            $row = $stmt->fetch();
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
            return $stmt->fetch();
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

        // PostgreSQL: updated_at handled by trigger
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
        $filesCount = $filesStmt->fetch()['files_count'];

        $viewsQuery = "SELECT COALESCE(SUM(download_count), 0) as total_views FROM files WHERE user_id = :id";
        $viewsStmt = $this->conn->prepare($viewsQuery);
        $viewsStmt->bindParam(':id', $id);
        $viewsStmt->execute();
        $totalViews = $viewsStmt->fetch()['total_views'];

        $downloadsQuery = "SELECT COUNT(*) as downloads_made FROM downloads WHERE user_id = :id";
        $downloadsStmt = $this->conn->prepare($downloadsQuery);
        $downloadsStmt->bindParam(':id', $id);
        $downloadsStmt->execute();
        $downloadsMade = $downloadsStmt->fetch()['downloads_made'];

        return [
            'files_uploaded' => (int)$filesCount,
            'total_views' => (int)$totalViews,
            'contributions' => (int)$filesCount + (int)$downloadsMade
        ];
    }

    public function createPasswordResetOTP($email)
    {
        $query = "SELECT name FROM " . $this->table . " WHERE email = :email LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':email', $email);
        $stmt->execute();

        if ($stmt->rowCount() === 0) {
            return ['success' => false, 'message' => 'Email not found'];
        }

        $user = $stmt->fetch();

        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $expiryMinutes = $_ENV['OTP_EXPIRY_MINUTES'] ?? 10;
        $expiresAt = date('Y-m-d H:i:s', strtotime("+{$expiryMinutes} minutes"));

        // PostgreSQL: Use FALSE instead of 0
        $deleteQuery = "DELETE FROM " . $this->password_resets_table . " 
                       WHERE email = :email AND is_used = FALSE";
        $deleteStmt = $this->conn->prepare($deleteQuery);
        $deleteStmt->bindParam(':email', $email);
        $deleteStmt->execute();

        $insertQuery = "INSERT INTO " . $this->password_resets_table . " 
                       (email, otp, expires_at) 
                       VALUES (:email, :otp, :expires_at)";
        $insertStmt = $this->conn->prepare($insertQuery);
        $insertStmt->bindParam(':email', $email);
        $insertStmt->bindParam(':otp', $otp);
        $insertStmt->bindParam(':expires_at', $expiresAt);

        if ($insertStmt->execute()) {
            return [
                'success' => true,
                'otp' => $otp,
                'name' => $user['name']
            ];
        }

        return ['success' => false, 'message' => 'Failed to generate OTP'];
    }

    public function verifyOTP($email, $otp)
    {
        $query = "SELECT id, expires_at, is_used 
                  FROM " . $this->password_resets_table . " 
                  WHERE email = :email AND otp = :otp 
                  ORDER BY created_at DESC 
                  LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':email', $email);
        $stmt->bindParam(':otp', $otp);
        $stmt->execute();

        if ($stmt->rowCount() === 0) {
            return ['valid' => false, 'message' => 'Invalid OTP'];
        }

        $row = $stmt->fetch();

        // PostgreSQL: Boolean comparison
        if ($row['is_used'] === true || $row['is_used'] === 't') {
            return ['valid' => false, 'message' => 'OTP already used'];
        }

        if (strtotime($row['expires_at']) < time()) {
            return ['valid' => false, 'message' => 'OTP expired'];
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

        // PostgreSQL: updated_at handled by trigger
        $updateQuery = "UPDATE " . $this->table . " 
                       SET password = :password 
                       WHERE email = :email";
        $updateStmt = $this->conn->prepare($updateQuery);
        $updateStmt->bindParam(':password', $hashedPassword);
        $updateStmt->bindParam(':email', $email);

        if ($updateStmt->execute()) {
            // PostgreSQL: Use TRUE instead of 1
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
        // PostgreSQL: Use TRUE instead of 1
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
            $row = $stmt->fetch();
            return $row['role'] === 'admin';
        }

        return false;
    }
}