<?php
/**
 * Endpoint de mapas y estadísticas
 * Retorna datos de parques con coordenadas y conteos agregados de aves
 */
require_once __DIR__ . '/../config/conexion.php';

/**
 * Normaliza la ruta de imagen de un lugar
 * Convierte rutas de BD a rutas absolutas del frontend
 *
 * @param string|null $raw Ruta desde la base de datos
 * @return string|null Ruta normalizada o null
 */
function normalize_lugar_img(?string $raw): ?string {
    if (!$raw) {
        return null;
    }
    $base = basename($raw);
    return "/img/Lugares/" . $base;
}

// Consultar todos los parques con sus coordenadas geográficas
$sql = "SELECT id_parque, nombre, ubicacion, latitud, longitud, url, imagen
        FROM Parques_Jardines
        ORDER BY nombre ASC";
$res = $conn->query($sql);

if (!$res) {
    http_response_code(500);
    echo json_encode(["error" => "DB query failed", "details" => $conn->error]);
    exit;
}

// Construir array de parques con coordenadas para mapas
$parques = [];
while ($row = $res->fetch_assoc()) {
    $parques[] = [
        "id"        => (int)$row["id_parque"],
        "nombre"    => $row["nombre"],
        "ubicacion" => $row["ubicacion"],
        "lat"       => $row["latitud"] !== null ? (float)$row["latitud"] : null,
        "lon"       => $row["longitud"] !== null ? (float)$row["longitud"] : null,
        "url"       => $row["url"],
        "imagen"    => normalize_lugar_img($row["imagen"])
    ];
}

// Obtener conteos de aves por época de reproducción
$sql_counts = "SELECT COALESCE(epoca_reproduccion, 'Desconocido') AS epoca, COUNT(*) AS total FROM Aves GROUP BY epoca_reproduccion";
$res2 = $conn->query($sql_counts);
$epoca_counts = [];
if ($res2) {
    while ($r = $res2->fetch_assoc()) {
        $epoca_counts[$r['epoca']] = (int)$r['total'];
    }
}

// Obtener conteos de aves por categoría de conservación
$sql_cat = "SELECT COALESCE(categoria_conservacion, 'Desconocido') AS categoria, COUNT(*) AS total FROM Aves GROUP BY categoria_conservacion";
$res3 = $conn->query($sql_cat);
$categoria_counts = [];
if ($res3) {
    while ($r = $res3->fetch_assoc()) {
        $categoria_counts[$r['categoria']] = (int)$r['total'];
    }
}

// Obtener conteos de aves por familia taxonómica
$sql_fam = "SELECT COALESCE(familia, 'Desconocida') AS familia, COUNT(*) AS total FROM Aves GROUP BY familia ORDER BY total DESC";
$res4 = $conn->query($sql_fam);
$familia_counts = [];
if ($res4) {
    while ($r = $res4->fetch_assoc()) {
        $familia_counts[$r['familia']] = (int)$r['total'];
    }
}

// Devolver respuesta con parques y estadísticas agregadas
echo json_encode([
    "status"  => "ok",
    "count"   => count($parques),
    "parques" => $parques,
    "epoca_counts" => $epoca_counts,
    "categoria_counts" => $categoria_counts
    ,"familia_counts" => $familia_counts
], JSON_UNESCAPED_UNICODE);
