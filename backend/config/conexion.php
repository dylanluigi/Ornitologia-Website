<?php
/**
 * Configuración de la conexión a la base de datos
 * Lee variables de entorno con valores por defecto como fallback
 */

// Obtener credenciales de conexión desde variables de entorno o usar valores por defecto
$DB_HOST = getenv('DB_HOST') ?: '127.0.0.1';
$DB_USER = getenv('DB_USER') ?: 'root';
$DB_PASS = getenv('DB_PASS') ?: 'adminadmin';
$DB_NAME = getenv('DB_NAME') ?: 'aves_mallorca';

// Establecer conexión con la base de datos
$conn = @new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);
if ($conn->connect_error) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        "error" => "Database connection failed",
        "details" => $conn->connect_error
    ]);
    exit;
}

// Configurar charset UTF-8 para soportar caracteres especiales
$conn->set_charset("utf8mb4");
