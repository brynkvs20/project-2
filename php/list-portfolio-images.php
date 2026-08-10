<?php
// Clear any previous output or whitespace buffer
ob_clean();
header('Content-Type: application/json; charset=utf-8');

$year   = isset($_GET['year'])   ? trim($_GET['year'])   : '';
$folder = isset($_GET['folder']) ? trim($_GET['folder']) : '';

// Basic security sanitization against directory traversal
$year   = preg_replace('/[^a-zA-Z0-9_-]/', '', $year);
$folder = preg_replace('/[^\w\s-]/u', '', $folder);

if (empty($year) || empty($folder)) {
    echo json_encode(['count' => 0, 'images' => []]);
    exit;
}

// Navigate up one folder (from /php/ to root) then into /portfolio/
$targetDir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'portfolio' . DIRECTORY_SEPARATOR . $year . DIRECTORY_SEPARATOR . $folder;

$images = [];

if (is_dir($targetDir)) {
    $files = scandir($targetDir);
    $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

    foreach ($files as $file) {
        if ($file === '.' || $file === '..') {
            continue;
        }
        $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
        if (in_array($ext, $allowedExtensions)) {
            $images[] = $file;
        }
    }
}

echo json_encode([
    'count'  => count($images),
    'images' => array_values($images)
]);
exit;