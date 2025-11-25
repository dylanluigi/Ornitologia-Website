<?php
/**
 * Endpoint de "Cómo Contribuir"
 * Retorna datos de lugares, parques y planes de recuperación con carousel
 */
declare(strict_types=1);

require_once __DIR__ . '/../config/conexion.php';

/**
 * Normaliza la ruta de imagen de un lugar
 * Convierte rutas de BD a rutas absolutas del frontend
 *
 * @param string|null $raw Ruta desde la base de datos
 * @return string|null Ruta normalizada o null
 */
function normalize_lugar_img(?string $raw): ?string
{
    if (!$raw) {
        return null;
    }

    return '/img/Lugares/' . basename($raw);
}

// Array con datos del carousel de planes de recuperación y manejo
$carouselPlanes = [
    [
        'id' => 'buitre-negro',
        'titulo' => 'Plan de manejo buitre negro',
        'imagen' => '/img/Planes/BuitreNegro.jpg',
        'url' => 'https://www.caib.es/sites/proteccioespecies/es/fauna/archivopub.do?ctrl=MCRST272ZI217643&id=217643',
    ],
    [
        'id' => 'milvus-milvus',
        'titulo' => 'Plan de manejo Milvus milvus',
        'imagen' => '/img/Planes/Milvusmilvus.jpg',
        'url' => 'https://www.caib.es/sites/proteccioespecies/es/fauna/archivopub.do?ctrl=MCRST272ZI217644&id=217644',
    ],
    [
        'id' => 'puffinus-mauretanicus',
        'titulo' => 'Plan de recuperación Puffinus mauretanicus',
        'imagen' => '/img/Planes/Puffinusmauretanicus.jpg',
        'url' => 'https://www.caib.es/sites/proteccioespecies/es/fauna/archivopub.do?ctrl=MCRST272ZI217645&id=217645',
    ],
    [
        'id' => 'neophron-percnopterus',
        'titulo' => 'Plan conservación Neophron percnopterus',
        'imagen' => '/img/Planes/Neophronpercnopterus.jpg',
        'url' => 'https://www.caib.es/sites/proteccioespecies/es/fauna/archivopub.do?ctrl=MCRST272ZI217639&id=217639',
    ],
    [
        'id' => 'pandion-halietus',
        'titulo' => 'Plan de conservación Pandion halietus',
        'imagen' => '/img/Planes/Pandionhalietus.jpg',
        'url' => 'https://www.caib.es/sites/proteccioespecies/es/fauna/archivopub.do?ctrl=MCRST272ZI217640&id=217640',
    ],
];

