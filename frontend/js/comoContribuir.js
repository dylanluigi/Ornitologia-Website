/**
 * Script de "Cómo Contribuir"
 * Renderiza carousel de planes y secciones de lugares/parques
 */

/**
 * Escapa caracteres HTML para prevenir XSS
 * @param {*} value - Valor a escapar
 * @returns {string} String escapado
 */
const escapeHtmlCc = (value) => {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

document.addEventListener('DOMContentLoaded', () => {
  const carrusel = document.getElementById('carousel-planes');
  const lugaresRoot = document.getElementById('lugaresRoot');
  const lugaresEmpty = document.getElementById('lugaresEmpty');

  /**
   * Convierte texto a slug URL-friendly
   * @param {*} value - Texto a convertir
   * @returns {string} Slug normalizado
   */
  const slugify = (value) => {
    if (value === null || value === undefined) return '';
    return String(value)
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  };

  /**
   * Mapea un lugar a su contenedor de sección correspondiente
   * @param {Object} lugar - Objeto con datos del lugar
   * @returns {HTMLElement} Elemento contenedor donde insertar el lugar
   */
  const mapLugarToContainerElement = (lugar) => {
    if (!lugar) return lugaresRoot;
    if (lugar.section) {
      const el = document.getElementById(lugar.section);
      if (el) return el;
    }
    const name = (lugar.nombre || '').toLowerCase();
    if (/centro|consorcio/i.test(name)) return document.getElementById('CentrosdeRecuperación') || lugaresRoot;
    if (/jardines/i.test(name)) return document.getElementById('JardinesBotánicos') || lugaresRoot;
    if (/parc|paratge|reserva|monument/i.test(name)) return document.getElementById('ParquesNaturales') || lugaresRoot;
    return lugaresRoot;
  };

  /**
   * Renderiza carousel de planes de recuperación
   * @param {Array<Object>} planes - Array de planes a mostrar
   */
  function renderCarousel(planes = []) {
    const carruselRoot = document.getElementById('carousel-planes');
    if (!carruselRoot) return;
    carruselRoot.innerHTML = '';
    planes.forEach(plan => {
      const card = document.createElement('div');
      card.className = 'carousel-card';
      card.innerHTML = `
        <a href="${escapeHtmlCc(plan.url)}" target="_blank">
          <img src="${escapeHtmlCc(plan.imagen)}" alt="${escapeHtmlCc(plan.titulo)}">
          <h4>${escapeHtmlCc(plan.titulo)}</h4>
        </a>
      `;
      carruselRoot.appendChild(card);
    });
  }

  /**
   * Renderiza secciones de lugares con layout alternado
   * @param {Array<Object>} lugares - Array de lugares/parques a renderizar
   */
  function renderLugares(lugares = []) {
    lugaresRoot.innerHTML = '';
    if (!lugares.length) {
      lugaresEmpty.classList.remove('d-none');
      return;
    }
    lugaresEmpty.classList.add('d-none');
    lugares.forEach((lugar, index) => {
      const section = document.createElement('section');
      section.className = `py-5${index % 2 !== 0 ? ' bg-light' : ''}`;
      section.innerHTML = `
        <div class="container">
          <div class="row align-items-center">
            ${index % 2 === 0
              ? `
                <div class="col-md-6">
                  <h2>${escapeHtmlCc(lugar.nombre)}</h2>
                  <p>${escapeHtmlCc(lugar.descripcion)}</p>
                  <p><strong>Ubicación:</strong> ${escapeHtmlCc(lugar.ubicacion)}</p>
                  ${lugar.url ? `<a href="${escapeHtmlCc(lugar.url)}" target="_blank" rel="noopener" class="btn btn-primary">Más información</a>` : ''}
                </div>
                <div class="col-md-6 d-flex">
                  <div class="lugar-image-wrapper">
                    <img src="${escapeHtmlCc(lugar.imagen || '/img/Lugares/ParcNaturaldeMondrago.jpg')}"
                        alt="${escapeHtmlCc(lugar.nombre)}"
                        class="img-fluid rounded lugar-image">
                  </div>
                </div>
              `
              : `
                <div class="col-md-6 order-md-2">
                  <h2>${escapeHtmlCc(lugar.nombre)}</h2>
                  <p>${escapeHtmlCc(lugar.descripcion)}</p>
                  <p><strong>Ubicación:</strong> ${escapeHtmlCc(lugar.ubicacion)}</p>
                  ${lugar.url ? `<a href="${escapeHtmlCc(lugar.url)}" target="_blank" rel="noopener" class="btn btn-primary">Más información</a>` : ''}
                </div>
                <div class="col-md-6 order-md-1 d-flex">
                  <div class="lugar-image-wrapper">
                    <img src="${escapeHtmlCc(lugar.imagen || '/img/Lugares/ParcNaturaldeMondrago.jpg')}"
                        alt="${escapeHtmlCc(lugar.nombre)}"
                        class="img-fluid rounded lugar-image">
                  </div>
                </div>

              `}
          </div>
        </div>
      `;

      const wrapper = document.createElement('div');
      wrapper.className = 'lugar-wrapper';
      const slugId = lugar.id ? `lugar-${slugify(lugar.id)}` : `lugar-${slugify(lugar.nombre)}-${index}`;
      wrapper.id = slugId;
      wrapper.setAttribute('data-lugar-name', escapeHtmlCc(lugar.nombre));
      wrapper.setAttribute('data-lugar-index', String(index));
      wrapper.appendChild(section);
      const parentEl = mapLugarToContainerElement(lugar) || lugaresRoot;
      parentEl.appendChild(wrapper);
    });
  }

  /**
   * Carga datos desde la API y renderiza la página
   */
  async function loadPage() {
    try {
      const data = await api.route('comoContribuir');
      renderCarousel(data.carousel || []);
      renderLugares(data.lugares || []);
    } catch (error) {
      console.error('Error loading Cómo Contribuir data', error);
      lugaresEmpty.textContent = 'No se pudo cargar la información.';
      lugaresEmpty.classList.remove('d-none');
    }
  }

  // Inicializar página
  loadPage();
});
