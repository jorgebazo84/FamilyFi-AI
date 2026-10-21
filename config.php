<?php
/**
 * FamilyFi-AI: Config Core V.1.0.5-Stable
 */
date_default_timezone_set('Europe/Madrid');

if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.cookie_httponly', 1);
    ini_set('session.use_only_cookies', 1);
    ini_set('session.cookie_lifetime', 31536000); // 1 año para PWA
    
    $isSecure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || $_SERVER['SERVER_PORT'] == 443;

    session_set_cookie_params([
        'lifetime' => 31536000,
        'path' => '/',
        'secure' => $isSecure,
        'httponly' => true,
        'samesite' => $isSecure ? 'None' : 'Lax'
    ]);
    session_start();
}

if (!defined('DB_HOST')) {
    define('DB_HOST', 'localhost');
    define('DB_NAME', 'familyfi_db');
    define('DB_USER', 'family_user'); 
    define('DB_PASS', '1scp875^Z');     
}

function getDB() {
    static $db = null;
    if ($db === null) {
        try {
            $db = new PDO("mysql:host=".DB_HOST.";dbname=".DB_NAME.";charset=utf8mb4", DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]);
        } catch (PDOException $e) {
            header('Content-Type: application/json');
            http_response_code(500);
            die(json_encode(["error" => "DB_OFFLINE"]));
        }
    }
    return $db;
}
