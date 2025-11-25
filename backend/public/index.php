<?php
/**
 * Punto de entrada principal de la API
 * Enruta las peticiones a los archivos correspondientes según el parámetro 'route'
 */

// Configurar cabeceras de respuesta JSON y CORS
header('Content-Type: application/json; charset=utf-8');

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

// Obtener y sanitizar el parámetro de ruta para prevenir ataques de directory traversal
$route = $_GET['route'] ?? '';
$route = trim(str_replace(['..', '\\', '//'], '', $route));
$file  = __DIR__ . '/../routes/' . $route . '.php';

// Validar que se ha especificado una ruta
if ($route === '') {
    http_response_code(400);
    echo json_encode([
        "error" => "No route specified. Use: /backend/public/index.php?route=mapas or ?route=sobreNosotros"
    ]);
    exit;
}

// Verificar que el archivo de ruta existe
if (!is_file($file)) {
    http_response_code(404);
    echo json_encode(["error" => "Route '{$route}' not found"]);
    exit;
}

// Incluir el archivo de ruta correspondiente
require $file;
