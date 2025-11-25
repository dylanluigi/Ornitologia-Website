/**
 * Script de mapas y gráficas
 * Crea visualizaciones interactivas con Highcharts:
 * - Mapa de ubicaciones de aves por parques
 * - Mapa coroplético de densidad por municipio
 * - Gráfico de barras de familias de aves
 * - Gráfico circular de categorías de conservación
 */

let chart;

// Paleta de colores para categorización de aves
const COLORS = {
    endemic: '#dc3545',        // Rojo para endémicas
    protected: '#ffc107',      // Amarillo para protegidas
    regular: '#28a745',        // Verde para regulares
    park: '#819898ff'          // Gris para parques sin datos
};

/**
 * Determina el color de un ave según su estado de conservación
 * @param {Object} bird - Objeto ave con categoría de conservación
 * @returns {string} Código de color hexadecimal
 */
function getBirdColor(bird) {
    if (bird.endemica) {
        return COLORS.endemic;
    }

    const protectedStatuses = [
        'Peligro de extinción',
        'De especial protección',
        'Vulnerables',
        'Sensibles a la alteración de su hábitat'
    ];

    if (protectedStatuses.includes(bird.categoria_conservacion)) {
        return COLORS.protected;
    }

    return COLORS.regular;
}
/**
 * Crea HTML para tooltip del mapa con lista de aves
 * @param {Object} location - Objeto con datos del parque y sus aves
 * @returns {string} HTML formateado para tooltip
 */
function createTooltipHTML(location) {
    const { nombre_parque, aves } = location;

    let html = `<div style="max-width: 350px; min-width: 280px; padding: 10px; box-sizing: border-box; background: rgba(255, 255, 255, 0.60); backdrop-filter: blur(8px); border-radius: 8px;">
        <h6 style="margin: 0 0 10px 0; color: #5c91a3; border-bottom: 2px solid #5c91a3; padding-bottom: 5px; word-wrap: break-word; white-space: normal; line-height: 1.3;">
            ${nombre_parque}
        </h6>`;

    if (aves && aves.length > 0) {
        html += `<p style="margin: 5px 0 8px 0; font-weight: bold;">Especies registradas: ${aves.length}</p>`;
        html += `<div style="max-height: 250px; overflow-y: auto; overflow-x: hidden; padding-right: 8px; -webkit-overflow-scrolling: touch;">
            <ul style="margin: 0; padding-left: 20px; list-style-type: none;">`;

        aves.forEach(bird => {
            const color = getBirdColor(bird);
            const badge = bird.endemica ? ' <span style="background: #dc3545; color: white; padding: 2px 5px; border-radius: 3px; font-size: 10px; white-space: nowrap;">ENDÉMICA</span>' : '';
            html += `<li style="margin-bottom: 8px; line-height: 1.4;">
                <span style="color: ${color}; font-size: 14px; margin-right: 5px;">●</span>
                <strong style="word-wrap: break-word;">${bird.nombre_comun || bird.nombre_cientifico}</strong>
                ${badge}
                <br><em style="font-size: 11px; color: #666; margin-left: 19px; display: block;">${bird.nombre_cientifico}</em>
            </li>`;
        });

        html += '</ul></div>';
    } else {
        html += '<p style="margin: 5px 0; color: #666;"><em>No hay registros de aves en esta ubicación</em></p>';
    }

    html += '</div>';
    return html;
}
/**
 * Crea mapa interactivo de ubicaciones de aves en parques
 * Muestra markers coloreados según tipo de especies presentes
 */
