<?php
/**
 * Endpoint del catálogo de aves
 * Retorna lista de aves con filtros dinámicos y opciones de búsqueda
 */
declare(strict_types=1);

require_once __DIR__ . '/../config/conexion.php';

/**
 * Normaliza la ruta de imagen de un ave
 * Convierte rutas de BD a rutas absolutas del frontend
 *
 * @param string|null $raw Ruta desde la base de datos
 * @return string|null Ruta normalizada o null
 */
function normalize_ave_img(?string $raw): ?string
{
    if (!$raw) {
        return null;
    }

    // Extraer nombre del archivo y construir ruta frontend
    return '/img/Aves/' . basename($raw);
}

/**
 * Obtiene valores distintos de un campo para los filtros
 * Consulta la BD y retorna array de valores únicos ordenados
 *
 * @param mysqli $conn Conexión a la base de datos
 * @param string $field Nombre del campo a consultar
 * @return array Lista de valores únicos
 */
function distinct_values(mysqli $conn, string $field): array
{
    // Consulta para obtener valores únicos no nulos del campo
    $sql = "SELECT DISTINCT {$field} AS val
            FROM Aves
            WHERE {$field} IS NOT NULL AND {$field} <> ''
            ORDER BY {$field} ASC";

    $vals = [];
    if ($res = $conn->query($sql)) {
        while ($row = $res->fetch_assoc()) {
            $vals[] = $row['val'];
        }
        $res->free();
    }

    return $vals;
}

/**
 * Obtiene un parámetro GET como entero
 *
 * @param string $key Nombre del parámetro GET
 * @return int|null Valor entero o null si no existe
 */
function int_param(string $key): ?int
{
    if (!isset($_GET[$key]) || $_GET[$key] === '') {
        return null;
    }

    return (int) $_GET[$key];
}

// Obtener y validar parámetros de búsqueda y filtros desde GET
$campoInicial = ($_GET['campoInicial'] ?? 'nombre_comun') === 'nombre_cientifico'
    ? 'nombre_cientifico'
    : 'nombre_comun';
$letter = trim($_GET['letter'] ?? '');
$filtroNombre = trim($_GET['nombre'] ?? '');
$familiaFilter = trim($_GET['filterFamilia'] ?? '');
$pesoFilter = trim($_GET['filterPeso'] ?? '');
$tamanoFilter = trim($_GET['filterTamano'] ?? '');
$categoriaFilter = trim($_GET['filterCategoria'] ?? '');
$epocaFilter = trim($_GET['filterEpoca'] ?? '');
$vidaMin = int_param('vidaMin');
$vidaMax = int_param('vidaMax');
$onlyEndemica = isset($_GET['filterEndemica']);
$onlyPlan = isset($_GET['filterPlan']);

// Construir cláusulas WHERE dinámicas según filtros aplicados
$where = [];
$types = '';
$params = [];

// Filtro por letra inicial (alfabético o numérico '#')
if ($letter !== '') {
    if ($letter === '#') {
        $where[] = "{$campoInicial} REGEXP '^[^A-Za-z]'";
    } elseif (preg_match('/^[A-Za-z]$/', $letter)) {
        $where[] = "{$campoInicial} LIKE ?";
        $types .= 's';
        $params[] = $letter . '%';
    }
}

// Filtro por búsqueda de texto en nombres (común o científico)
if ($filtroNombre !== '') {
    $where[] = "(nombre_comun LIKE ? OR nombre_cientifico LIKE ?)";
    $types .= 'ss';
    $likeValue = '%' . $filtroNombre . '%';
    $params[] = $likeValue;
    $params[] = $likeValue;
}

// Filtro por familia taxonómica
if ($familiaFilter !== '') {
    $where[] = "familia = ?";
    $types .= 's';
    $params[] = $familiaFilter;
}

// Filtro por rango de peso
if ($pesoFilter !== '') {
    $where[] = "peso = ?";
    $types .= 's';
    $params[] = $pesoFilter;
}

// Filtro por rango de tamaño
if ($tamanoFilter !== '') {
    $where[] = "tamano = ?";
    $types .= 's';
    $params[] = $tamanoFilter;
}

// Filtro por categoría de conservación
if ($categoriaFilter !== '') {
    $where[] = "categoria_conservacion = ?";
    $types .= 's';
    $params[] = $categoriaFilter;
}

