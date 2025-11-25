/**
 * Script del catálogo de aves
 * Maneja filtros, búsqueda, visualización de tarjetas y modales
 */

/**
 * Escapa caracteres HTML para prevenir XSS
 * @param {*} value - Valor a escapar
 * @returns {string} String escapado
 */
const escapeHtmlCat = (value) => {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

/**
 * Sanitiza texto para usar como ID HTML válido
 * @param {*} value - Valor a sanitizar
 * @returns {string} ID válido sin caracteres especiales
 */
function sanitizeForId(value) {
  if (!value) return 'sin-nombre';
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Inicializar catálogo cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  // Constantes de configuración
  const DEFAULT_IMAGE = '/img/Aves/accipiter_nisus.jpg';
  const DEFAULT_CAMPO = 'nombre_comun';
  let currentParams = new URLSearchParams(window.location.search);

  // Referencias a elementos del DOM
  const form = document.getElementById('filtersForm');
  const letterButtons = document.getElementById('letterButtons');
  const grid = document.getElementById('avesGrid');
  const modalsRoot = document.getElementById('modalsRoot');
  const summary = document.getElementById('resultsSummary');
  const noResults = document.getElementById('noResults');
  const spinner = document.getElementById('catalogoSpinner');

  const selectFamilia = document.getElementById('filterFamilia');
  const selectPeso = document.getElementById('filterPeso');
  const selectTamano = document.getElementById('filterTamano');
  const selectCategoria = document.getElementById('filterCategoria');
  const selectEpoca = document.getElementById('filterEpoca');

  const checkboxEndemica = document.getElementById('filterEndemica');
  const checkboxPlan = document.getElementById('filterPlan');

  const campoInicialSelect = document.getElementById('campoInicial');
  const nombreInput = document.getElementById('nombre');
  const vidaMinInput = document.getElementById('vidaMin');
  const vidaMaxInput = document.getElementById('vidaMax');

  /**
   * Convierte parámetros URL a objeto para la API
   * @returns {Object} Objeto con parámetros de búsqueda
   */
  function paramsObject() {
    const obj = {};
    currentParams.forEach((value, key) => {
      if (value !== '') obj[key] = value;
    });
    if (!obj.campoInicial) obj.campoInicial = DEFAULT_CAMPO;
    return obj;
  }

  /**
   * Sincroniza la URL del navegador con los parámetros actuales
   */
  function syncUrl() {
    const query = currentParams.toString();
    const newUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  }

  /**
   * Rellena un select con opciones dinámicas
   * @param {HTMLSelectElement} select - Elemento select a poblar
   * @param {Array} options - Opciones a añadir
   * @param {string} selectedValue - Valor a marcar como seleccionado
   */
  function populateSelect(select, options, selectedValue) {
    const placeholder = select.dataset.placeholder || 'Todas';
    select.innerHTML = `<option value="">${placeholder}</option>`;
    options.forEach((option) => {
      const optionEl = document.createElement('option');
      optionEl.value = option;
      optionEl.textContent = option;
      if (option === selectedValue) optionEl.selected = true;
      select.appendChild(optionEl);
    });
  }

  /**
   * Renderiza botones alfabéticos para filtrado por letra inicial
   * @param {Array<string>} letters - Lista de letras disponibles
   * @param {string} activeLetter - Letra actualmente activa
   */
  function renderLetterButtons(letters, activeLetter) {
    letterButtons.innerHTML = '';
    letters.forEach((letter) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `btn btn-sm ${letter === activeLetter ? 'btn-primary' : 'btn-outline-secondary'} me-1 mb-1`;
      btn.dataset.letter = letter;
      btn.textContent = letter;
      letterButtons.appendChild(btn);
    });
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'btn btn-sm btn-link mb-1';
    clearBtn.dataset.clearLetter = '1';
    clearBtn.textContent = 'Limpiar letra';
    letterButtons.appendChild(clearBtn);
  }

  /**
   * Construye grid HTML con información detallada del ave
   * @param {Object} ave - Objeto con datos del ave
   * @returns {string} HTML con grid de información
   */
  function buildInfoGrid(ave) {
    const entries = [
      ['Familia', ave.familia || ''],
      ['Tipo de ave', ave.tipo_ave || ''],
      ['Endémica', ave.endemica ? 'Sí' : 'No'],
      ['Peso', ave.peso || 'N/A'],
      ['Tamaño', ave.tamano || 'N/A'],
      ['Vida media', ave.vida_media !== null ? `${ave.vida_media} años` : 'N/A'],
      ['Categoría', ave.categoria_conservacion || 'N/A'],
      ['Plan de recuperación', ave.plan_recuperacion || 'N/A'],
      ['Época reproducción', ave.epoca_reproduccion || 'N/A'],
      ['Hábitat y cría', ave.habitat_y_cria || 'N/A'],
      ['Área de invernada', ave.area_invernada || 'N/A'],
      ['Patrón migratorio', ave.patron_migratorio || 'N/A']
    ];
    let html = '<div class="container-fluid"><div class="row">';
    entries.forEach(([labelRaw, valueRaw]) => {
      const label = escapeHtmlCat(labelRaw);
      const value = escapeHtmlCat(valueRaw);
      html += `<div class="col-6 col-md-3 mb-3"><div class="fw-bold small">${label}</div><div class="text-muted">${value}</div></div>`;
    });
    html += '</div></div>';
    return html;
  }

  /**
   * Renderiza tarjetas de aves y sus modales correspondientes
   * @param {Array<Object>} aves - Array de objetos ave a renderizar
   */
  function renderResults(aves) {
    grid.innerHTML = '';
    modalsRoot.innerHTML = '';
    if (!aves.length) {
      noResults.classList.remove('d-none');
      return;
    }
    noResults.classList.add('d-none');
    // Crear tarjeta y modal para cada ave
    aves.forEach((ave) => {
      const modalId = `modalAve${ave.id}`;
      const col = document.createElement('div');
      col.className = 'col-12 col-sm-6 col-md-4 col-lg-3 mb-4';
      col.innerHTML = `
        <article class="card h-100" data-bs-toggle="modal" data-bs-target="#${modalId}">
          <img src="${escapeHtmlCat(ave.imagen || DEFAULT_IMAGE)}" class="card-img-top ave-card-img" alt="${escapeHtmlCat(ave.nombre_comun || ave.nombre_cientifico)}">
          <div class="card-body">
            <h5 class="card-title">${escapeHtmlCat(ave.nombre_comun || 'Sin nombre')}</h5>
            <p class="text-muted mb-0"><em>${escapeHtmlCat(ave.nombre_cientifico || '')}</em></p>
          </div>
        </article>
      `;
      grid.appendChild(col);
      const modal = document.createElement('div');
      modal.className = 'modal fade';
      modal.id = modalId;
      modal.tabIndex = -1;
      const sciSafe = sanitizeForId(ave.nombre_cientifico || 'sin-nombre');
      const modalDialogId = `modalDialog-${sciSafe}-${ave.id}`;
      modal.innerHTML = `
        <div id="${modalDialogId}" class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">${escapeHtmlCat(ave.nombre_comun || 'Sin nombre')} (<em>${escapeHtmlCat(ave.nombre_cientifico || '')}</em>)</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
            </div>
            <div class="modal-body">
              <div id="carouselContainer${ave.id}" class="mb-3 d-flex justify-content-center align-items-center" style="min-height:200px;">
                <div class="spinner-border text-secondary" role="status"><span class="visually-hidden">Cargando imágenes...</span></div>
              </div>
              <p><strong>Descripción:</strong>
              ${escapeHtmlCat(ave.descripcion || 'Sin descripción')}</p>
              ${buildInfoGrid(ave)}
            </div>
          </div>
        </div>
      `;
      modalsRoot.appendChild(modal);
      populateCarouselForAve(ave, `carouselContainer${ave.id}`);
    });
  }

  /**
   * Verifica si una imagen existe en la URL especificada
   * @param {string} url - URL de la imagen a verificar
   * @returns {Promise<boolean>} True si la imagen existe
   */
  function checkImageExists(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }

  /**
   * Crea carousel con múltiples imágenes para el modal de un ave
   * Busca imágenes numeradas (ej: nombre1.jpg, nombre2.jpg, etc.)
   * @param {Object} ave - Objeto con datos del ave
   * @param {string} containerId - ID del contenedor donde insertar el carousel
   */
  async function populateCarouselForAve(ave, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const raw = ave.imagen || DEFAULT_IMAGE;
    const urlNoQuery = raw.split('?')[0].split('#')[0];
    const m = urlNoQuery.match(/^(.*)\.(jpg|jpeg|png)$/i);
    const base = m ? m[1] : urlNoQuery.replace(/\.(jpg|jpeg|png)$/i, '');
    const images = [];
    const firstUrl = base + '.jpg';
    if (await checkImageExists(firstUrl)) images.push(firstUrl);
    else {
      const firstPng = base + '.png';
      if (await checkImageExists(firstPng)) images.push(firstPng);
    }
    const MAX_IMAGES = 12;
    for (let i = 1; i <= MAX_IMAGES; i++) {
      const urlJ = `${base}${i}.jpg`;
      if (await checkImageExists(urlJ)) { images.push(urlJ); continue; }
      const urlP = `${base}${i}.png`;
      if (await checkImageExists(urlP)) { images.push(urlP); continue; }
      break;
    }
    if (!images.length) {
      container.innerHTML = `<img src="${escapeHtmlCat(DEFAULT_IMAGE)}" class="ave-modal-img" alt="${escapeHtmlCat(ave.nombre_comun || '')}">`;
      return;
    }
    const carouselId = `carouselAve${ave.id}`;
    const indicators = images.map((_, idx) => `
      <button type="button" data-bs-target="#${carouselId}" data-bs-slide-to="${idx}" ${idx === 0 ? 'class="active" aria-current="true"' : ''} aria-label="Slide ${idx + 1}"></button>
    `).join('');
    const items = images.map((src, idx) => `
      <div class="carousel-item${idx === 0 ? ' active' : ''}">
        <img src="${escapeHtmlCat(src)}" class="ave-modal-img d-block mx-auto" alt="${escapeHtmlCat(ave.nombre_comun || '')}">
      </div>
    `).join('');
    container.innerHTML = `
      <div id="${carouselId}" class="carousel slide" data-bs-ride="carousel">
        <div class="carousel-inner">${items}</div>
        <div class="carousel-indicators">${indicators}</div>
        <button class="carousel-control-prev" type="button" data-bs-target="#${carouselId}" data-bs-slide="prev">
          <span class="carousel-control-prev-icon" aria-hidden="true"></span>
          <span class="visually-hidden">Anterior</span>
        </button>
        <button class="carousel-control-next" type="button" data-bs-target="#${carouselId}" data-bs-slide="next">
          <span class="carousel-control-next-icon" aria-hidden="true"></span>
          <span class="visually-hidden">Siguiente</span>
        </button>
      </div>
    `;
  }

  /**
   * Hidrata formulario con valores desde el objeto request
   * @param {Object} request - Objeto con parámetros de búsqueda
   */
  function hydrateForm(request = {}) {
    campoInicialSelect.value = request.campoInicial || DEFAULT_CAMPO;
    nombreInput.value = request.nombre || '';
    vidaMinInput.value = request.vidaMin ?? '';
    vidaMaxInput.value = request.vidaMax ?? '';
    checkboxEndemica.checked = Boolean(request.filterEndemica);
    checkboxPlan.checked = Boolean(request.filterPlan);
  }

  /**
   * Actualiza el resumen con el número de resultados encontrados
   * @param {number} count - Número de especies encontradas
   */
  function updateSummary(count) {
    summary.textContent = count === 1 ? '1 especie encontrada' : `${count} especies encontradas`;
  }

  /**
   * Extrae parámetros del formulario y actualiza URL
   */
  function setParamsFromForm() {
    const formData = new FormData(form);
    const next = new URLSearchParams();
    formData.forEach((value, key) => { if (!value) return; next.set(key, value.toString()); });
    if (checkboxEndemica.checked) next.set('filterEndemica', '1');
    if (checkboxPlan.checked) next.set('filterPlan', '1');
    currentParams = next;
    syncUrl();
  }

  /**
   * Aplica o limpia filtro por letra inicial
   * @param {string} letter - Letra a filtrar, o vacío para limpiar
   */
  function applyLetter(letter) {
    if (letter) currentParams.set('letter', letter); else currentParams.delete('letter');
    syncUrl();
  }

  /**
   * Carga catálogo desde la API y renderiza resultados
   * Actualiza filtros, letras, tarjetas y resumen
   */
  async function loadCatalog() {
    spinner.classList.remove('d-none');
    try {
      const data = await api.route('catalogo', paramsObject());
      populateSelect(selectFamilia, data.filters.familias || [], data.request.filterFamilia || '');
      populateSelect(selectPeso, data.filters.pesos || [], data.request.filterPeso || '');
      populateSelect(selectTamano, data.filters.tamanos || [], data.request.filterTamano || '');
      populateSelect(selectCategoria, data.filters.categorias || [], data.request.filterCategoria || '');
      populateSelect(selectEpoca, data.filters.epocas || [], data.request.filterEpoca || '');
      hydrateForm(data.request);
      renderLetterButtons(data.letters || [], data.request.letter || '');
      renderResults(data.aves || []);
      updateSummary(data.count || 0);
    } catch (error) {
      console.error('Error loading catálogo', error);
      summary.textContent = 'No se pudo cargar el catálogo.';
      noResults.textContent = 'Ocurrió un error al obtener los datos.';
      noResults.classList.remove('d-none');
    } finally {
      spinner.classList.add('d-none');
    }
  }

  // Event listeners para formulario y botones
  form.addEventListener('submit', (event) => { event.preventDefault(); setParamsFromForm(); loadCatalog(); });
  document.getElementById('resetFilters').addEventListener('click', () => { form.reset(); currentParams = new URLSearchParams(); syncUrl(); loadCatalog(); });
  letterButtons.addEventListener('click', (event) => {
    if (event.target.dataset.letter) { applyLetter(event.target.dataset.letter); loadCatalog(); }
    else if (event.target.dataset.clearLetter) { applyLetter(''); loadCatalog(); }
  });

  // Cargar catálogo inicial
  loadCatalog();
});
