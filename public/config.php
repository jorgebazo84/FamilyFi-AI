<?php
/**
 * FamilyFi-AI: Configuración Core V.1.0.3
 */

date_default_timezone_set('Europe/Madrid');

// Configuración de sesión para persistencia en WEB
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.cookie_httponly', 1);
    ini_set('session.use_only_cookies', 1);
    ini_set('session.cookie_lifetime', 0); // Hasta que se cierre el navegador (Web estándar)
    
    $isSecure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');

    session_set_cookie_params([
        'path' => '/',
        'secure' => $isSecure,
        'httponly' => true,
        'samesite' => $isSecure ? 'None' : 'Lax'
    ]);
    
    session_start();
}

if (!defined('DB_HOST')) {
    define('DB_HOST', 'localhost');
    define('DB_NAME', 'familyfi_db'); // Asegúrate que coincida con tu SQL
    define('DB_USER', 'family_user'); 
    define('DB_PASS', '1scp875^Z');     
}

function getDB() {
    static $db = null;
    if ($db === null) {
        try {
            $db = new PDO(
                "mysql:host=".DB_HOST.";dbname=".DB_NAME.";charset=utf8mb4", 
                DB_USER, 
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
                ]
            );
        } catch (PDOException $e) {
            http_response_code(500);
            die(json_encode(["error" => "Conexión DB fallida: " . $e->getMessage()]));
        }
    }
    return $db;
}