async function createMap() {
    try {
        
        const [birdLocationsResponse, parksResponse] = await Promise.all([
            api.route('avesConUbicacion'),
            api.route('mapas')
        ]);

        if (birdLocationsResponse.status !== 'ok' || parksResponse.status !== 'ok') {
            throw new Error('Failed to fetch location data');
        }

        const birdLocations = birdLocationsResponse.locations || [];
        const allParks = parksResponse.parques || [];

        
        const parksWithBirds = new Map();
        birdLocations.forEach(loc => {
            parksWithBirds.set(loc.id_parque, loc);
        });

        
        const locations = allParks
            .filter(park => park.lat && park.lon) 
            .map(park => {
                if (parksWithBirds.has(park.id)) {
                    return parksWithBirds.get(park.id);
                }
                return {
                    id_parque: park.id,
                    nombre_parque: park.nombre,
                    lat: park.lat,
                    lon: park.lon,
                    aves: []
                };
            });


        const dataPoints = locations.map(location => {
            const totalBirds = location.aves.length;
            const endemicCount = location.aves.filter(b => b.endemica).length;
            const protectedCount = location.aves.filter(b => {
                const protected = [
                    'Peligro de extinción',
                    'De especial protección',
                    'Vulnerables',
                    'Sensibles a la alteración de su hábitat'
                ];
                return protected.includes(b.categoria_conservacion);
            }).length;


            let markerColor = COLORS.park;


            let markerSize = totalBirds > 0 ? 10 + (totalBirds * 0.01) : 8;
            if (markerSize > 30) markerSize = 30; 

            return {
                lat: location.lat,
                lon: location.lon,
                name: location.nombre_parque,
                color: markerColor,
                marker: {
                    radius: markerSize,
                    fillColor: markerColor,
                    lineColor: 'white',
                    lineWidth: 2
                },
                custom: {
                    totalBirds,
                    endemicCount,
                    protectedCount,
                    location
                }
            };
        });


        chart = Highcharts.mapChart('mapContainer', {
            chart: {
                map: 'custom/world',
                backgroundColor: '#f8f9fa',
                panning: { enabled: false }
            },

            title: {
                text: 'Distribución de Aves en Parques y Centros',
                style: {
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#333'
                }
            },

            subtitle: {
                text: `${locations.length} parques naturales y reservas (${birdLocations.length} con registros de especies)`,
                style: {
                    fontSize: '14px',
                    color: '#666'
                }
            },

            accessibility: {
                description: 'Mapa interactivo mostrando la distribución de especies de aves en los parques naturales y reservas de Mallorca. Los puntos representan diferentes categorías: especies endémicas en rojo, especies protegidas en amarillo, otras especies en verde, y parques sin registros en gris.',
                keyboardNavigation: {
                    enabled: true
                },
                point: {
                    valueDescriptionFormat: '{point.name}. {point.custom.totalBirds} especies de aves registradas.'
                }
            },

            mapNavigation: {
                enabled: false
            },

            mapView: {
                center: [2.95, 39.62],  
                zoom: 9.5,
                projection: {
                    name: 'WebMercator'
                }
            },

            tooltip: {
                useHTML: true,
                padding: 0,
                borderWidth: 0,
                borderRadius: 8,
                backgroundColor: 'rgba(196, 181, 181, 0.17)',
                shadow: false,
                style: {
                    pointerEvents: 'auto'
                },
                formatter: function() {
                    if (this.point.custom && this.point.custom.location) {
                        return createTooltipHTML(this.point.custom.location);
                    }
                    return `<b>${this.point.name}</b>`;
                }
            },

            legend: {
                enabled: true,
                align: 'left',
                verticalAlign: 'bottom',
                floating: true,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#5c91a3',
                padding: 12,
                x: 10,
                y: -10,
                itemStyle: {
                    fontSize: '12px',
                    fontWeight: '400',
                    cursor: 'default'
                },
                itemHoverStyle: {
                    cursor: 'default',
                    color: undefined
                },
                itemHiddenStyle: {
                    cursor: 'default'
                },
                title: {
                    text: 'Leyenda',
                    style: {
                        fontSize: '13px',
                        fontWeight: 'bold',
                        color: '#333'
                    }
                }
            },

            plotOptions: {
                series: {
                    events: {
                        legendItemClick: function() {
                            return false;
                        }
                    },
                    states: {
                        hover: {
                            enabled: false
                        },
                        inactive: {
                            opacity: 1
                        }
                    }
                },
                mappoint: {
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: false
                    }
                }
            },

            series: [
                {
                    type: 'tiledwebmap',
                    name: 'Base Map',
                    provider: {
                        type: 'Esri',
                        theme: 'WorldImagery'
                    },
                    showInLegend: false
                },
                {
                    type: 'mappoint',
                    name: 'Parques y Reservas',
                    data: dataPoints.filter(p => p.custom.totalBirds === 0),
                    color: COLORS.park,
                    marker: {
                        symbol: 'circle',
                        lineColor: 'white',
                        lineWidth: 2,
                        radius: 8
                    },
                    showInLegend: true
                },
                {
                    type: 'mappoint',
                    name: 'Especies Endémicas',
                    data: dataPoints.filter(p => p.custom.endemicCount > 0),
                    color: COLORS.endemic,
                    marker: {
                        symbol: 'circle',
                        lineColor: 'white',
                        lineWidth: 2
                    },
                    showInLegend: true
                },
                {
                    type: 'mappoint',
                    name: 'Especies Protegidas',
                    data: dataPoints.filter(p => p.custom.protectedCount > 0 && p.custom.endemicCount === 0),
                    color: COLORS.protected,
                    marker: {
                        symbol: 'circle',
                        lineColor: 'white',
                        lineWidth: 2
                    },
                    showInLegend: true
                },
                {
                    type: 'mappoint',
                    name: 'Otras Especies',
                    data: dataPoints.filter(p => p.custom.totalBirds > 0 && p.custom.endemicCount === 0 && p.custom.protectedCount === 0),
                    color: COLORS.regular,
                    marker: {
                        symbol: 'circle',
                        lineColor: 'white',
                        lineWidth: 2
                    },
                    showInLegend: true
                }
            ],

            credits: {
                enabled: true,
                text: 'Map: Esri WorldImagery | Data: Aves Mallorca',
                href: '',
                style: {
                    fontSize: '10px',
                    color: '#666'
                }
            }
        });

        console.log(`Map created successfully with ${dataPoints.length} bird locations`);

    } catch (error) {
        console.error('Error creating map:', error);
        document.getElementById('mapContainer').innerHTML = `
            <div class="loading" style="color: #d32f2f;">
                <div>
                    <strong>Error al cargar el mapa</strong><br>
                    ${error.message}<br>
                    <small>Por favor, verifica que el servidor backend esté funcionando.</small>
                </div>
            </div>
        `;
    }
}

