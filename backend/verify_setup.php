<?php
/**
 * Setup Verification Script
 * Visit: http://localhost/backend/verify_setup.php
 * This will check if your backend is properly configured
 */

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Backend Setup Verification</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 8px; max-width: 800px; margin: 0 auto; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 3px solid #4CAF50; padding-bottom: 10px; }
        .check { margin: 15px 0; padding: 15px; border-radius: 5px; }
        .success { background: #d4edda; border-left: 4px solid #28a745; }
        .error { background: #f8d7da; border-left: 4px solid #dc3545; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; }
        .status { font-weight: bold; }
        pre { background: #f4f4f4; padding: 10px; border-radius: 4px; overflow-x: auto; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 Backend Setup Verification</h1>
        
        <?php
        $checks = [];
        
        // Check 1: PHP Version
        $phpVersion = phpversion();
        $checks[] = [
            'name' => 'PHP Version',
            'status' => version_compare($phpVersion, '7.4.0', '>='),
            'message' => "PHP $phpVersion",
            'help' => 'PHP 7.4 or higher required'
        ];
        
        // Check 2: Composer autoload
        $composerExists = file_exists(__DIR__ . '/vendor/autoload.php');
        $checks[] = [
            'name' => 'Composer Dependencies',
            'status' => $composerExists,
            'message' => $composerExists ? 'Installed' : 'Not installed',
            'help' => 'Run: composer install'
        ];
        
        // Check 3: .env file
        $envExists = file_exists(__DIR__ . '/.env');
        $checks[] = [
            'name' => '.env File',
            'status' => $envExists,
            'message' => $envExists ? 'Found' : 'Not found',
            'help' => 'Create .env file with database credentials'
        ];
        
        // Check 4: Load environment variables
        $envLoaded = false;
        if ($composerExists && $envExists) {
            try {
                require_once __DIR__ . '/vendor/autoload.php';
                $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
                $dotenv->load();
                $envLoaded = true;
            } catch (Exception $e) {
                $envLoaded = false;
            }
        }
        $checks[] = [
            'name' => 'Environment Variables',
            'status' => $envLoaded,
            'message' => $envLoaded ? 'Loaded successfully' : 'Failed to load',
            'help' => 'Check .env file format'
        ];
        
        // Check 5: Database connection
        $dbConnected = false;
        $dbMessage = '';
        if ($envLoaded) {
            try {
                $host = $_ENV['DB_HOST'] ?? 'localhost';
                $port = $_ENV['DB_PORT'] ?? '3306';
                $dbname = $_ENV['DB_NAME'] ?? '';
                $user = $_ENV['DB_USER'] ?? 'root';
                $pass = $_ENV['DB_PASS'] ?? '';
                
                $dsn = "mysql:host=$host;port=$port;dbname=$dbname";
                $pdo = new PDO($dsn, $user, $pass);
                $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                $dbConnected = true;
                $dbMessage = "Connected to $dbname on port $port";
            } catch (PDOException $e) {
                $dbMessage = "Error: " . $e->getMessage();
            }
        } else {
            $dbMessage = "Cannot test - environment not loaded";
        }
        $checks[] = [
            'name' => 'Database Connection',
            'status' => $dbConnected,
            'message' => $dbMessage,
            'help' => 'Check database credentials in .env'
        ];
        
        // Check 6: Required directories
        $dirs = ['config', 'controllers', 'middleware', 'models', 'routes', 'utils', 'uploads'];
        $dirsExist = true;
        $missingDirs = [];
        foreach ($dirs as $dir) {
            if (!is_dir(__DIR__ . '/' . $dir)) {
                $dirsExist = false;
                $missingDirs[] = $dir;
            }
        }
        $checks[] = [
            'name' => 'Required Directories',
            'status' => $dirsExist,
            'message' => $dirsExist ? 'All directories exist' : 'Missing: ' . implode(', ', $missingDirs),
            'help' => 'Create missing directories'
        ];
        
        // Check 7: Required files
        $files = [
            'index.php',
            'config/database.php',
            'config/jwt.php',
            'controllers/AuthController.php',
            'middleware/AuthMiddleware.php',
            'models/User.php',
            'routes/api.php',
            'utils/Response.php'
        ];
        $filesExist = true;
        $missingFiles = [];
        foreach ($files as $file) {
            if (!file_exists(__DIR__ . '/' . $file)) {
                $filesExist = false;
                $missingFiles[] = $file;
            }
        }
        $checks[] = [
            'name' => 'Required Files',
            'status' => $filesExist,
            'message' => $filesExist ? 'All files exist' : 'Missing files',
            'help' => $filesExist ? '' : implode(', ', $missingFiles)
        ];
        
        // Check 8: Database tables
        $tablesExist = false;
        $tablesMessage = '';
        if ($dbConnected) {
            try {
                $stmt = $pdo->query("SHOW TABLES");
                $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
                $required = ['users', 'files', 'downloads'];
                $missing = array_diff($required, $tables);
                $tablesExist = empty($missing);
                $tablesMessage = $tablesExist ? 'All tables exist' : 'Missing: ' . implode(', ', $missing);
            } catch (PDOException $e) {
                $tablesMessage = "Error checking tables";
            }
        } else {
            $tablesMessage = "Cannot check - no database connection";
        }
        $checks[] = [
            'name' => 'Database Tables',
            'status' => $tablesExist,
            'message' => $tablesMessage,
            'help' => 'Run database_schema.sql'
        ];
        
        // Display results
        $allPassed = true;
        foreach ($checks as $check) {
            if (!$check['status']) $allPassed = false;
            $class = $check['status'] ? 'success' : 'error';
            $icon = $check['status'] ? '✅' : '❌';
            
            echo "<div class='check $class'>";
            echo "<div class='status'>$icon {$check['name']}</div>";
            echo "<div>{$check['message']}</div>";
            if (!$check['status'] && !empty($check['help'])) {
                echo "<div><small>💡 {$check['help']}</small></div>";
            }
            echo "</div>";
        }
        
        // Overall status
        echo "<div class='check " . ($allPassed ? 'success' : 'warning') . "'>";
        echo "<h3>" . ($allPassed ? '🎉 All checks passed!' : '⚠️ Some checks failed') . "</h3>";
        if ($allPassed) {
            echo "<p>Your backend is properly configured and ready to use!</p>";
            echo "<p><strong>Next step:</strong> Test your API endpoints using Thunder Client</p>";
        } else {
            echo "<p>Please fix the issues above and refresh this page.</p>";
        }
        echo "</div>";
        
        // Show configuration
        if ($envLoaded) {
            echo "<div class='check warning'>";
            echo "<h3>📋 Current Configuration</h3>";
            echo "<pre>";
            echo "Database Host: " . ($_ENV['DB_HOST'] ?? 'not set') . "\n";
            echo "Database Port: " . ($_ENV['DB_PORT'] ?? 'not set') . "\n";
            echo "Database Name: " . ($_ENV['DB_NAME'] ?? 'not set') . "\n";
            echo "Database User: " . ($_ENV['DB_USER'] ?? 'not set') . "\n";
            echo "JWT Secret: " . (isset($_ENV['JWT_SECRET']) ? '[HIDDEN]' : 'not set') . "\n";
            echo "JWT Expiry: " . ($_ENV['JWT_EXPIRY'] ?? 'not set') . " seconds\n";
            echo "</pre>";
            echo "</div>";
        }
        ?>
        
        <div class="footer">
            <p><strong>Delete this file after verification for security!</strong></p>
            <p>File location: <code><?php echo __FILE__; ?></code></p>
        </div>
    </div>
</body>
</html>