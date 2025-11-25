/**
 * API Wrapper para comunicación con el backend
 * Proporciona métodos para hacer peticiones HTTP al servidor
 */

// URL base del backend API
const API_BASE = 'http://localhost:8081/index.php';

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
