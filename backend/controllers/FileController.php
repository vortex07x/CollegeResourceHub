<?php

require_once BASE_PATH . DIRECTORY_SEPARATOR . 'config' . DIRECTORY_SEPARATOR . 'database.php';
require_once BASE_PATH . DIRECTORY_SEPARATOR . 'utils' . DIRECTORY_SEPARATOR . 'Response.php';

class FileController
{

    public static function uploadFile()
    {
        try {
            // Check if user is authenticated
            if (!isset($_SERVER['user_id'])) {
                Response::error('User not authenticated', 401);
                return;
            }

            $userId = $_SERVER['user_id'];

            // Validate file upload
            if (!isset($_FILES['file'])) {
                Response::error('No file uploaded', 400);
                return;
            }

            $file = $_FILES['file'];

            // Check for upload errors
            if ($file['error'] !== UPLOAD_ERR_OK) {
                $errorMessage = 'File upload failed';
                switch ($file['error']) {
                    case UPLOAD_ERR_INI_SIZE:
                    case UPLOAD_ERR_FORM_SIZE:
                        $errorMessage = 'File is too large';
                        break;
                    case UPLOAD_ERR_NO_FILE:
                        $errorMessage = 'No file was uploaded';
                        break;
                }
                Response::error($errorMessage, 400);
                return;
            }

            // Get file extension from original filename
            $originalFileName = $file['name'];
            $fileExtension = strtolower(pathinfo($originalFileName, PATHINFO_EXTENSION));

            // Validate file type by extension
            $allowedExtensions = ['pdf', 'docx'];
            if (!in_array($fileExtension, $allowedExtensions)) {
                Response::error('Only PDF and DOCX files are allowed', 400);
                return;
            }

            // Additional MIME type validation
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $detectedMimeType = finfo_file($finfo, $file['tmp_name']);
            finfo_close($finfo);

            $allowedMimeTypes = [
                'application/pdf',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/zip',
                'application/octet-stream'
            ];

            if (in_array($detectedMimeType, ['application/zip', 'application/octet-stream'])) {
                if ($fileExtension !== 'docx') {
                    Response::error('Invalid file type. Only PDF and DOCX files are allowed', 400);
                    return;
                }
            } elseif (!in_array($detectedMimeType, $allowedMimeTypes)) {
                Response::error('Invalid file type detected. Only PDF and DOCX files are allowed', 400);
                return;
            }

            // Validate file size (10MB max)
            $maxSize = 10 * 1024 * 1024;
            if ($file['size'] > $maxSize) {
                Response::error('File size must be less than 10MB', 400);
                return;
            }

            // Get form data
            $title = isset($_POST['title']) ? trim($_POST['title']) : '';
            $description = isset($_POST['description']) ? trim($_POST['description']) : '';
            $category = isset($_POST['category']) ? trim($_POST['category']) : 'other';
            $subject = isset($_POST['subject']) ? trim($_POST['subject']) : '';
            $semester = isset($_POST['semester']) ? trim($_POST['semester']) : '';
            $positionX = isset($_POST['position_x']) ? floatval($_POST['position_x']) : 0;
            $positionY = isset($_POST['position_y']) ? floatval($_POST['position_y']) : 0;

            // Validate required fields
            if (empty($title)) {
                Response::error('Title is required', 400);
                return;
            }

            if (empty($subject)) {
                Response::error('Subject is required', 400);
                return;
            }

            // Generate unique filename
            $fileName = uniqid() . '_' . time() . '.' . $fileExtension;
            $uploadDir = BASE_PATH . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'files' . DIRECTORY_SEPARATOR;

            // Create directory if it doesn't exist
            if (!is_dir($uploadDir)) {
                if (!mkdir($uploadDir, 0777, true)) {
                    Response::error('Failed to create upload directory', 500);
                    return;
                }
            }

            $filePath = $uploadDir . $fileName;

            // Move uploaded file
            if (!move_uploaded_file($file['tmp_name'], $filePath)) {
                Response::error('Failed to save file', 500);
                return;
            }

            // Save to database
            $database = new Database();
            $db = $database->connect();

            if (!$db) {
                if (file_exists($filePath)) {
                    unlink($filePath);
                }
                Response::error('Database connection failed', 500);
                return;
            }

            $stmt = $db->prepare("
                INSERT INTO files (user_id, title, description, file_name, file_path, file_type, 
                                 category, subject, semester, file_size, position_x, position_y) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            $relativePath = 'uploads/files/' . $fileName;

            $result = $stmt->execute([
                $userId,
                $title,
                $description,
                $file['name'],
                $relativePath,
                $fileExtension,
                $category,
                $subject,
                $semester,
                $file['size'],
                $positionX,
                $positionY
            ]);

            if (!$result) {
                if (file_exists($filePath)) {
                    unlink($filePath);
                }
                Response::error('Failed to save file information', 500);
                return;
            }

            $fileId = $db->lastInsertId();

            // Get uploaded file data with user info
            $stmt = $db->prepare("
                SELECT f.*, u.name as uploaded_by, u.email as uploader_email
                FROM files f
                JOIN users u ON f.user_id = u.id
                WHERE f.id = ?
            ");
            $stmt->execute([$fileId]);
            $fileData = $stmt->fetch(PDO::FETCH_ASSOC);

            Response::success($fileData, 'File uploaded successfully', 201);
        } catch (Exception $e) {
            if (isset($filePath) && file_exists($filePath)) {
                unlink($filePath);
            }
            Response::error('Upload failed: ' . $e->getMessage(), 500);
        }
    }

    public static function getAllFiles()
    {
        try {
            $database = new Database();
            $db = $database->connect();

            if (!$db) {
                Response::error('Database connection failed', 500);
                return;
            }

            $stmt = $db->prepare("
                SELECT f.*, u.name as uploaded_by, u.email as uploader_email
                FROM files f
                JOIN users u ON f.user_id = u.id
                ORDER BY f.created_at DESC
            ");

            $stmt->execute();
            $files = $stmt->fetchAll(PDO::FETCH_ASSOC);

            Response::success($files, 'Files retrieved successfully');
        } catch (Exception $e) {
            Response::error('Failed to retrieve files: ' . $e->getMessage(), 500);
        }
    }

    public static function getMyFiles()
    {
        try {
            if (!isset($_SERVER['user_id'])) {
                Response::error('User not authenticated', 401);
                return;
            }

            $userId = $_SERVER['user_id'];
            $database = new Database();
            $db = $database->connect();

            if (!$db) {
                Response::error('Database connection failed', 500);
                return;
            }

            $stmt = $db->prepare("
                SELECT f.*, u.name as uploaded_by, u.email as uploader_email
                FROM files f
                JOIN users u ON f.user_id = u.id
                WHERE f.user_id = ?
                ORDER BY f.created_at DESC
            ");
            $stmt->execute([$userId]);
            $files = $stmt->fetchAll(PDO::FETCH_ASSOC);

            Response::success($files, 'User files retrieved successfully');
        } catch (Exception $e) {
            Response::error('Failed to retrieve files: ' . $e->getMessage(), 500);
        }
    }

    public static function getPinnedFiles()
    {
        try {
            if (!isset($_SERVER['user_id'])) {
                Response::error('User not authenticated', 401);
                return;
            }

            $userId = $_SERVER['user_id'];
            $database = new Database();
            $db = $database->connect();

            if (!$db) {
                Response::error('Database connection failed', 500);
                return;
            }

            $stmt = $db->prepare("
                SELECT f.*, u.name as uploaded_by, u.email as uploader_email, pf.pinned_at
                FROM pinned_files pf
                JOIN files f ON pf.file_id = f.id
                JOIN users u ON f.user_id = u.id
                WHERE pf.user_id = ?
                ORDER BY pf.pinned_at DESC
            ");
            $stmt->execute([$userId]);
            $files = $stmt->fetchAll(PDO::FETCH_ASSOC);

            Response::success($files, 'Pinned files retrieved successfully');
        } catch (Exception $e) {
            Response::error('Failed to retrieve pinned files: ' . $e->getMessage(), 500);
        }
    }

    public static function pinFile($fileId)
    {
        try {
            if (!isset($_SERVER['user_id'])) {
                Response::error('User not authenticated', 401);
                return;
            }

            $userId = $_SERVER['user_id'];
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

            // Check if already pinned
            $stmt = $db->prepare("SELECT id FROM pinned_files WHERE user_id = ? AND file_id = ?");
            $stmt->execute([$userId, $fileId]);
            if ($stmt->fetch()) {
                Response::error('File already pinned', 400);
                return;
            }

            // Pin the file
            $stmt = $db->prepare("INSERT INTO pinned_files (user_id, file_id) VALUES (?, ?)");
            $stmt->execute([$userId, $fileId]);

            Response::success(['message' => 'File pinned successfully'], 'File pinned successfully');
        } catch (Exception $e) {
            Response::error('Failed to pin file: ' . $e->getMessage(), 500);
        }
    }

    public static function unpinFile($fileId)
    {
        try {
            if (!isset($_SERVER['user_id'])) {
                Response::error('User not authenticated', 401);
                return;
            }

            $userId = $_SERVER['user_id'];
            $database = new Database();
            $db = $database->connect();

            if (!$db) {
                Response::error('Database connection failed', 500);
                return;
            }

            // Unpin the file
            $stmt = $db->prepare("DELETE FROM pinned_files WHERE user_id = ? AND file_id = ?");
            $stmt->execute([$userId, $fileId]);

            if ($stmt->rowCount() === 0) {
                Response::error('File was not pinned', 404);
                return;
            }

            Response::success(['message' => 'File unpinned successfully'], 'File unpinned successfully');
        } catch (Exception $e) {
            Response::error('Failed to unpin file: ' . $e->getMessage(), 500);
        }
    }

    public static function checkPinStatus($fileId)
    {
        try {
            if (!isset($_SERVER['user_id'])) {
                Response::error('User not authenticated', 401);
                return;
            }

            $userId = $_SERVER['user_id'];
            $database = new Database();
            $db = $database->connect();

            if (!$db) {
                Response::error('Database connection failed', 500);
                return;
            }

            $stmt = $db->prepare("SELECT id FROM pinned_files WHERE user_id = ? AND file_id = ?");
            $stmt->execute([$userId, $fileId]);
            $isPinned = $stmt->fetch() !== false;

            Response::success(['is_pinned' => $isPinned], 'Pin status retrieved');
        } catch (Exception $e) {
            Response::error('Failed to check pin status: ' . $e->getMessage(), 500);
        }
    }

    public static function updateFile($fileId)
    {
        try {
            if (!isset($_SERVER['user_id'])) {
                Response::error('User not authenticated', 401);
                return;
            }

            $userId = $_SERVER['user_id'];
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

            // Verify file belongs to user
            $stmt = $db->prepare("SELECT id FROM files WHERE id = ? AND user_id = ?");
            $stmt->execute([$fileId, $userId]);
            if (!$stmt->fetch()) {
                Response::error('File not found or unauthorized', 404);
                return;
            }

            // Update file details
            $title = isset($data['title']) ? trim($data['title']) : '';
            $description = isset($data['description']) ? trim($data['description']) : '';
            $category = isset($data['category']) ? trim($data['category']) : '';
            $subject = isset($data['subject']) ? trim($data['subject']) : '';
            $semester = isset($data['semester']) ? trim($data['semester']) : '';

            if (empty($title) || empty($subject)) {
                Response::error('Title and subject are required', 400);
                return;
            }

            $stmt = $db->prepare("
                UPDATE files 
                SET title = ?, description = ?, category = ?, subject = ?, semester = ?
                WHERE id = ? AND user_id = ?
            ");
            $stmt->execute([$title, $description, $category, $subject, $semester, $fileId, $userId]);

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
            Response::error('Failed to update file: ' . $e->getMessage(), 500);
        }
    }

    public static function downloadFile($fileId)
    {
        try {
            if (!isset($_SERVER['user_id'])) {
                Response::error('User not authenticated', 401);
                return;
            }

            $database = new Database();
            $db = $database->connect();

            if (!$db) {
                Response::error('Database connection failed', 500);
                return;
            }

            // Get file info
            $stmt = $db->prepare("SELECT * FROM files WHERE id = ?");
            $stmt->execute([$fileId]);
            $file = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$file) {
                Response::error('File not found', 404);
                return;
            }

            // Construct full file path
            $filePath = BASE_PATH . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $file['file_path']);

            if (!file_exists($filePath)) {
                Response::error('File does not exist on server', 404);
                return;
            }

            // Increment download count
            $stmt = $db->prepare("UPDATE files SET download_count = download_count + 1 WHERE id = ?");
            $stmt->execute([$fileId]);

            // Record download in downloads table
            $userId = $_SERVER['user_id'];
            $stmt = $db->prepare("INSERT INTO downloads (user_id, file_id) VALUES (?, ?)");
            $stmt->execute([$userId, $fileId]);

            // Set appropriate content type
            $contentType = 'application/octet-stream';
            if ($file['file_type'] === 'pdf') {
                $contentType = 'application/pdf';
            } elseif ($file['file_type'] === 'docx') {
                $contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            }

            // Set headers for file download
            header('Content-Type: ' . $contentType);
            header('Content-Disposition: attachment; filename="' . $file['file_name'] . '"');
            header('Content-Length: ' . filesize($filePath));
            header('Cache-Control: no-cache, must-revalidate');
            header('Pragma: public');

            // Clear output buffer
            ob_clean();
            flush();

            // Read and output file
            readfile($filePath);
            exit();
        } catch (Exception $e) {
            Response::error('Download failed: ' . $e->getMessage(), 500);
        }
    }

    public static function getFileInfo($fileId)
    {
        try {
            if (!isset($_SERVER['user_id'])) {
                Response::error('User not authenticated', 401);
                return;
            }

            $database = new Database();
            $db = $database->connect();

            if (!$db) {
                Response::error('Database connection failed', 500);
                return;
            }

            // Get detailed file info with user info
            $stmt = $db->prepare("
                SELECT f.*, u.name as uploaded_by, u.email as uploader_email, u.college as uploader_college
                FROM files f
                JOIN users u ON f.user_id = u.id
                WHERE f.id = ?
            ");
            $stmt->execute([$fileId]);
            $file = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$file) {
                Response::error('File not found', 404);
                return;
            }

            Response::success($file, 'File info retrieved successfully');
        } catch (Exception $e) {
            Response::error('Failed to get file info: ' . $e->getMessage(), 500);
        }
    }

    public static function updateFilePosition($fileId)
    {
        try {
            if (!isset($_SERVER['user_id'])) {
                Response::error('User not authenticated', 401);
                return;
            }

            $userId = $_SERVER['user_id'];
            $data = json_decode(file_get_contents('php://input'), true);

            if (!$data) {
                Response::error('Invalid request data', 400);
                return;
            }

            $positionX = isset($data['position_x']) ? floatval($data['position_x']) : 0;
            $positionY = isset($data['position_y']) ? floatval($data['position_y']) : 0;

            $database = new Database();
            $db = $database->connect();

            if (!$db) {
                Response::error('Database connection failed', 500);
                return;
            }

            // Verify file belongs to user
            $stmt = $db->prepare("SELECT id FROM files WHERE id = ? AND user_id = ?");
            $stmt->execute([$fileId, $userId]);

            if (!$stmt->fetch()) {
                Response::error('File not found or unauthorized', 404);
                return;
            }

            // Update position
            $stmt = $db->prepare("UPDATE files SET position_x = ?, position_y = ? WHERE id = ?");
            $stmt->execute([$positionX, $positionY, $fileId]);

            Response::success(['message' => 'Position updated successfully']);
        } catch (Exception $e) {
            Response::error('Failed to update position: ' . $e->getMessage(), 500);
        }
    }

    public static function deleteFile($fileId)
    {
        try {
            if (!isset($_SERVER['user_id'])) {
                Response::error('User not authenticated', 401);
                return;
            }

            $userId = $_SERVER['user_id'];
            $database = new Database();
            $db = $database->connect();

            if (!$db) {
                Response::error('Database connection failed', 500);
                return;
            }

            // Get file info
            $stmt = $db->prepare("SELECT file_path FROM files WHERE id = ? AND user_id = ?");
            $stmt->execute([$fileId, $userId]);
            $file = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$file) {
                Response::error('File not found or unauthorized', 404);
                return;
            }

            // Delete from filesystem
            $filePath = BASE_PATH . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $file['file_path']);
            if (file_exists($filePath)) {
                unlink($filePath);
            }

            // Delete from database (cascades to pinned_files and downloads)
            $stmt = $db->prepare("DELETE FROM files WHERE id = ?");
            $stmt->execute([$fileId]);

            Response::success(['message' => 'File deleted successfully']);
        } catch (Exception $e) {
            Response::error('Failed to delete file: ' . $e->getMessage(), 500);
        }
    }

    public static function getTopDownloaded()
    {
        try {
            $database = new Database();
            $db = $database->connect();

            if (!$db) {
                Response::error('Database connection failed', 500);
                return;
            }

            // Get top 3 most downloaded files
            $stmt = $db->prepare("
            SELECT f.*, u.name as uploaded_by, u.email as uploader_email
            FROM files f
            JOIN users u ON f.user_id = u.id
            WHERE f.download_count > 0
            ORDER BY f.download_count DESC
            LIMIT 3
        ");

            $stmt->execute();
            $files = $stmt->fetchAll(PDO::FETCH_ASSOC);

            Response::success($files, 'Top downloaded files retrieved successfully');
        } catch (Exception $e) {
            Response::error('Failed to retrieve top files: ' . $e->getMessage(), 500);
        }
    }

    public static function convertFile($fileId)
    {
        try {
            if (!isset($_SERVER['user_id'])) {
                Response::error('User not authenticated', 401);
                return;
            }

            $data = json_decode(file_get_contents('php://input'), true);

            if (!$data || !isset($data['conversion_type'])) {
                Response::error('Conversion type is required', 400);
                return;
            }

            $conversionType = $data['conversion_type'];

            $database = new Database();
            $db = $database->connect();

            if (!$db) {
                Response::error('Database connection failed', 500);
                return;
            }

            // Get file info
            $stmt = $db->prepare("SELECT * FROM files WHERE id = ?");
            $stmt->execute([$fileId]);
            $file = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$file) {
                Response::error('File not found', 404);
                return;
            }

            $sourcePath = BASE_PATH . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $file['file_path']);

            if (!file_exists($sourcePath)) {
                Response::error('Source file does not exist', 404);
                return;
            }

            // Validate conversion type
            if ($conversionType === 'pdf-to-docx' && $file['file_type'] !== 'pdf') {
                Response::error('Only PDF files can be converted to DOCX', 400);
                return;
            }

            if ($conversionType === 'docx-to-pdf' && $file['file_type'] !== 'docx') {
                Response::error('Only DOCX files can be converted to PDF', 400);
                return;
            }

            // Create temp directory if it doesn't exist
            $tempDir = BASE_PATH . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'temp' . DIRECTORY_SEPARATOR;
            if (!is_dir($tempDir)) {
                mkdir($tempDir, 0777, true);
            }

            // Perform conversion
            $result = null;
            if ($conversionType === 'docx-to-pdf') {
                $result = self::convertDocxToPdf($sourcePath, $tempDir, $file['title']);
            } elseif ($conversionType === 'pdf-to-docx') {
                $result = self::convertPdfToDocx($sourcePath, $tempDir, $file['title']);
            }

            if (!$result || !$result['success']) {
                Response::error($result['message'] ?? 'Conversion failed', 500);
                return;
            }

            Response::success($result['data'], 'File converted successfully');
        } catch (Exception $e) {
            Response::error('Conversion failed: ' . $e->getMessage(), 500);
        }
    }

    private static function convertDocxToPdf($sourcePath, $tempDir, $title)
    {
        try {
            // Check if required libraries are available
            if (!class_exists('PhpOffice\PhpWord\IOFactory')) {
                return [
                    'success' => false,
                    'message' => 'PhpWord library not installed. Please run: composer require phpoffice/phpword'
                ];
            }

            if (!class_exists('Dompdf\Dompdf')) {
                return [
                    'success' => false,
                    'message' => 'Dompdf library not installed. Please run: composer require dompdf/dompdf'
                ];
            }

            // Load DOCX file
            $phpWord = \PhpOffice\PhpWord\IOFactory::load($sourcePath);

            // Convert to HTML first
            $htmlWriter = \PhpOffice\PhpWord\IOFactory::createWriter($phpWord, 'HTML');
            $htmlPath = $tempDir . uniqid() . '.html';
            $htmlWriter->save($htmlPath);

            // Read HTML content
            $htmlContent = file_get_contents($htmlPath);

            // Convert HTML to PDF using Dompdf
            $dompdf = new \Dompdf\Dompdf();
            $dompdf->loadHtml($htmlContent);
            $dompdf->setPaper('A4', 'portrait');
            $dompdf->render();

            // Generate output filename
            $outputFileName = pathinfo($title, PATHINFO_FILENAME) . '_converted_' . time() . '.pdf';
            $outputPath = $tempDir . $outputFileName;

            // Save PDF
            file_put_contents($outputPath, $dompdf->output());

            // Clean up HTML file
            if (file_exists($htmlPath)) {
                unlink($htmlPath);
            }

            $relativePath = 'uploads/temp/' . $outputFileName;

            return [
                'success' => true,
                'data' => [
                    'temp_file_path' => $relativePath,
                    'converted_file_name' => $outputFileName,
                    'file_type' => 'pdf',
                    'file_size' => filesize($outputPath)
                ]
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'DOCX to PDF conversion failed: ' . $e->getMessage()
            ];
        }
    }

    private static function convertPdfToDocx($sourcePath, $tempDir, $title)
    {
        try {
            // PDF to DOCX conversion is complex and requires external tools
            // For production, you should use CloudConvert API or similar services

            // Check if pdf2docx Python library is available
            $pythonCheck = shell_exec('python --version 2>&1');

            if (strpos($pythonCheck, 'Python') === false) {
                return [
                    'success' => false,
                    'message' => 'Python is not installed. PDF to DOCX conversion requires Python with pdf2docx library.'
                ];
            }

            // Generate output filename
            $outputFileName = pathinfo($title, PATHINFO_FILENAME) . '_converted_' . time() . '.docx';
            $outputPath = $tempDir . $outputFileName;

            // Create Python script for conversion
            $pythonScript = <<<PYTHON
import sys
try:
    from pdf2docx import Converter
    
    pdf_file = sys.argv[1]
    docx_file = sys.argv[2]
    
    cv = Converter(pdf_file)
    cv.convert(docx_file)
    cv.close()
    
    print('SUCCESS')
except ImportError:
    print('ERROR: pdf2docx library not installed. Install with: pip install pdf2docx')
    sys.exit(1)
except Exception as e:
    print(f'ERROR: {str(e)}')
    sys.exit(1)
PYTHON;

            $scriptPath = $tempDir . 'convert_' . uniqid() . '.py';
            file_put_contents($scriptPath, $pythonScript);

            // Execute Python script
            $command = "python " . escapeshellarg($scriptPath) . " " . escapeshellarg($sourcePath) . " " . escapeshellarg($outputPath) . " 2>&1";
            $output = shell_exec($command);

            // Clean up Python script
            if (file_exists($scriptPath)) {
                unlink($scriptPath);
            }

            if (strpos($output, 'SUCCESS') === false || !file_exists($outputPath)) {
                return [
                    'success' => false,
                    'message' => 'PDF to DOCX conversion failed. Make sure pdf2docx is installed: pip install pdf2docx'
                ];
            }

            $relativePath = 'uploads/temp/' . $outputFileName;

            return [
                'success' => true,
                'data' => [
                    'temp_file_path' => $relativePath,
                    'converted_file_name' => $outputFileName,
                    'file_type' => 'docx',
                    'file_size' => filesize($outputPath)
                ]
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'PDF to DOCX conversion failed: ' . $e->getMessage()
            ];
        }
    }

    public static function downloadConvertedFile()
    {
        try {
            if (!isset($_SERVER['user_id'])) {
                Response::error('User not authenticated', 401);
                return;
            }

            if (!isset($_GET['file_path'])) {
                Response::error('File path is required', 400);
                return;
            }

            $relativePath = $_GET['file_path'];
            $filePath = BASE_PATH . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $relativePath);

            if (!file_exists($filePath)) {
                Response::error('File not found', 404);
                return;
            }

            // Validate that file is in temp directory
            $tempDir = BASE_PATH . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'temp';
            $realPath = realpath($filePath);
            $realTempDir = realpath($tempDir);

            if (strpos($realPath, $realTempDir) !== 0) {
                Response::error('Invalid file path', 403);
                return;
            }

            $fileName = basename($filePath);
            $fileExtension = pathinfo($fileName, PATHINFO_EXTENSION);

            // Set appropriate content type
            $contentType = 'application/octet-stream';
            if ($fileExtension === 'pdf') {
                $contentType = 'application/pdf';
            } elseif ($fileExtension === 'docx') {
                $contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            }

            header('Content-Type: ' . $contentType);
            header('Content-Disposition: attachment; filename="' . $fileName . '"');
            header('Content-Length: ' . filesize($filePath));
            header('Cache-Control: no-cache, must-revalidate');
            header('Pragma: public');

            ob_clean();
            flush();

            readfile($filePath);
            // DO NOT DELETE THE FILE HERE - Let frontend handle cleanup
            exit();
        } catch (Exception $e) {
            Response::error('Download failed: ' . $e->getMessage(), 500);
        }
    }