let neighborhoodChart;
let mallorcaGeoJSON = null;
let neighborhoodData = null;
let currentMunicipalitySeason = 'Primavera';


/**
 * Algoritmo ray-casting para determinar si un punto está dentro de un polígono
 * @param {Array<number>} point - [lng, lat] del punto a verificar
 * @param {Array<Array<number>>} polygon - Array de coordenadas del polígono
 * @returns {boolean} True si el punto está dentro del polígono
 */
function isPointInPolygon(point, polygon) {
    const [lng, lat] = point;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [lng1, lat1] = polygon[i];
        const [lng2, lat2] = polygon[j];

        const intersect = ((lat1 > lat) !== (lat2 > lat)) &&
            (lng < (lng2 - lng1) * (lat - lat1) / (lat2 - lat1) + lng1);

        if (intersect) inside = !inside;
    }

    return inside;
}


/**
 * Verifica si un punto está en cualquier polígono de un MultiPolygon
 * @param {Array<number>} point - [lng, lat] del punto a verificar
 * @param {Array} multiPolygon - Array de polígonos
 * @returns {boolean} True si el punto está en algún polígono
 */
function isPointInMultiPolygon(point, multiPolygon) {
    for (const polygon of multiPolygon) {
        const coords = polygon[0] || polygon;
        if (isPointInPolygon(point, coords)) {
            return true;
        }
    }
    return false;
}

