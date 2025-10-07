<?php
require_once __DIR__ . '/config/database.php';

try {
    $database = new Database();
    $pdo = $database->getConnection();
    
    echo "Connected to database successfully!\n";
    echo "Running migrations...\n\n";
    
    // Check if database_schema.sql exists
    $schemaFile = __DIR__ . '/database_schema.sql';
    if (!file_exists($schemaFile)) {
        throw new Exception("database_schema.sql file not found!");
    }
    
    // Read SQL file
    $sql = file_get_contents($schemaFile);
    
    // Remove comments
    $sql = preg_replace('/--.*$/m', '', $sql);
    
    // Execute the entire SQL file as one statement
    // This preserves functions, triggers, and complex statements
    try {
        $pdo->exec($sql);
        echo "✓ All migrations executed successfully!\n";
        echo "\n==========================================\n";
        echo "Migration completed successfully!\n";
        echo "==========================================\n";
    } catch (PDOException $e) {
        echo "✗ Error executing migrations: " . $e->getMessage() . "\n";
        throw $e;
    }
    
} catch (Exception $e) {
    echo "✗ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}