// Diccionario de descripciones detalladas para cada parque/lugar
$descripciones = [
    "Parc Natural de la Península de Llevant" => "Ubicado en el noreste de la isla, en el municipio de Artà, este parque natural alberga una amplia variedad de ecosistemas que van desde montes cubiertos de encinares hasta zonas costeras abruptas. Su diversidad ambiental favorece la presencia de aves rapaces como el águila calzada, el halcón peregrino o el milano real, así como pequeñas aves insectívoras y especies marinas que anidan en los acantilados. Es un entorno clave para la conservación de especies amenazadas y endémicas de las Baleares.",
    "Parc Natural de Mondragó" => "Situado en el sureste de Mallorca, en el término municipal de Santanyí, el parque combina paisajes agrícolas, humedales y calas costeras. Esta variedad de hábitats propicia la coexistencia de aves acuáticas y terrestres, como el alcaraván, la abubilla, el ruiseñor y diferentes especies de currucas. Mondragó constituye un ejemplo destacado de equilibrio entre la actividad humana tradicional y la conservación de la biodiversidad local.",
    "Parc Natural de s’Albufera de Mallorca" => "Localizado entre los municipios de Muro y Sa Pobla, es la zona húmeda más extensa e importante del archipiélago balear. Su red de canales, lagunas y cañaverales sirve de refugio a numerosas especies acuáticas, tanto residentes como migratorias. Entre ellas destacan el calamón, la garza real, el aguilucho lagunero y diversas especies de patos y limícolas. Es un espacio fundamental para la observación y protección de aves ligadas a los ecosistemas húmedos.",
    "Parc Natural Maritimoterrestre es Trenc-Salobrar de Campos" => "Ubicado en el sur de la isla, combina un sistema dunar costero con salinas y zonas húmedas interiores. Las lagunas del Salobrar constituyen un importante punto de descanso y alimentación para aves migratorias, como los flamencos, chorlitejos y correlimos. Es uno de los enclaves más representativos de la avifauna ligada a los humedales salinos del Mediterráneo occidental.",
    "Paratge Natural de la Serra de Tramuntana" => "La Serra de Tramuntana, declarada Patrimonio Mundial por la UNESCO, es el principal macizo montañoso de Mallorca y un refugio fundamental para las aves rapaces y forestales. En sus riscos y barrancos anidan especies como el buitre negro, el halcón peregrino, el autillo europeo y el cernícalo. También se encuentran poblaciones de aves endémicas, como el pinzón azul balear, vinculadas a sus bosques de pino y encina.",
    "Reserva Natural de s’Albufereta" => "Entre Alcúdia y Pollença, esta reserva complementa ecológicamente a s’Albufera de Mallorca. De menor tamaño, ofrece un ambiente más tranquilo donde prosperan especies sensibles a la alteración humana. Alberga aves como la cigüeñuela, el chorlitejo patinegro y diversas limícolas que utilizan la zona como punto de invernada o escala migratoria. Su gestión prioriza la conservación del equilibrio hídrico y la protección de los hábitats costeros.",
    "Monument Natural de ses Fonts Ufanes" => "Ubicado en el municipio de Campanet, este monumento natural se caracteriza por sus surgencias intermitentes de agua. El entorno de encinares y campos húmedos constituye un hábitat propicio para aves forestales y acuáticas, como el mirlo, el petirrojo, el pito real y el ruiseñor bastardo. Aunque de pequeña extensión, representa un refugio valioso para especies locales que dependen de la disponibilidad de agua dulce.",
    "Monument Natural del Torrent de Pareis" => "Situado en el municipio de Escorca, en plena Serra de Tramuntana, este profundo cañón desemboca en la costa norte de la isla. Sus paredes rocosas acogen poblaciones de aves rupícolas como el cernícalo, el vencejo real y el roquero solitario. El entorno combina valores geológicos y ecológicos excepcionales, ofreciendo un hábitat idóneo para especies adaptadas a los ecosistemas montañosos mediterráneos.",
    "Parc Natural de sa Dragonera" => "Situado frente a la costa suroeste de Mallorca, el Parc Natural de sa Dragonera es una isla protegida de gran valor ecológico y paisajístico. Sus acantilados, matorrales y zonas rocosas constituyen un hábitat ideal para diversas especies de aves marinas y rupícolas, incluyendo la pardela balear y el cormorán moñudo. La ausencia de asentamientos humanos permanentes ha permitido conservar un ecosistema prácticamente intacto, ofreciendo refugio y áreas de nidificación seguras para especies autóctonas y migratorias. Además, el parque contribuye a la investigación y la educación ambiental sobre la biodiversidad insular.",
    "Centro Sanitario Municipal de Son Reus" => "El Centro Sanitario Municipal de Son Reus, gestionado por el Ayuntamiento de Palma, desempeña una labor esencial en la atención y manejo de animales urbanos y silvestres encontrados en la ciudad o su entorno. En relación con las aves autóctonas, colabora en la recepción y derivación de ejemplares heridos o desorientados hacia centros especializados de recuperación. Además, actúa como punto de apoyo para campañas de sensibilización sobre el respeto a la fauna local y la importancia de su conservación.",
    "Centro de Recuperación de Tortugas Marinas de la Fundación Marineland-Mallorca" => "Este centro, está especializado en el rescate, tratamiento y liberación de tortugas marinas afectadas por actividades humanas o fenómenos naturales. Aunque su labor principal se centra en fauna marina, mantiene vínculos con la conservación de aves marinas de las Baleares, especialmente en la rehabilitación de especies que comparten hábitats costeros, como la pardela balear y el cormorán moñudo. También participa en programas educativos sobre biodiversidad marina y su relación con los ecosistemas insulares.",
    "Consorcio para la Recuperación de Fauna de las Islas Baleares (COFIB)" => "El COFIB es el organismo de referencia en la atención, rehabilitación y liberación de fauna silvestre en las Islas Baleares. Su labor abarca la gestión de centros de recuperación, el seguimiento de especies amenazadas y la coordinación de programas de conservación. En Mallorca, desempeña un papel clave en la recuperación de aves protegidas como el buitre negro, el milano real o la pardela balear. Además, impulsa proyectos de investigación y educación ambiental orientados a la preservación de la biodiversidad insular.",
    "Jardines de Alfabia" => "Situados al pie de la Serra de Tramuntana, los Jardines de Alfabia constituyen un conjunto histórico y paisajístico de gran valor cultural y natural. Su composición de huertos, estanques, fuentes y zonas arboladas crea un microhábitat especialmente favorable para diversas especies de aves autóctonas y migratorias. Entre sus frondosos jardines se pueden observar petirrojos, mirlos, ruiseñores y currucas, así como especies insectívoras que encuentran alimento y refugio en la vegetación ornamental. Además de su interés artístico, el conjunto contribuye a la conservación de pequeños ecosistemas tradicionales del paisaje mallorquín."
];

// Consultar todos los parques y jardines ordenados alfabéticamente
$sql = "SELECT id_parque, nombre, ubicacion, url, imagen
        FROM Parques_Jardines
        ORDER BY nombre ASC";

$res = $conn->query($sql);

if (!$res) {
    http_response_code(500);
    echo json_encode([
        'error' => 'DB query failed',
        'details' => $conn->error,
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$lugares = [];
$index = 0;


// Procesar cada lugar y asignar layout alternado (imagen izquierda/derecha)
while ($row = $res->fetch_assoc()) {
    $descripcion = $descripciones[$row['nombre']] ?? 'Descripción no disponible.';

    $lugares[] = [
        'id' => (int) $row['id_parque'],
        'nombre' => $row['nombre'],
        'ubicacion' => $row['ubicacion'],
        'url' => $row['url'],
        'imagen' => normalize_lugar_img($row['imagen']),
        'descripcion' => $descripcion,
        'layout' => $index % 2 === 0 ? 'text-first' : 'image-first',
    ];

    $index++;
}

// Construir respuesta con carousel y lugares
$payload = [
    'status' => 'ok',
    'count' => count($lugares),
    'carousel' => $carouselPlanes,
    'lugares' => $lugares,
];

// Devolver respuesta como JSON
echo json_encode($payload, JSON_UNESCAPED_UNICODE);

$res->free();
$conn->close();