    public static function saveConvertedFile($originalFileId)
    {
        try {
            if (!isset($_SERVER['user_id'])) {
                Response::error('User not authenticated', 401);
                return;
            }

            $userId = $_SERVER['user_id'];
            $data = json_decode(file_get_contents('php://input'), true);

            if (!$data || !isset($data['temp_file_path'])) {
                Response::error('Temporary file path is required', 400);
                return;
            }

            $database = new Database();
            $db = $database->connect();

            if (!$db) {
                Response::error('Database connection failed', 500);
                return;
            }

            // Get original file info
            $stmt = $db->prepare("SELECT * FROM files WHERE id = ?");
            $stmt->execute([$originalFileId]);
            $originalFile = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$originalFile) {
                Response::error('Original file not found', 404);
                return;
            }

            // Get temp file path
            $tempPath = BASE_PATH . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $data['temp_file_path']);

            if (!file_exists($tempPath)) {
                Response::error('Converted file not found', 404);
                return;
            }

            // Move from temp to permanent storage
            $fileName = basename($tempPath);
            $fileExtension = pathinfo($fileName, PATHINFO_EXTENSION);
            $permanentDir = BASE_PATH . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'files' . DIRECTORY_SEPARATOR;

            if (!is_dir($permanentDir)) {
                mkdir($permanentDir, 0777, true);
            }

