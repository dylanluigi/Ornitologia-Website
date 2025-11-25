<?php
/**
 * Endpoint de densidad estacional de aves
 * Retorna datos de parques con densidad de especies por estación del año
 */
declare(strict_types=1);

require_once __DIR__ . '/../config/conexion.php';

// Consultar especies por parque agrupadas por época de reproducción y patrón migratorio
$sql = "SELECT
    p.id_parque,
    p.nombre as nombre_parque,
    p.latitud,
    p.longitud,
    a.epoca_reproduccion,
    a.patron_migratorio,
    COUNT(DISTINCT a.id_ave) as num_especies
FROM Parques_Jardines p
LEFT JOIN Aves a ON a.id_parque = p.id_parque
WHERE p.latitud IS NOT NULL AND p.longitud IS NOT NULL
GROUP BY p.id_parque, p.nombre, p.latitud, p.longitud, a.epoca_reproduccion, a.patron_migratorio
ORDER BY p.nombre, a.epoca_reproduccion";

$res = $conn->query($sql);

if (!$res) {
    http_response_code(500);
    echo json_encode([
        "error" => "DB query failed",
        "details" => $conn->error
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Inicializar estructura para organizar datos por parque y estación
$parkData = [];
$seasonalStats = [
    'Primavera' => 0,
    'Verano' => 0,
    'Otoño' => 0,
    'Invierno' => 0
];

// Procesar cada registro y calcular densidad estacional
while ($row = $res->fetch_assoc()) {
    $parkId = (int)$row['id_parque'];

    // Inicializar parque si no existe con contadores por estación
    if (!isset($parkData[$parkId])) {
        $parkData[$parkId] = [
            'id' => $parkId,
            'nombre' => $row['nombre_parque'],
            'lat' => (float)$row['latitud'],
            'lon' => (float)$row['longitud'],
            'seasons' => [
                'Primavera' => 0,
                'Verano' => 0,
                'Otoño' => 0,
                'Invierno' => 0
            ]
        ];
    }

    $epoca = $row['epoca_reproduccion'];
    $patron = $row['patron_migratorio'];
    $count = (int)$row['num_especies'];

    // Calcular densidad en Primavera según época de reproducción
    if ($epoca === 'Primavera' || $epoca === 'Todo el año') {
        $parkData[$parkId]['seasons']['Primavera'] += $count;
        $seasonalStats['Primavera'] += $count;
    }

    // Calcular densidad en Verano según época de reproducción
    if ($epoca === 'Verano' || $epoca === 'Todo el año') {
        $parkData[$parkId]['seasons']['Verano'] += $count;
        $seasonalStats['Verano'] += $count;
    }

    // Calcular densidad en Otoño según patrón migratorio
    if ($patron && (stripos($patron, 'Migrador') !== false || stripos($patron, 'estival') !== false)) {
        $parkData[$parkId]['seasons']['Otoño'] += (int)($count * 0.6); // Reducción por migración
    } else if ($patron && stripos($patron, 'Residente') !== false || $epoca === 'Todo el año') {
        $parkData[$parkId]['seasons']['Otoño'] += $count;
    }
    $seasonalStats['Otoño'] += $parkData[$parkId]['seasons']['Otoño'];

    // Calcular densidad en Invierno según patrón migratorio e invernada
    if ($patron && (stripos($patron, 'Residente') !== false || $epoca === 'Todo el año' ||
        stripos($patron, 'Hivernante') !== false || stripos($patron, 'Invernada') !== false)) {
        $parkData[$parkId]['seasons']['Invierno'] += $count;
        $seasonalStats['Invierno'] += $count;
    }
}

// Convertir array asociativo a indexado para JSON
$locations = array_values($parkData);

// Calcular intensidad máxima para normalización en frontend
$maxIntensity = 0;
foreach ($locations as $loc) {
    foreach ($loc['seasons'] as $intensity) {
        if ($intensity > $maxIntensity) {
            $maxIntensity = $intensity;
        }
    }
}

// Devolver respuesta con ubicaciones, intensidad máxima y estadísticas estacionales
echo json_encode([
    'status' => 'ok',
    'count' => count($locations),
    'max_intensity' => $maxIntensity,
    'seasonal_stats' => $seasonalStats,
    'locations' => $locations
], JSON_UNESCAPED_UNICODE);

$res->free();
$conn->close();
