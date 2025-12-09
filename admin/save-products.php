<?php
// admin/save-products.php

// Разрешаваме само POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit;
}

// Четем суровото тяло (JSON от fetch)
$raw = file_get_contents("php://input");
if (!$raw) {
    http_response_code(400);
    echo json_encode(["error" => "Empty body"]);
    exit;
}

// Декодираме JSON за всеки случай (и да проверим, че е валиден)
$data = json_decode($raw, true);
if ($data === null || !is_array($data)) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid JSON"]);
    exit;
}

// Път до products.json (нагоре едно ниво от /admin)
$productsFile = __DIR__ . "/../data/products.json";

// Записваме красиво с pretty print
$encoded = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
if ($encoded === false) {
    http_response_code(500);
    echo json_encode(["error" => "Encoding error"]);
    exit;
}

if (file_put_contents($productsFile, $encoded) === false) {
    http_response_code(500);
    echo json_encode(["error" => "Cannot write products.json"]);
    exit;
}

header("Content-Type: application/json; charset=utf-8");
echo json_encode(["ok" => true]);
