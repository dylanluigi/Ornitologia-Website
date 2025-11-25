<?php
/**
 * Endpoint de "Sobre Nosotros"
 * Retorna información del equipo, metadatos de la página y estadísticas
 */
require_once __DIR__ . '/../config/conexion.php';

/**
 * Normaliza la ruta de imagen de una persona
 * Convierte rutas de BD a rutas absolutas del frontend
 *
 * @param string|null $raw Ruta desde la base de datos
 * @return string|null Ruta normalizada o null
 */
function normalize_person_img(?string $raw): ?string {
    if (!$raw) {
        return null;
    }
    $base = basename($raw);
    return "/img/People/" . $base;
}

// Consultar miembros del equipo ordenados por orden y nombre
$sql = "SELECT id_miembro, nombre, rol, descripcion, especializacion, fotografia, orden
        FROM Equipo
        ORDER BY orden ASC, nombre ASC";
$res = $conn->query($sql);

if (!$res) {
    http_response_code(500);
    echo json_encode(["error" => "DB query failed", "details" => $conn->error]);
    exit;
}

// Construir array de miembros del equipo
$equipo = [];
while ($row = $res->fetch_assoc()) {
    $equipo[] = [
        "id"              => (int)$row["id_miembro"],
        "nombre"          => $row["nombre"],
        "rol"             => $row["rol"],
        "descripcion"     => $row["descripcion"],
        "especializacion" => $row["especializacion"],
        "fotografia"      => normalize_person_img($row["fotografia"]),
        "orden"           => (int)$row["orden"]
    ];
}

// Obtener estadística del total de especies en la BD
$statsRes = $conn->query("SELECT COUNT(*) AS total FROM Aves");
$totalEspecies = null;
if ($statsRes) {
    if ($row = $statsRes->fetch_assoc()) {
        $totalEspecies = (int)$row["total"];
    }
    $statsRes->free();
}

// Construir respuesta con equipo, metadatos y estadísticas
$response = [
    "status" => "ok",
    "equipo" => $equipo,
    "meta"   => [
        "titulo"  => "Sobre Nosotros",
        "resumen" => "Proyecto de divulgación y conservación de aves en Mallorca.",
        "cover"   => "/img/Lugares/ParcNaturaldelaPeninsuladeLlevant.jpg"
    ],
    "stats" => [
        "total_especies" => $totalEspecies
    ]
];

// Devolver respuesta como JSON
echo json_encode($response, JSON_UNESCAPED_UNICODE);

$res->free();
$conn->close();
