<?php

class Response {
    
    public static function success($data, $message = "Success", $code = 200) {
        http_response_code($code);
        echo json_encode([
            'success' => true,
            'message' => $message,
            'data' => $data
        ]);
        exit();
    }

    public static function error($message, $code = 400, $errors = null) {
        http_response_code($code);
        $response = [
            'success' => false,
            'message' => $message
        ];
        
        if ($errors) {
            $response['errors'] = $errors;
        }
        
        echo json_encode($response);
        exit();
    }

    public static function unauthorized($message = "Unauthorized access") {
        self::error($message, 401);
    }

    public static function forbidden($message = "Forbidden") {
        self::error($message, 403);
    }

    public static function notFound($message = "Resource not found") {
        self::error($message, 404);
    }
}