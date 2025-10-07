<?php

// Add this at the very top
require_once __DIR__ . '/../vendor/autoload.php';

use Cloudinary\Configuration\Configuration;
use Cloudinary\Api\Upload\UploadApi;

class CloudinaryConfig {
    private static $instance = null;
    private $cloudinary;

    private function __construct() {
        Configuration::instance([
            'cloud' => [
                'cloud_name' => $_ENV['CLOUDINARY_CLOUD_NAME'] ?? getenv('CLOUDINARY_CLOUD_NAME'),
                'api_key' => $_ENV['CLOUDINARY_API_KEY'] ?? getenv('CLOUDINARY_API_KEY'),
                'api_secret' => $_ENV['CLOUDINARY_API_SECRET'] ?? getenv('CLOUDINARY_API_SECRET')
            ],
            'url' => [
                'secure' => true
            ]
        ]);
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function uploadFile($filePath, $options = []) {
        try {
            $uploadApi = new UploadApi();
            
            $defaultOptions = [
                'folder' => 'college_resources/files',
                'resource_type' => 'raw',
                'use_filename' => true,
                'unique_filename' => true
            ];
            
            $mergedOptions = array_merge($defaultOptions, $options);
            
            $result = $uploadApi->upload($filePath, $mergedOptions);
            
            return [
                'success' => true,
                'public_id' => $result['public_id'],
                'secure_url' => $result['secure_url'],
                'format' => $result['format'] ?? 'unknown',
                'bytes' => $result['bytes'],
                'resource_type' => $result['resource_type']
            ];
        } catch (Exception $e) {
            error_log('Cloudinary upload error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    public function deleteFile($publicId) {
        try {
            $uploadApi = new UploadApi();
            $result = $uploadApi->destroy($publicId, ['resource_type' => 'raw']);
            
            return [
                'success' => true,
                'result' => $result['result']
            ];
        } catch (Exception $e) {
            error_log('Cloudinary delete error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    public function getFileUrl($publicId) {
        try {
            // For raw files, we need to construct the URL properly
            $cloudName = $_ENV['CLOUDINARY_CLOUD_NAME'] ?? getenv('CLOUDINARY_CLOUD_NAME');
            return "https://res.cloudinary.com/{$cloudName}/raw/upload/{$publicId}";
        } catch (Exception $e) {
            error_log('Cloudinary URL generation error: ' . $e->getMessage());
            return null;
        }
    }
}