/**
 * Actualiza el mapa coroplético con datos de una estación específica
 * @param {string} season - Nombre de la estación (Primavera, Verano, Otoño, Invierno)
 */
function updateMunicipalitySeason(season) {
    if (!neighborhoodData || !neighborhoodChart) return;

    currentMunicipalitySeason = season;

    const seasonMax = Math.max(...neighborhoodData.map(m => m.seasons[season]));
    const mapData = neighborhoodData.map(item => ({ ...item, value: item.seasons[season] }));
    const totalBirds = mapData.reduce((sum, m) => sum + m.value, 0);
    const municipalitiesWithBirds = mapData.filter(m => m.value > 0).length;

    neighborhoodChart.series[0].setData(mapData, false);

    if (neighborhoodChart.colorAxis?.[0]) {
        neighborhoodChart.colorAxis[0].update({ max: seasonMax > 0 ? seasonMax : 25 }, false);
    }

    if (neighborhoodChart.legend) {
        neighborhoodChart.legend.update({
            title: {
                text: 'Especies',
                style: { fontWeight: 'bold', fontSize: '11px' }
            }
        }, false);
    }

    neighborhoodChart.setSubtitle({
        text: `${municipalitiesWithBirds} de ${neighborhoodData.length} municipios con registros de aves (${season})`
    }, false);

    neighborhoodChart.redraw();
}

/**
 * Crea mapa coroplético de densidad de especies por municipio
 * Usa GeoJSON de Mallorca y calcula especies por municipio usando geometría
 */
