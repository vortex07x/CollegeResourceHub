<?php

class Database {
    private $host;
    private $port;
    private $db_name;
    private $username;
    private $password;
    private $conn;

    public function __construct() {
        // Use the env() helper function if available, otherwise fallback
        if (function_exists('env')) {
            $this->host = env('DB_HOST');
            $this->port = env('DB_PORT', '5432');
            $this->db_name = env('DB_NAME');
            $this->username = env('DB_USER');
            $this->password = env('DB_PASS') ?? env('DB_PASSWORD');
        } else {
            // Manual fallback
            $this->host = $this->getEnvVar('DB_HOST');
            $this->port = $this->getEnvVar('DB_PORT', '5432');
            $this->db_name = $this->getEnvVar('DB_NAME');
            $this->username = $this->getEnvVar('DB_USER');
            $this->password = $this->getEnvVar('DB_PASS') ?? $this->getEnvVar('DB_PASSWORD');
        }
    }

    private function getEnvVar($key, $default = null) {
        if (isset($_ENV[$key]) && $_ENV[$key] !== '') {
            return $_ENV[$key];
        }
        
        $value = getenv($key);
        if ($value !== false && $value !== '') {
            return $value;
        }
        
        if (isset($_SERVER[$key]) && $_SERVER[$key] !== '') {
            return $_SERVER[$key];
        }
        
        return $default;
    }

    public function connect() {
        $this->conn = null;

        try {
            $dsn = "pgsql:host=" . $this->host . 
                   ";port=" . $this->port . 
                   ";dbname=" . $this->db_name;
            
            // Add SSL mode for Render and Supabase
            if (strpos($this->host, 'render.com') !== false || 
                strpos($this->host, 'supabase.com') !== false) {
                $dsn .= ";sslmode=require";
            }

            $this->conn = new PDO(
                $dsn,
                $this->username,
                $this->password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                    PDO::ATTR_PERSISTENT => false
                ]
            );
            
        } catch(PDOException $e) {
            error_log("Connection Error: " . $e->getMessage());
            throw new Exception("Database connection failed: " . $e->getMessage());
        }

        return $this->conn;
    }

    public function getConnection() {
        return $this->connect();
    }
}