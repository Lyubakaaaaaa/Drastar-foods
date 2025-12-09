<?php
header('Content-Type: application/json; charset=utf-8');

// Път до JSON файла
$jsonPath = __DIR__ . '/../../data/categories.json';

if ($_SERVER['REQUEST_METHOD'] === 'GET' && $_GET['action'] === 'load') {
    if (!file_exists($jsonPath)) {
        echo json_encode(["categories" => [], "subcategories" => [], "subsubcategories" => []]);
        exit;
    }
    echo file_get_contents($jsonPath);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $_GET['action'] === 'save') {

    $input = file_get_contents("php://input");
    if (!$input) {
        http_response_code(400);
        echo json_encode(["error" => "Empty request body"]);
        exit;
    }

    $data = json_decode($input, true);

    if (!$data || !isset($data['categories']) || !isset($data['subcategories']) ||  !isset($data['subsubcategories'])) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid JSON format"]);
        exit;
    }

    // Запис
    if (file_put_contents($jsonPath, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) === false) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to save JSON"]);
        exit;
    }

    echo json_encode(["success" => true]);
    exit;
}

http_response_code(404);
echo json_encode(["error" => "Invalid request"]);
exit;
?>