async function createNeighborhoodMap() {
    try {
        const geoResponse = await fetch('https://raw.githubusercontent.com/enmiquelangel/geojsonsillesbalears/master/mallorca.json');
        mallorcaGeoJSON = await geoResponse.json();

        const [birdResponse, densityResponse] = await Promise.all([
            api.route('avesConUbicacion'),
            api.route('densidadEstacional')
        ]);

        const birdLocations = birdResponse.locations || [];
        const densityLocations = densityResponse.locations || [];

        mallorcaGeoJSON.features.forEach(feature => {
            if (!feature.properties['hc-key']) {
                feature.properties['hc-key'] = feature.properties.neighbourhood_id;
            }
        });

        console.log(`Loaded ${mallorcaGeoJSON.features.length} municipalities, ${birdLocations.length} bird locations, ${densityLocations.length} seasonal density points`);

        neighborhoodData = mallorcaGeoJSON.features.map(feature => {
            const neighborhoodName = feature.properties.neighbourhood;
            const geometry = feature.geometry;

            const birdsInMunicipality = new Set();
            let parksInMunicipality = 0;

            const seasonalBirds = {
                Primavera: new Set(),
                Verano: new Set(),
                Otoño: new Set(),
                Invierno: new Set()
            };


            densityLocations.forEach(location => {
                const point = [location.lon, location.lat];

                let isInside = false;
                if (geometry.type === 'Polygon') {
                    isInside = isPointInPolygon(point, geometry.coordinates[0]);
                } else if (geometry.type === 'MultiPolygon') {
                    isInside = isPointInMultiPolygon(point, geometry.coordinates);
                }

                if (isInside) {
                    parksInMunicipality++;
                    Object.keys(seasonalBirds).forEach(season => {
                        const count = location.seasons[season];
                        for (let i = 0; i < count; i++) {
                            seasonalBirds[season].add(`${location.id}-bird-${i}`);
                        }
                    });
                }
            });

            birdLocations.forEach(location => {
                const point = [location.lon, location.lat];

                let isInside = false;
                if (geometry.type === 'Polygon') {
                    isInside = isPointInPolygon(point, geometry.coordinates[0]);
                } else if (geometry.type === 'MultiPolygon') {
                    isInside = isPointInMultiPolygon(point, geometry.coordinates);
                }

                if (isInside && location.aves && Array.isArray(location.aves)) {
                    location.aves.forEach(bird => {
                        birdsInMunicipality.add(bird.id_ave || bird.nombre_cientifico);
                    });
                }
            });

            return {
                'hc-key': feature.properties.neighbourhood_id,
                name: neighborhoodName,
                totalSpecies: birdsInMunicipality.size,
                parks: parksInMunicipality,
                seasons: {
                    Primavera: seasonalBirds.Primavera.size,
                    Verano: seasonalBirds.Verano.size,
                    Otoño: seasonalBirds.Otoño.size,
                    Invierno: seasonalBirds.Invierno.size
                }
            };
        });

        const seasonMax = Math.max(...neighborhoodData.map(m => m.seasons.Primavera));
        const mapData = neighborhoodData.map(item => ({
            ...item,
            value: item.seasons.Primavera
        }));

        const totalBirds = mapData.reduce((sum, m) => sum + m.value, 0);
        const municipalitiesWithBirds = mapData.filter(m => m.value > 0).length;
        const effectiveMax = seasonMax > 0 ? seasonMax : 10;

        console.log(`Primavera: ${municipalitiesWithBirds} municipalities with birds, ${totalBirds} total species, max: ${effectiveMax}`);

        neighborhoodChart = Highcharts.mapChart('neighborhoodMap', {
            chart: {
                map: mallorcaGeoJSON,
                backgroundColor: '#f8f9fa',
                panning: { enabled: false }
            },

            title: {
                text: 'Densidad de Especies por Municipio',
                style: { fontSize: '20px', fontWeight: 'bold', color: '#333' }
            },

            subtitle: {
                text: `${municipalitiesWithBirds} de ${mapData.length} municipios con registros de aves`,
                style: { fontSize: '14px', color: '#666' }
            },

            accessibility: {
                description: 'Mapa coroplético mostrando la densidad de especies de aves por municipio en Mallorca. Los colores más intensos indican mayor número de especies. Los datos varían según la estación seleccionada.',
                keyboardNavigation: {
                    enabled: true
                },
                point: {
                    valueDescriptionFormat: '{point.name}. {point.value} especies registradas en {add currentMunicipalitySeason}.'
                }
            },

            mapNavigation: {
                enabled: false,
                buttonOptions: { verticalAlign: 'bottom' }
            },

            mapView: {
                center: [2.95, 39.62],
                zoom: 9.5,
                projection: { name: 'WebMercator' }
            },

            colorAxis: {
                min: 0,
                max: effectiveMax,
                type: 'linear',
                stops: [
                    [0, '#e0e0e0'],        
                    [0.2, '#fff3cd'],      
                    [0.4, '#ffc107'],      
                    [0.6, '#fd7e14'],      
                    [1, '#dc3545']         
                ],
                labels: {
                    format: '{value}'
                },
                showInLegend: true
            },

            tooltip: {
                useHTML: true,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#ddd',
                padding: 12,
                formatter: function() {
                    const density = this.point.parks > 0
                        ? (this.point.value / this.point.parks).toFixed(1)
                        : 0;

                    return `
                        <div style="padding: 8px; min-width: 200px;">
                            <h6 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; border-bottom: 2px solid #5c91a3; padding-bottom: 5px;">
                                ${this.point.name}
                            </h6>
                            <p style="margin: 0 0 5px 0; font-size: 12px;">
                                <strong>Estación actual:</strong> ${currentMunicipalitySeason}
                            </p>
                            <p style="margin: 0 0 5px 0; font-size: 12px;">
                                <strong>Especies registradas:</strong> ${this.point.value}
                            </p>
                            <p style="margin: 0 0 8px 0; font-size: 12px;">
                                <strong>Parques y centros:</strong> ${this.point.parks}
                            </p>
                            ${this.point.parks > 0 ? `
                            <p style="margin: 0 0 10px 0; font-size: 11px; color: #666; font-style: italic;">
                                Densidad promedio: ${density} especies por ubicación
                            </p>` : ''}
                            <div style="background: #f8f9fa; padding: 8px; border-radius: 4px; margin-top: 8px;">
                                <p style="margin: 0 0 5px 0; font-size: 11px; font-weight: bold; color: #333;">
                                    Variación estacional:
                                </p>
                                <p style="margin: 0; font-size: 11px; color: #666; line-height: 1.6;">
                                    Primavera: ${this.point.seasons.Primavera} •
                                    Verano: ${this.point.seasons.Verano}<br>
                                    Otoño: ${this.point.seasons.Otoño} •
                                    Invierno: ${this.point.seasons.Invierno}
                                </p>
                            </div>
                            ${this.point.value === 0 ? `
                            <p style="margin: 10px 0 0 0; font-size: 11px; color: #999; text-align: center; font-style: italic;">
                                Sin registros en ${currentMunicipalitySeason}
                            </p>` : ''}
                        </div>
                    `;
                }
            },

            legend: {
                enabled: true,
                title: {
                    text: 'Especies',
                    style: { fontWeight: 'bold', fontSize: '11px' }
                },
                align: 'right',
                verticalAlign: 'bottom',
                layout: 'vertical',
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                borderRadius: 4,
                padding: 8,
                symbolHeight: 150,
                itemStyle: { fontSize: '10px' }
            },

            plotOptions: {
                map: {
                    allAreas: true,
                    states: {
                        hover: {
                            brightness: 0.1,
                            borderColor: '#303030',
                            borderWidth: 2
                        },
                        select: {
                            color: '#a4edba',
                            borderColor: 'black'
                        }
                    },
                    dataLabels: {
                        enabled: false
                    },
                    borderColor: '#A0A0A0',
                    borderWidth: 0.5
                }
            },

            series: [{
                type: 'map',
                name: 'Municipios',
                data: mapData,
                joinBy: 'hc-key',
                nullColor: '#f0f0f0',
                cursor: 'default',
                enableMouseTracking: true
            }],

            credits: {
                enabled: true,
                text: 'Datos: GeoJSON Mallorca | Ornitología Mallorca',
                href: '',
                style: { fontSize: '10px', color: '#666' }
            }
        });

        console.log(`Municipality choropleth map created with ${neighborhoodChart.series[0].data.length} regions`);

    } catch (error) {
        console.error('Error creating neighborhood map:', error);
        document.getElementById('neighborhoodMap').innerHTML = `
            <div class="loading" style="color: #d32f2f;">
                <div>
                    <strong>Error al cargar mapa de municipios</strong><br>
                    ${error.message}
                </div>
            </div>
        `;
    }
}