// Filtro por época de reproducción
if ($epocaFilter !== '') {
    $where[] = "epoca_reproduccion = ?";
    $types .= 's';
    $params[] = $epocaFilter;
}

// Filtro por vida media mínima
if ($vidaMin !== null) {
    $where[] = "vida_media >= ?";
    $types .= 'i';
    $params[] = $vidaMin;
}

// Filtro por vida media máxima
if ($vidaMax !== null) {
    $where[] = "vida_media <= ?";
    $types .= 'i';
    $params[] = $vidaMax;
}

// Filtro para mostrar solo especies endémicas
if ($onlyEndemica) {
    $where[] = "endemica = 1";
}

// Filtro para mostrar solo especies con plan de recuperación
if ($onlyPlan) {
    $where[] = "(plan_recuperacion IS NOT NULL AND plan_recuperacion <> '')";
}

// Construir consulta SQL con los campos necesarios
$sql = "SELECT id_ave, nombre_comun, nombre_cientifico, familia,
               tipo_ave, endemica, descripcion, peso, tamano,
               vida_media, habitat_y_cria, area_invernada,
               patron_migratorio, categoria_conservacion,
               plan_recuperacion, epoca_reproduccion,
               curiosidades, fotografias
        FROM Aves";

// Añadir cláusulas WHERE si hay filtros activos
if ($where) {
    $sql .= ' WHERE ' . implode(' AND ', $where);
}

$sql .= ' ORDER BY nombre_comun ASC';

// Preparar statement para prevenir SQL injection
$stmt = $conn->prepare($sql);

if (!$stmt) {
    http_response_code(500);
    echo json_encode([
        'error' => 'DB prepare failed',
        'details' => $conn->error,
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Vincular parámetros si existen
if ($params) {
    $stmt->bind_param($types, ...$params);
}

// Ejecutar consulta y obtener resultados
$stmt->execute();
$res = $stmt->get_result();

$aves = [];

// Mapear resultados a formato JSON
while ($row = $res->fetch_assoc()) {
    $aves[] = [
        'id' => (int) $row['id_ave'],
        'nombre_comun' => $row['nombre_comun'],
        'nombre_cientifico' => $row['nombre_cientifico'],
        'familia' => $row['familia'],
        'tipo_ave' => $row['tipo_ave'],
        'endemica' => (bool) $row['endemica'],
        'descripcion' => $row['descripcion'],
        'peso' => $row['peso'],
        'tamano' => $row['tamano'],
        'vida_media' => $row['vida_media'] !== null ? (int) $row['vida_media'] : null,
        'habitat_y_cria' => $row['habitat_y_cria'],
        'area_invernada' => $row['area_invernada'],
        'patron_migratorio' => $row['patron_migratorio'],
        'categoria_conservacion' => $row['categoria_conservacion'],
        'plan_recuperacion' => $row['plan_recuperacion'],
        'epoca_reproduccion' => $row['epoca_reproduccion'],
        'curiosidades' => $row['curiosidades'],
        'imagen' => normalize_ave_img($row['fotografias']),
    ];
}

// Construir respuesta con aves, filtros disponibles y metadatos de búsqueda
$response = [
    'status' => 'ok',
    'count' => count($aves),
    'filters' => [
        'familias' => distinct_values($conn, 'familia'),
        'pesos' => distinct_values($conn, 'peso'),
        'tamanos' => distinct_values($conn, 'tamano'),
        'categorias' => distinct_values($conn, 'categoria_conservacion'),
        'epocas' => distinct_values($conn, 'epoca_reproduccion'),
    ],
    'request' => [
        'campoInicial' => $campoInicial,
        'letter' => $letter,
        'nombre' => $filtroNombre,
        'filterFamilia' => $familiaFilter,
        'filterPeso' => $pesoFilter,
        'filterTamano' => $tamanoFilter,
        'filterCategoria' => $categoriaFilter,
        'filterEpoca' => $epocaFilter,
        'vidaMin' => $vidaMin,
        'vidaMax' => $vidaMax,
        'filterEndemica' => $onlyEndemica,
        'filterPlan' => $onlyPlan,
    ],
    'letters' => array_merge(range('A', 'Z'), ['#']),
    'aves' => $aves,
];

// Devolver respuesta como JSON
echo json_encode($response, JSON_UNESCAPED_UNICODE);

$res->free();
$stmt->close();
$conn->close();
