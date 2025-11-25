/**
 * Script de "Sobre Nosotros"
 * Carga información del equipo y estadísticas de especies
 */

/**
 * Escapa caracteres HTML para prevenir XSS
 * @param {*} value - Valor a escapar
 * @returns {string} String escapado
 */
const escapeHtmlSobre = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

document.addEventListener('DOMContentLoaded', () => {
  const teamGrid = document.getElementById('teamGrid');
  const teamEmpty = document.getElementById('teamEmpty');
  const speciesCount = document.getElementById('speciesCount');

  /**
   * Carga datos del equipo y estadísticas desde la API
   */
  async function loadSobreNosotros() {
    try {
      const data = await api.route('sobreNosotros');
      const equipo = data.equipo || [];
      const stats = data.stats || {};

      if (typeof stats.total_especies === 'number') {
        speciesCount.textContent = stats.total_especies.toString();
      } else {
        speciesCount.textContent = 'N/A';
      }

      if (!equipo.length) {
        teamEmpty.classList.remove('d-none');
        return;
      }

      const destacados = equipo.slice(0, 4);
      teamGrid.innerHTML = '';

      destacados.forEach((miembro) => {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-3';
        col.innerHTML = `
          <img src="${escapeHtmlSobre(miembro.fotografia || '/img/People/guy1.jpg')}"
               alt="${escapeHtmlSobre(miembro.nombre || 'Miembro del equipo')}"
               class="team-photo mb-3">
          <h5 class="mb-1">${escapeHtmlSobre(miembro.nombre || '')}</h5>
          <p class="text-muted small">${escapeHtmlSobre(miembro.rol || '')}</p>
        `;
        teamGrid.appendChild(col);
      });
    } catch (error) {
      console.error('Error loading Sobre Nosotros data', error);
      teamEmpty.classList.remove('d-none');
      teamGrid.innerHTML = '';
    }
  }

  // Inicializar página
  loadSobreNosotros();
});
