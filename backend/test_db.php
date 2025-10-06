<?php
require_once __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

echo "Testing PostgreSQL Connection...\n";
echo "Host: " . $_ENV['DB_HOST'] . "\n";
echo "Port: " . $_ENV['DB_PORT'] . "\n";
echo "Database: " . $_ENV['DB_NAME'] . "\n";
echo "User: " . $_ENV['DB_USER'] . "\n";

try {
    $conn = new PDO(
        "pgsql:host=" . $_ENV['DB_HOST'] . ";port=" . $_ENV['DB_PORT'] . ";dbname=" . $_ENV['DB_NAME'],
        $_ENV['DB_USER'],
        $_ENV['DB_PASS']
    );
    echo "\n✓ Connection successful!\n";
    
    $stmt = $conn->query("SELECT version()");
    $version = $stmt->fetch();
    echo "PostgreSQL version: " . $version['version'] . "\n";
    
} catch(PDOException $e) {
    echo "\n✗ Connection failed!\n";
    echo "Error: " . $e->getMessage() . "\n";
}
?>