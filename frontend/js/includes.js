/**
 * Sistema de includes para cargar partials HTML (header, footer)
 * Usa localStorage para caché y resalta enlaces activos según la ruta actual
 */

document.addEventListener('DOMContentLoaded', () => {
  const includeTargets = document.querySelectorAll('[data-include]');

  includeTargets.forEach(async (target) => {
    const url = target.getAttribute('data-include');
    const cacheKey = `include:${url}`;

    /**
     * Resalta el enlace de navegación activo según la ruta actual
     * @param {HTMLElement} root - Elemento raíz donde buscar enlaces
     */
    const highlightActiveLink = (root) => {
      const currentPath = window.location.pathname.replace(/\/index\.html$/, '/');
      root.querySelectorAll('.nav-link').forEach((link) => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (!href) return;
        const normalized = href.replace(/\/index\.html$/, '/');
        if (currentPath === normalized) {
          link.classList.add('active');
        }
      });
    };

    /**
     * Establece el contenido HTML en el target y resalta enlaces
     * @param {string} html - Contenido HTML a insertar
     */
    const setContent = (html) => {
      target.innerHTML = html;
      target.classList.add('ready');
      target.removeAttribute('data-include');
      highlightActiveLink(target);
    };

    try {
      // Intentar cargar desde caché de localStorage primero
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          setContent(cached);
        }
      } catch (storageError) {
        console.warn('localStorage read failed', storageError);
      }

      // Obtener contenido actualizado del servidor
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Include request failed: ${response.status}`);
      }
      const html = await response.text();
      setContent(html);

      // Actualizar caché con nuevo contenido
      try {
        localStorage.setItem(cacheKey, html);
      } catch (storageError) {
        console.warn('localStorage write failed', storageError);
      }
    } catch (error) {
      console.error(`Failed to include ${url}`, error);
      target.classList.add('ready');
      target.style.visibility = 'visible';
    }
  });
});