// Inicializar todos los mapas y gráficas al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    createMap();
    createReproductionChart();
    createConservationChart();
    createNeighborhoodMap();

    // Event listeners para botones de estación en mapa de municipios
    document.querySelectorAll('.season-btn-muni').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const season = e.target.dataset.season;

            document.querySelectorAll('.season-btn-muni').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            updateMunicipalitySeason(season);
        });
    });
});
/**
 * Crea gráfico de barras horizontales con número de aves por familia
 * Agrupa familias con el mismo número de especies
 */
async function createReproductionChart() {
    try {
        const resp = await api.route('mapas');
        if (!resp || resp.status !== 'ok') {
            throw new Error('Unable to fetch reproduction counts');
        }

        const counts = resp.familia_counts || {};

        
        const entries = Object.entries(counts).filter(([k, v]) => v && v > 0);
        
        entries.sort((a, b) => b[1] - a[1]);

        
        const countMap = new Map(); 
        entries.forEach(([family, total]) => {
            if (!countMap.has(total)) countMap.set(total, []);
            countMap.get(total).push(family);
        });

        
        const grouped = Array.from(countMap.entries())
            .sort((a, b) => b[0] - a[0]) 
            .map(([total, families]) => ({
                name: families.join(', '),
                y: total,
                families: families
            }));

        const categories = grouped.map(g => g.name);
        const data = grouped.map(g => g.y);

        Highcharts.chart('reproductionChart', {
            chart: { type: 'bar' },
            colors: [
                '#5c91a3',
                '#2d5555',
                '#a8cdd6',
                '#1f3d3d',
                '#7fb7c8',
                '#3a6b6b',
                '#c2dde4',
                '#456f7d',
                '#91bac7',
                '#234444'
            ],
            title: {
                text: 'Número de aves por familia (agrupadas por total)',
                style: { color: '#1f3d3d' }
            },
            subtitle: {
                text: 'Familias con el mismo número aparecen agrupadas. Fuente: Base de datos Aves Mallorca',
                style: { color: '#172626' }
            },
            accessibility: {
                description: 'Gráfico de barras horizontales mostrando el número de especies de aves agrupadas por familia. Las familias con el mismo número de especies aparecen agrupadas en la misma barra.',
                keyboardNavigation: {
                    enabled: true
                },
                point: {
                    valueDescriptionFormat: '{point.name}: {point.y} especies.'
                }
            },
            xAxis: {
                categories: categories,
                title: { text: 'Familias', style: { color: '#1f3d3d' } },
                gridLineWidth: 1,
                lineWidth: 0,
                labels: { style: { whiteSpace: 'normal', color: '#172626' } }
            },
            yAxis: {
                min: 0,
                title: { text: 'Número de aves', align: 'high', style: { color: '#1f3d3d' } },
                labels: { overflow: 'justify', style: { color: '#172626' } },
                gridLineWidth: 0
            },
            tooltip: {
                pointFormatter: function() {
                    
                    const families = this.families ? this.families.join(', ') : this.category;
                    return `<b>${this.y}</b> aves<br/><small>${families}</small>`;
                },
                backgroundColor: '#ffffff',
                borderColor: '#5c91a3',
                style: { color: '#172626' },
                valueSuffix: '%'
            },
            plotOptions: {
                bar: {
                    borderRadius: 5,
                    dataLabels: {
                        enabled: true,
                        style: { color: '#1f3d3d', fontWeight: 'bold' }
                    },
                    groupPadding: 0.1,
                    color: '#5c91a3'
                }
            },
            legend: { enabled: false },
            credits: { enabled: false },
            series: [{ name: 'Total', data: grouped, color: '#5c91a3' }]
        });

    } catch (error) {
        console.error('Error creating reproduction chart:', error);
        const el = document.getElementById('reproductionChart');
        if (el) {
            el.innerHTML = `<div class="loading" style="color: #d32f2f;"><div><strong>Error al cargar gráfico</strong><br>${error.message}</div></div>`;
        }
    }
}
/**
 * Crea gráfico circular (donut) de aves por categoría de conservación
 * Incluye patrones de accesibilidad para daltonismo
 */
