<?php
// admin/api/user_auth.php
session_start();

header('Content-Type: application/json; charset=utf-8');

$usersFile = __DIR__ . '/../../data/users.json';

function loadUsers($file)
{
    if (!file_exists($file)) {
        return [];
    }
    $json = file_get_contents($file);
    $data = json_decode($json, true);
    if (!is_array($data)) {
        return [];
    }
    return $data;
}

function saveUsers($file, $users)
{
    $json = json_encode($users, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    file_put_contents($file, $json);
}

$action = $_GET['action'] ?? $_POST['action'] ?? null;

if ($action === 'me') {
    if (!empty($_SESSION['user_id'])) {
        $users = loadUsers($usersFile);
        foreach ($users as $u) {
            if ($u['id'] === $_SESSION['user_id']) {
                echo json_encode([
                    'loggedIn' => true,
                    'user' => [
                        'id' => $u['id'],
                        'email' => $u['email'],
                        'name' => $u['name']
                    ]
                ]);
                exit;
            }
        }
    }
    http_response_code(401);
    echo json_encode(['loggedIn' => false]);
    exit;
}

if ($action === 'logout') {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params['path'], $params['domain'],
            $params['secure'], $params['httponly']
        );
    }
    session_destroy();
    echo json_encode(['success' => true]);
    exit;
}

// Оттук надолу очакваме JSON body
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Невалидни данни.']);
    exit;
}

if ($action === 'register') {
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';
    $name = trim($data['name'] ?? '');

    if ($email === '' || $password === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Имейл и парола са задължителни.']);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Невалиден имейл.']);
        exit;
    }

    $users = loadUsers($usersFile);

    foreach ($users as $u) {
        if (mb_strtolower($u['email']) === mb_strtolower($email)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Този имейл вече е регистриран.']);
            exit;
        }
    }

    $nextId = 1;
    foreach ($users as $u) {
        if ($u['id'] >= $nextId) {
            $nextId = $u['id'] + 1;
        }
    }

    $user = [
        'id' => $nextId,
        'email' => $email,
        'name' => $name !== '' ? $name : $email,
        'password_hash' => password_hash($password, PASSWORD_DEFAULT),
        'created_at' => date('Y-m-d H:i:s')
    ];

    $users[] = $user;
    saveUsers($usersFile, $users);

    $_SESSION['user_id'] = $user['id'];

    echo json_encode([
        'success' => true,
        'user' => [
            'id' => $user['id'],
            'email' => $user['email'],
            'name' => $user['name']
        ]
    ]);
    exit;
}

if ($action === 'login') {
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';

    if ($email === '' || $password === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Имейл и парола са задължителни.']);
        exit;
    }

    $users = loadUsers($usersFile);

    foreach ($users as $u) {
        if (mb_strtolower($u['email']) === mb_strtolower($email)) {
            if (password_verify($password, $u['password_hash'])) {
                $_SESSION['user_id'] = $u['id'];
                echo json_encode([
                    'success' => true,
                    'user' => [
                        'id' => $u['id'],
                        'email' => $u['email'],
                        'name' => $u['name']
                    ]
                ]);
                exit;
            } else {
                http_response_code(401);
                echo json_encode(['success' => false, 'message' => 'Грешна парола.']);
                exit;
            }
        }
    }

    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Няма такъв профил.']);
    exit;
}

http_response_code(400);
echo json_encode(['success' => false, 'message' => 'Невалидно действие.']);
