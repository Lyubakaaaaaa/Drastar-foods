<?php
// api/upload-image.php

header('Content-Type: application/json; charset=utf-8');

// Папка за качване – спрямо този файл (api/)
// ../images/products = {project_root}/images/products
$uploadDir = __DIR__ . '/../images/products/';

// Уверяваме се, че папката съществува
if (!is_dir($uploadDir)) {
    if (!mkdir($uploadDir, 0777, true)) {
        echo json_encode([
            'success' => false,
            'message' => 'Не мога да създам директория за снимки.'
        ]);
        exit;
    }
}

if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode([
        'success' => false,
        'message' => 'Няма валиден файл за качване.'
    ]);
    exit;
}

$file = $_FILES['image'];

// малко базова валидация
$allowedExt = ['jpg', 'jpeg', 'png', 'webp'];
$maxSize = 5 * 1024 * 1024; // 5MB

$originalName = $file['name'];
$fileSize = $file['size'];

$ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

if (!in_array($ext, $allowedExt)) {
    echo json_encode([
        'success' => false,
        'message' => 'Невалиден тип файл. Разрешени: jpg, jpeg, png, webp.'
    ]);
    exit;
}

if ($fileSize > $maxSize) {
    echo json_encode([
        'success' => false,
        'message' => 'Файлът е твърде голям. Максимум 5MB.'
    ]);
    exit;
}

// генерираме уникално име
$baseName = pathinfo($originalName, PATHINFO_FILENAME);
$baseName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $baseName);
$newFileName = $baseName . '_' . time() . '.' . $ext;

$targetPath = $uploadDir . $newFileName;

// преместваме
if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
    echo json_encode([
        'success' => false,
        'message' => 'Грешка при записване на файла на сървъра.'
    ]);
    exit;
}

// Път спрямо web root-а (това ще влиза в products.json)
$webPath = 'images/products/' . $newFileName;

echo json_encode([
    'success' => true,
    'path' => $webPath
]);