async function createConservationChart() {
    try {
        const resp = await api.route('mapas');
        if (!resp || resp.status !== 'ok') {
            throw new Error('Unable to fetch conservation counts');
        }

        const counts = resp.categoria_counts || {};


        const entries = Object.entries(counts).filter(([k, v]) => v && v > 0);

        if (entries.length === 0) {
            const el = document.getElementById('conservationChart');
            if (el) el.innerHTML = '<div class="loading">No hay datos de categorías para mostrar</div>';
            return;
        }

        const data = entries.map(([k, v]) => ({ name: k, y: v }));
        const total = data.reduce((s, d) => s + d.y, 0);

        // Define base colors
        const pieColors = [
            '#5c91a3',
            '#c2dde4',
            '#2d5555',
            '#91bac7',
            '#1f3d3d',
            '#a8cdd6',
            '#3a6b6b',
            '#d4e8ed',
            '#456f7d',
            '#7fb7c8',
            '#234444',
            '#b5d4dc',
            '#527e8c',
            '#e0eff3',
            '#2f5a5a',
            '#8fb8c4',
            '#1a3333',
            '#6ca3b3',
            '#335252',
            '#9cc5cf'
        ];

        // Define pattern fills for accessibility
        const patterns = pieColors.map((color, i) => ({
            pattern: {
                path: {
                    d: i % 4 === 0 ? 'M 0 0 L 10 10 M 9 -1 L 11 1 M -1 9 L 1 11' : // diagonal lines
                        i % 4 === 1 ? 'M 0 10 L 10 0 M -1 1 L 1 -1 M 9 11 L 11 9' : // opposite diagonal
                        i % 4 === 2 ? 'M 3 0 L 3 10 M 8 0 L 8 10' : // vertical lines
                        'M 0 3 L 10 3 M 0 8 L 10 8', // horizontal lines
                    strokeWidth: 2
                },
                width: 10,
                height: 10,
                color: color,
                opacity: 1
            }
        }));

        const conservationChart = Highcharts.chart('conservationChart', {
            chart: {
                type: 'pie',
                events: {
                    render() {
                        const chart = this,
                            series = chart.series[0];
                        let customLabel = chart.options.chart.custom && chart.options.chart.custom.label;

                        if (!customLabel) {
                            customLabel = (chart.options.chart.custom = chart.options.chart.custom || {}).label =
                                chart.renderer.label(
                                    'Total<br/>' +
                                    `<strong>${total}</strong>`
                                )
                                    .css({
                                        color: '#1f3d3d',
                                        textAnchor: 'middle'
                                    })
                                    .add();
                        }

                        const x = series.center[0] + chart.plotLeft,
                            y = series.center[1] + chart.plotTop - (customLabel.attr('height') / 2);

                        customLabel.attr({ x, y });
                        customLabel.css({ fontSize: `${series.center[2] / 12}px` });
                    }
                }
            },
            colors: patterns,
            title: {
                text: 'Número total de aves por categoría de conservación',
                style: { color: '#1f3d3d' }
            },
            subtitle: {
                text: 'Fuente: Base de datos Aves Mallorca',
                style: { color: '#172626' }
            },
            accessibility: {
                description: 'Gráfico de donut mostrando la distribución porcentual de especies de aves por categoría de conservación. Los patrones visuales permiten distinguir las categorías para personas con daltonismo.',
                keyboardNavigation: {
                    enabled: true
                },
                point: {
                    valueDescriptionFormat: '{point.name}: {point.percentage:.1f}%, {point.y} especies.'
                }
            },
            tooltip: {
                pointFormat: '{series.name}: <b>{point.percentage:.0f}%</b>',
                backgroundColor: '#ffffff',
                borderColor: '#5c91a3',
                style: { color: '#172626' }
            },
            legend: {
                enabled: false,
                itemStyle: { color: '#172626' }
            },
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    borderRadius: 8,
                    innerSize: '75%',
                    dataLabels: {
                        enabled: true,
                        distance: 10,
                        format: '{point.name}: {point.percentage:.0f}%',
                        style: { color: '#1f3d3d', fontWeight: 'bold', textOutline: 'none' }
                    },
                    showInLegend: true
                }
            },
            credits: { enabled: false },
            series: [{ name: 'Aves', colorByPoint: true, data: data }]
        });

        // Enable pattern toggle checkbox
        const patternsCheckbox = document.getElementById('patterns-enabled');
        if (patternsCheckbox) {
            patternsCheckbox.onclick = function () {
                conservationChart.update({
                    colors: this.checked ? patterns : pieColors
                });
            };
        }

    } catch (error) {
        console.error('Error creating conservation chart:', error);
        const el = document.getElementById('conservationChart');
        if (el) {
            el.innerHTML = `<div class="loading" style="color: #d32f2f;"><div><strong>Error al cargar gráfico</strong><br>${error.message}</div></div>`;
        }
    }
}
