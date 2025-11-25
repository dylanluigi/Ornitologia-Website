<?php
/**
 * Endpoint de aves con ubicación
 * Retorna aves agrupadas por parques con coordenadas geográficas
 */
declare(strict_types=1);

require_once __DIR__ . '/../config/conexion.php';

// Consultar aves asociadas a parques con coordenadas válidas
$sql = "SELECT
            a.id_ave,
            a.nombre_comun,
            a.nombre_cientifico,
            a.familia,
            a.endemica,
            a.categoria_conservacion,
            p.id_parque,
            p.nombre as nombre_parque,
            p.latitud,
            p.longitud
        FROM Aves a
        LEFT JOIN Parques_Jardines p ON a.id_parque = p.id_parque
        WHERE p.latitud IS NOT NULL AND p.longitud IS NOT NULL
        ORDER BY p.nombre ASC, a.nombre_comun ASC";

$res = $conn->query($sql);

if (!$res) {
    http_response_code(500);
    echo json_encode([
        "error" => "DB query failed",
        "details" => $conn->error
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Agrupar aves por parque para optimizar la respuesta
$parquesBirds = [];
while ($row = $res->fetch_assoc()) {
    $parqueId = (int)$row['id_parque'];

    // Inicializar parque si no existe en el array
    if (!isset($parquesBirds[$parqueId])) {
        $parquesBirds[$parqueId] = [
            'id_parque' => $parqueId,
            'nombre_parque' => $row['nombre_parque'],
            'lat' => (float)$row['latitud'],
            'lon' => (float)$row['longitud'],
            'aves' => []
        ];
    }

    // Agregar ave al parque correspondiente
    $parquesBirds[$parqueId]['aves'][] = [
        'id' => (int)$row['id_ave'],
        'nombre_comun' => $row['nombre_comun'],
        'nombre_cientifico' => $row['nombre_cientifico'],
        'familia' => $row['familia'],
        'endemica' => (bool)$row['endemica'],
        'categoria_conservacion' => $row['categoria_conservacion']
    ];
}

// Convertir array asociativo a array indexado para JSON
$locations = array_values($parquesBirds);

// Devolver respuesta con ubicaciones y aves agrupadas
echo json_encode([
    'status' => 'ok',
    'count' => count($locations),
    'locations' => $locations
], JSON_UNESCAPED_UNICODE);

$res->free();
$conn->close();
