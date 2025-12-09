<?php
// admin/health.php
header("Content-Type: application/json; charset=utf-8");

$baseDir       = realpath(__DIR__ . "/..");          // .../drastar_foods
$dataDir       = $baseDir . "/data";                 // .../drastar_foods/data
$productsFile  = $dataDir . "/products.json";
$saveProductsFile = __DIR__ . "/save-products.php";

$checks = [];

// PHP версия
$checks['php_version'] = PHP_VERSION;

// 1) data/
$checks['data_dir_exists']   = is_dir($dataDir);
$checks['data_dir_writable'] = is_dir($dataDir) && is_writable($dataDir);

// 2) products.json
$checks['products_exists']   = file_exists($productsFile);
$checks['products_readable'] = is_readable($productsFile);

// 3) Валиден JSON ли е + брой продукти
$productsJsonValid = false;
$productsCount     = null;

if (file_exists($productsFile) && is_readable($productsFile)) {
    $raw = file_get_contents($productsFile);
    $decoded = json_decode($raw, true);

    if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
        $productsJsonValid = true;
        $productsCount = count($decoded);
    }
}

$checks['products_json_valid'] = $productsJsonValid;
$checks['products_count']      = $productsCount;

// 4) Може ли да се пише в products.json
$productsWritable = false;
if (file_exists($productsFile)) {
    $productsWritable = is_writable($productsFile);
}
$checks['products_writable'] = $productsWritable;

// 5) Тест за запис във data/
$writeTestOk = false;
if (is_dir($dataDir) && is_writable($dataDir)) {
    $testFile = $dataDir . "/__health_test_" . uniqid() . ".tmp";
    $bytes = @file_put_contents($testFile, "ok");
    if ($bytes !== false) {
        $writeTestOk = true;
        @unlink($testFile);
    }
}
$checks['data_write_test'] = $writeTestOk;

// 6) save-products.php
$checks['save_products_exists']   = file_exists($saveProductsFile);
$checks['save_products_readable'] = is_readable($saveProductsFile);

// Общо състояние
$overallOk =
    $checks['data_dir_exists'] &&
    $checks['data_dir_writable'] &&
    $checks['products_exists'] &&
    $checks['products_readable'] &&
    $checks['products_json_valid'] &&
    $checks['products_writable'] &&
    $checks['data_write_test'] &&
    $checks['save_products_exists'] &&
    $checks['save_products_readable'];

$response = [
    "ok"     => $overallOk,
    "checks" => $checks,
];

echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
