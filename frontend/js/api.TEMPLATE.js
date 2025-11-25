/**
 * TEMPLATE: API Configuration for InfinityFree Deployment
 *
 * INSTRUCTIONS:
 * 1. After deploying to InfinityFree, copy your subdomain URL
 * 2. Replace 'your-subdomain' in the API_BASE constant below
 * 3. Update the actual api.js file with your domain
 *
 * EXAMPLE:
 * If your InfinityFree subdomain is: ornithologia-mallorca.rf.gd
 * Then API_BASE should be: 'https://ornithologia-mallorca.rf.gd/api/index.php'
 */

// REPLACE 'your-subdomain' with your actual InfinityFree subdomain
const API_BASE = 'https://your-subdomain.rf.gd/api/index.php';

/*
 * EXAMPLES (choose the one that matches your setup):
 *
 * // If using InfinityFree subdomain:
 * const API_BASE = 'https://ornithologia-mallorca.rf.gd/api/index.php';
 *
 * // If using custom domain:
 * const API_BASE = 'https://yourdomain.com/api/index.php';
 *
 * // For local development:
 * const API_BASE = 'http://localhost:8081/index.php';
 */

const api = {
  /**
   * Realiza petición GET a una URL
   * @param {string} url - URL completa para la petición
   * @returns {Promise<Object>} Respuesta parseada como JSON
   */
  async get(url) {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`GET ${url} → ${response.status}`);
    }

    return response.json();
  },

  /**
   * Realiza petición POST a una URL
   * @param {string} url - URL completa para la petición
   * @param {Object} body - Datos a enviar en el cuerpo de la petición
   * @returns {Promise<Object>} Respuesta parseada como JSON
   */
  async post(url, body = {}) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`POST ${url} → ${response.status}`);
    }

    return response.json();
  },

  /**
   * Construye URL para una ruta específica del backend
   * @param {string} route - Nombre de la ruta (catalogo, mapas, etc.)
   * @param {Object} params - Parámetros GET a incluir en la URL
   * @returns {string} URL completa con parámetros
   */
  routeUrl(route, params = {}) {
    const url = new URL(API_BASE);
    url.searchParams.set('route', route);
    // Añadir parámetros filtrando valores nulos o vacíos
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return;
      }
      url.searchParams.set(key, value);
    });
    return url.toString();
  },

  /**
   * Atajo para hacer petición GET a una ruta del backend
   * @param {string} route - Nombre de la ruta
   * @param {Object} params - Parámetros GET opcionales
   * @returns {Promise<Object>} Respuesta parseada como JSON
   */
  async route(route, params = {}) {
    return this.get(this.routeUrl(route, params));
  }
};

// Exponer API globalmente para acceso desde otros scripts
window.api = api;