            $newFileName = uniqid() . '_' . time() . '.' . $fileExtension;
            $permanentPath = $permanentDir . $newFileName;

            // COPY file to permanent location (don't move, so temp file remains)
            if (!copy($tempPath, $permanentPath)) {
                Response::error('Failed to save converted file', 500);
                return;
            }

            // DO NOT DELETE temp file here - let frontend cleanup handle it

            // Create new file record
            $title = $originalFile['title'] . ' (Converted)';
            $description = 'Converted from ' . strtoupper($originalFile['file_type']) . ' to ' . strtoupper($fileExtension);

            $stmt = $db->prepare("
            INSERT INTO files (user_id, title, description, file_name, file_path, file_type, 
                             category, subject, semester, file_size, position_x, position_y) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

            $relativePath = 'uploads/files/' . $newFileName;

            $result = $stmt->execute([
                $userId,
                $title,
                $description,
                $fileName,
                $relativePath,
                $fileExtension,
                $originalFile['category'],
                $originalFile['subject'],
                $originalFile['semester'],
                filesize($permanentPath),
                $originalFile['position_x'] + 50,
                $originalFile['position_y'] + 50
            ]);

            if (!$result) {
                if (file_exists($permanentPath)) {
                    unlink($permanentPath);
                }
                Response::error('Failed to save file information', 500);
                return;
            }

            $fileId = $db->lastInsertId();

            // Get newly created file data
            $stmt = $db->prepare("
            SELECT f.*, u.name as uploaded_by, u.email as uploader_email
            FROM files f
            JOIN users u ON f.user_id = u.id
            WHERE f.id = ?
        ");
            $stmt->execute([$fileId]);
            $fileData = $stmt->fetch(PDO::FETCH_ASSOC);

            Response::success($fileData, 'Converted file saved successfully', 201);
        } catch (Exception $e) {
            Response::error('Failed to save converted file: ' . $e->getMessage(), 500);
        }
    }

