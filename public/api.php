<?php
/**
 * FamilyFi-AI API Engine V.1.0.3 - WEB CORE
 */
ob_start(); 
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Manejo de CORS dinámico para permitir credenciales de sesión
$origin = $_SERVER['HTTP_ORIGIN'] ?? null;
if ($origin) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: *");
}

header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE, PUT");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Cookie, Origin, Accept");
header("Vary: Origin");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    ob_end_clean();
    exit;
}

header("Content-Type: application/json; charset=UTF-8");

require_once 'config.php';

$action = $_GET['action'] ?? 'ping';
$response = ["status" => "error", "message" => "UNKNOWN_ACTION"];

try {
    $db = getDB();
    if ($action === 'ping') {
        $response = ["status" => "ok", "version" => "V.1.0.3", "session" => session_id()];
    }
    elseif ($action === 'register') {
        $data = json_decode(file_get_contents("php://input"), true);
        $email = strtolower(trim($data['email'] ?? ''));
        if (empty($email) || empty($data['password'])) throw new Exception("MISSING_FIELDS");
        
        $stmt = $db->prepare("INSERT INTO users (email, password) VALUES (?, ?)");
        $stmt->execute([$email, password_hash($data['password'], PASSWORD_DEFAULT)]);
        
        $_SESSION['user_email'] = $email;
        $response = ["status" => "ok", "email" => $email];
    }
    elseif ($action === 'login') {
        $data = json_decode(file_get_contents("php://input"), true);
        $email = strtolower(trim($data['email'] ?? ''));
        
        $stmt = $db->prepare("SELECT password FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if ($user && password_verify($data['password'], $user['password'])) {
            $_SESSION['user_email'] = $email;
            $response = ["status" => "ok", "email" => $email];
        } else {
            http_response_code(401);
            $response = ["error" => "INVALID_AUTH"];
        }
    }
    elseif ($action === 'check_auth') {
        $response = [
            "authenticated" => isset($_SESSION['user_email']), 
            "email" => $_SESSION['user_email'] ?? null
        ];
    }
    elseif ($action === 'logout') {
        session_destroy();
        setcookie(session_name(), '', time() - 3600, '/');
        $response = ["status" => "ok"];
    }
    else {
        if (!isset($_SESSION['user_email'])) {
            http_response_code(401);
            $response = ["error" => "UNAUTHORIZED"];
        } else {
            $u = $_SESSION['user_email'];
            switch($action) {
                case 'get_data':
                    $stmt = $db->prepare("SELECT * FROM transactions WHERE user_email = ? ORDER BY date DESC");
                    $stmt->execute([$u]);
                    $txs = $stmt->fetchAll();
                    
                    $stmt = $db->prepare("SELECT data FROM settings WHERE user_email = ?");
                    $stmt->execute([$u]);
                    $stg = $stmt->fetch();
                    
                    $response = [
                        "transactions" => $txs, 
                        "settings" => $stg ? json_decode($stg['data']) : null
                    ];
                    break;
                    
                case 'save_transaction':
                    $d = json_decode(file_get_contents("php://input"), true);
                    $stmt = $db->prepare("INSERT INTO transactions (id, user_email, amount, description, notes, date, type, category, account, taxAmount, isDeductible) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE amount=VALUES(amount), description=VALUES(description), notes=VALUES(notes), date=VALUES(date), type=VALUES(type), category=VALUES(category), account=VALUES(account), taxAmount=VALUES(taxAmount), isDeductible=VALUES(isDeductible)");
                    $stmt->execute([$d['id'], $u, $d['amount'], $d['description'], $d['notes'] ?? '', $d['date'], $d['type'], $d['category'], $d['account'] ?? 'Principal', $d['taxAmount'] ?? 0, $d['isDeductible'] ? 1 : 0]);
                    $response = ["status" => "ok"];
                    break;
                    
                case 'save_settings':
                    $d = file_get_contents("php://input");
                    $stmt = $db->prepare("INSERT INTO settings (user_email, data) VALUES (?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data)");
                    $stmt->execute([$u, $d]);
                    $response = ["status" => "ok"];
                    break;
                    
                case 'delete_transaction':
                    $id = $_GET['id'] ?? '';
                    $stmt = $db->prepare("DELETE FROM transactions WHERE id = ? AND user_email = ?");
                    $stmt->execute([$id, $u]);
                    $response = ["status" => "ok"];
                    break;
            }
        }
    }
} catch (Exception $e) {
    http_response_code(500);
    $response = ["error" => $e->getMessage()];
}

ob_end_clean();
echo json_encode($response);
exit;