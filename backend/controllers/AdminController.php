<?php

require_once BASE_PATH . DIRECTORY_SEPARATOR . 'config' . DIRECTORY_SEPARATOR . 'database.php';
require_once BASE_PATH . DIRECTORY_SEPARATOR . 'utils' . DIRECTORY_SEPARATOR . 'Response.php';

class AdminController
{
    // Dashboard Statistics
    public static function getDashboardStats()
    {
        try {
            if (!isset($_SERVER['user_id']) || !isset($_SERVER['is_admin'])) {
                Response::error('Unauthorized access', 403);
                return;
            }

            $database = new Database();
            $db = $database->connect();

            if (!$db) {
                Response::error('Database connection failed', 500);
                return;
            }

            // Total users
            $stmt = $db->query("SELECT COUNT(*) as total FROM users");
            $totalUsers = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

            // Total files
            $stmt = $db->query("SELECT COUNT(*) as total FROM files");
            $totalFiles = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

            // Total downloads
            $stmt = $db->query("SELECT COUNT(*) as total FROM downloads");
            $totalDownloads = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

            // Total storage used (in MB)
            $stmt = $db->query("SELECT COALESCE(SUM(file_size), 0) as total FROM files");
            $totalStorage = round($stmt->fetch(PDO::FETCH_ASSOC)['total'] / (1024 * 1024), 2);

            // Recent users (last 7 days) - PostgreSQL INTERVAL syntax
            $stmt = $db->query("SELECT COUNT(*) as total FROM users WHERE created_at >= NOW() - INTERVAL '7 days'");
            $recentUsers = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

            // Recent uploads (last 7 days) - PostgreSQL INTERVAL syntax
            $stmt = $db->query("SELECT COUNT(*) as total FROM files WHERE created_at >= NOW() - INTERVAL '7 days'");
            $recentUploads = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

            // Most active users (top 5)
            $topUsersQuery = "
                SELECT 
                    u.id, 
                    u.name, 
                    u.email, 
                    COUNT(f.id) as file_count
                FROM users u
                LEFT JOIN files f ON f.user_id = u.id
                GROUP BY u.id, u.name, u.email
                HAVING COUNT(f.id) > 0
                ORDER BY file_count DESC
                LIMIT 5
            ";

            $stmt = $db->query($topUsersQuery);
            $topUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Convert file_count to int for each user
            foreach ($topUsers as &$user) {
                $user['file_count'] = (int)$user['file_count'];
            }
            unset($user);

            // Recent activity (last 10 actions)
            $stmt = $db->query("
                SELECT 
                    'upload' as type, 
                    u.name as user_name, 
                    f.title as file_title, 
                    f.created_at as timestamp
                FROM files f
                INNER JOIN users u ON f.user_id = u.id
                ORDER BY f.created_at DESC
                LIMIT 10
            ");
            $recentActivity = $stmt->fetchAll(PDO::FETCH_ASSOC);

            Response::success([
                'overview' => [
                    'total_users' => (int)$totalUsers,
                    'total_files' => (int)$totalFiles,
                    'total_downloads' => (int)$totalDownloads,
                    'total_storage_mb' => $totalStorage,
                    'recent_users' => (int)$recentUsers,
                    'recent_uploads' => (int)$recentUploads
                ],
                'top_users' => $topUsers,
                'recent_activity' => $recentActivity
            ], 'Dashboard stats retrieved successfully');
        } catch (Exception $e) {
            error_log('Admin Dashboard Error: ' . $e->getMessage());
            Response::error('Failed to retrieve dashboard stats: ' . $e->getMessage(), 500);
        }
    }

    // Get all users with pagination
    public static function getAllUsers()
    {
        try {
            if (!isset($_SERVER['user_id']) || !isset($_SERVER['is_admin'])) {
                Response::error('Unauthorized access', 403);
                return;
            }

            $database = new Database();
            $db = $database->connect();

            if (!$db) {
                Response::error('Database connection failed', 500);
                return;
            }

            $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
            $limit = isset($_GET['limit']) ? max(1, min(100, (int)$_GET['limit'])) : 10;
            $offset = ($page - 1) * $limit;

            // Get total count
            $countStmt = $db->query("SELECT COUNT(*) as total FROM users");
            $totalUsers = (int)$countStmt->fetch(PDO::FETCH_ASSOC)['total'];

            // Get users with basic info
            $stmt = $db->prepare("
                SELECT 
                    id, 
                    name, 
                    email, 
                    college, 
                    role,
                    created_at
                FROM users
                ORDER BY created_at DESC
                LIMIT :limit OFFSET :offset
            ");

            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();

            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Add file stats for each user
            $fileCountStmt = $db->prepare("SELECT COUNT(*) as count FROM files WHERE user_id = ?");
            $downloadStmt = $db->prepare("SELECT COALESCE(SUM(download_count), 0) as total FROM files WHERE user_id = ?");

            foreach ($users as &$user) {
                // Get files count
                $fileCountStmt->execute([$user['id']]);
                $user['files_count'] = (int)$fileCountStmt->fetch(PDO::FETCH_ASSOC)['count'];

                // Get total downloads
                $downloadStmt->execute([$user['id']]);
                $user['total_downloads'] = (int)$downloadStmt->fetch(PDO::FETCH_ASSOC)['total'];
            }
            unset($user); // Break reference

            Response::success([
                'users' => $users,
                'pagination' => [
                    'current_page' => $page,
                    'total_pages' => $totalUsers > 0 ? (int)ceil($totalUsers / $limit) : 0,
                    'total_users' => $totalUsers,
                    'per_page' => $limit
                ]
            ], 'Users retrieved successfully');
        } catch (PDOException $e) {
            error_log('Admin GetAllUsers PDO Error: ' . $e->getMessage());
            Response::error('Database error: ' . $e->getMessage(), 500);
        } catch (Exception $e) {
            error_log('Admin GetAllUsers Error: ' . $e->getMessage());
            Response::error('Failed to retrieve users: ' . $e->getMessage(), 500);
        }
    }

    // Update user details
    public static function updateUser($userId)
    {
        try {
            if (!isset($_SERVER['user_id']) || !isset($_SERVER['is_admin'])) {
                Response::error('Unauthorized access', 403);
                return;
            }

            $data = json_decode(file_get_contents('php://input'), true);

            if (!$data) {
                Response::error('Invalid request data', 400);
                return;
            }

            $database = new Database();
            $db = $database->connect();

            if (!$db) {
                Response::error('Database connection failed', 500);
                return;
            }

            // Check if user exists
            $stmt = $db->prepare("SELECT id FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            if (!$stmt->fetch()) {
                Response::error('User not found', 404);
                return;
            }

            // Update user
            $updates = [];
            $params = [];

            if (isset($data['name'])) {
                $updates[] = "name = ?";
                $params[] = htmlspecialchars(strip_tags($data['name']));
            }

            if (isset($data['email'])) {
                if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                    Response::error('Invalid email format', 400);
                    return;
                }

                // Check if email already exists for another user
                $stmt = $db->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
                $stmt->execute([$data['email'], $userId]);
                if ($stmt->fetch()) {
                    Response::error('Email already taken', 409);
                    return;
                }

                $updates[] = "email = ?";
                $params[] = htmlspecialchars(strip_tags($data['email']));
            }

            if (isset($data['college'])) {
                $updates[] = "college = ?";
                $params[] = htmlspecialchars(strip_tags($data['college']));
            }

            if (empty($updates)) {
                Response::error('No fields to update', 400);
                return;
            }

            $params[] = $userId;
            $sql = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = ?";
            $stmt = $db->prepare($sql);
            $stmt->execute($params);

            // Get updated user data
            $stmt = $db->prepare("
                SELECT id, name, email, college, role, created_at 
                FROM users WHERE id = ?
            ");
            $stmt->execute([$userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            Response::success($user, 'User updated successfully');
        } catch (Exception $e) {
            error_log('Admin UpdateUser Error: ' . $e->getMessage());
            Response::error('Failed to update user: ' . $e->getMessage(), 500);
        }
    }

    // Delete user
    public static function deleteUser($userId)
    {
        try {
            if (!isset($_SERVER['user_id']) || !isset($_SERVER['is_admin'])) {
                Response::error('Unauthorized access', 403);
                return;
            }

            // Prevent admin from deleting themselves
            if ($_SERVER['user_id'] == $userId) {
                Response::error('Cannot delete your own account', 400);
                return;
            }

            $database = new Database();
            $db = $database->connect();

            if (!$db) {
                Response::error('Database connection failed', 500);
                return;
            }

            // Check if user exists and is not admin
            $stmt = $db->prepare("SELECT role FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $user = $stmt->fetch();

            if (!$user) {
                Response::error('User not found', 404);
                return;
            }

            if ($user['role'] === 'admin') {
                Response::error('Cannot delete admin users', 403);
                return;
            }

            // Get user's files to delete from filesystem
            $stmt = $db->prepare("SELECT file_path FROM files WHERE user_id = ?");
            $stmt->execute([$userId]);
            $files = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Delete files from filesystem
            foreach ($files as $file) {
                $filePath = BASE_PATH . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $file['file_path']);
                if (file_exists($filePath)) {
                    @unlink($filePath);
                }
            }

            // Delete user (cascades to files, downloads, pinned_files)
            $stmt = $db->prepare("DELETE FROM users WHERE id = ?");
            $stmt->execute([$userId]);

            Response::success(['message' => 'User deleted successfully']);
        } catch (Exception $e) {
            error_log('Admin DeleteUser Error: ' . $e->getMessage());
            Response::error('Failed to delete user: ' . $e->getMessage(), 500);
        }
    }

    // Get all files for admin management
    public static function getAllFilesAdmin()
    {
        try {
            if (!isset($_SERVER['user_id']) || !isset($_SERVER['is_admin'])) {
                Response::error('Unauthorized access', 403);
                return;
            }

            $database = new Database();
            $db = $database->connect();

            if (!$db) {
                Response::error('Database connection failed', 500);
                return;
            }

            $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
            $limit = isset($_GET['limit']) ? max(1, min(100, (int)$_GET['limit'])) : 20;
            $offset = ($page - 1) * $limit;

            // Get total count
            $countStmt = $db->query("SELECT COUNT(*) as total FROM files");
            $totalFiles = (int)$countStmt->fetch(PDO::FETCH_ASSOC)['total'];

            // Get files with user info
            $stmt = $db->prepare("
                SELECT f.*, u.name as uploaded_by, u.email as uploader_email
                FROM files f
                JOIN users u ON f.user_id = u.id
                ORDER BY f.created_at DESC
                LIMIT :limit OFFSET :offset
            ");

            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();

            $files = $stmt->fetchAll(PDO::FETCH_ASSOC);

            Response::success([
                'files' => $files,
                'pagination' => [
                    'current_page' => $page,
                    'total_pages' => $totalFiles > 0 ? (int)ceil($totalFiles / $limit) : 0,
                    'total_files' => $totalFiles,
                    'per_page' => $limit
                ]
            ], 'Files retrieved successfully');
        } catch (PDOException $e) {
            error_log('Admin GetAllFiles PDO Error: ' . $e->getMessage());
            Response::error('Database error: ' . $e->getMessage(), 500);
        } catch (Exception $e) {
            error_log('Admin GetAllFiles Error: ' . $e->getMessage());
            Response::error('Failed to retrieve files: ' . $e->getMessage(), 500);
        }
    }

    // Update any file (admin privilege)
    public static function updateFileAdmin($fileId)
    {
        try {
            if (!isset($_SERVER['user_id']) || !isset($_SERVER['is_admin'])) {
                Response::error('Unauthorized access', 403);
                return;
            }

            $data = json_decode(file_get_contents('php://input'), true);

            if (!$data) {
                Response::error('Invalid request data', 400);
                return;
            }

            $database = new Database();
            $db = $database->connect();

            if (!$db) {
                Response::error('Database connection failed', 500);
                return;
            }

            // Check if file exists
            $stmt = $db->prepare("SELECT id FROM files WHERE id = ?");
            $stmt->execute([$fileId]);
            if (!$stmt->fetch()) {
                Response::error('File not found', 404);
                return;
            }

            // Update file details
            $updates = [];
            $params = [];

            if (isset($data['title'])) {
                $updates[] = "title = ?";
                $params[] = htmlspecialchars(strip_tags($data['title']));
            }

            if (isset($data['description'])) {
                $updates[] = "description = ?";
                $params[] = htmlspecialchars(strip_tags($data['description']));
            }

            if (isset($data['category'])) {
                $updates[] = "category = ?";
                $params[] = htmlspecialchars(strip_tags($data['category']));
            }

            if (isset($data['subject'])) {
                $updates[] = "subject = ?";
                $params[] = htmlspecialchars(strip_tags($data['subject']));
            }

            if (isset($data['semester'])) {
                $updates[] = "semester = ?";
                $params[] = htmlspecialchars(strip_tags($data['semester']));
            }

            if (empty($updates)) {
                Response::error('No fields to update', 400);
                return;
            }

            $params[] = $fileId;
            $sql = "UPDATE files SET " . implode(', ', $updates) . " WHERE id = ?";
            $stmt = $db->prepare($sql);
            $stmt->execute($params);

            // Get updated file data
            $stmt = $db->prepare("
                SELECT f.*, u.name as uploaded_by, u.email as uploader_email
                FROM files f
                JOIN users u ON f.user_id = u.id
                WHERE f.id = ?
            ");
            $stmt->execute([$fileId]);
            $fileData = $stmt->fetch(PDO::FETCH_ASSOC);

            Response::success($fileData, 'File updated successfully');
        } catch (Exception $e) {
            error_log('Admin UpdateFile Error: ' . $e->getMessage());
            Response::error('Failed to update file: ' . $e->getMessage(), 500);
        }
    }

    // Delete any file (admin privilege)
    public static function deleteFileAdmin($fileId)
    {
        try {
            if (!isset($_SERVER['user_id']) || !isset($_SERVER['is_admin'])) {
                Response::error('Unauthorized access', 403);
                return;
            }

            $database = new Database();
            $db = $database->connect();

            if (!$db) {
                Response::error('Database connection failed', 500);
                return;
            }

            // Get file info
            $stmt = $db->prepare("SELECT file_path FROM files WHERE id = ?");
            $stmt->execute([$fileId]);
            $file = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$file) {
                Response::error('File not found', 404);
                return;
            }

            // Delete from filesystem
            $filePath = BASE_PATH . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $file['file_path']);
            if (file_exists($filePath)) {
                @unlink($filePath);
            }

            // Delete from database (cascades to pinned_files and downloads)
            $stmt = $db->prepare("DELETE FROM files WHERE id = ?");
            $stmt->execute([$fileId]);

            Response::success(['message' => 'File deleted successfully']);
        } catch (Exception $e) {
            error_log('Admin DeleteFile Error: ' . $e->getMessage());
            Response::error('Failed to delete file: ' . $e->getMessage(), 500);
        }
    }
}