    public static function cleanupTempFile()
    {
        try {
            if (!isset($_SERVER['user_id'])) {
                Response::error('User not authenticated', 401);
                return;
            }

            $data = json_decode(file_get_contents('php://input'), true);

            if (!$data || !isset($data['temp_file_path'])) {
                Response::error('Temporary file path is required', 400);
                return;
            }

            // Build the file path
            $relativePath = $data['temp_file_path'];
            $filePath = BASE_PATH . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $relativePath);

            // Security: Check it contains 'uploads/temp/' or 'uploads\temp\'
            if (strpos($relativePath, 'uploads/temp/') === false && strpos($relativePath, 'uploads\\temp\\') === false) {
                Response::error('Invalid file path - must be in temp directory', 403);
                return;
            }

            // If file doesn't exist, that's okay
            if (!file_exists($filePath)) {
                Response::success(['message' => 'File already deleted']);
                return;
            }

            // Try to delete it
            if (@unlink($filePath)) {
                Response::success(['message' => 'Temp file cleaned up successfully']);
            } else {
                // Don't error if deletion fails - might be permissions or already deleted
                Response::success(['message' => 'Cleanup attempted']);
            }
        } catch (Exception $e) {
            // Don't throw errors for cleanup failures
            Response::success(['message' => 'Cleanup attempted: ' . $e->getMessage()]);
        }
    }
}
