import { API_URL } from '../config/api.js';

/**
 * Obtient l'URL de base du backend (sans /api)
 * Utilise la même logique que getImageBaseUrl pour la cohérence
 */
function getBackendBaseUrl() {
  // Priority 1: Use VITE_API_URL if available (most reliable in production)
  const viteApiUrl = import.meta.env.VITE_API_URL;
  if (viteApiUrl) {
    const baseUrl = viteApiUrl.replace(/\/api\/?$/, '');
    return baseUrl;
  }
  
  // Priority 2: Use API_URL if it's an absolute URL (production)
  if (API_URL && (API_URL.startsWith('http://') || API_URL.startsWith('https://'))) {
    const baseUrl = API_URL.replace(/\/api\/?$/, '');
    return baseUrl;
  }
  
  // Priority 3: If API_URL is relative (starts with /), we're in dev mode with proxy
  if (API_URL && API_URL.startsWith('/')) {
    return 'http://localhost:3000';
  }
  
  // Last resort
  return 'http://localhost:3000';
}

/**
 * Obtient l'URL complète pour un fichier uploadé
 * @param {string} filePath - Le chemin du fichier (ex: /uploads/books/file.pdf)
 * @returns {string} L'URL complète du fichier
 */
export function getFileUrl(filePath) {
  if (!filePath) {
    return null;
  }

  // Si le chemin commence déjà par http:// ou https://, le retourner tel quel
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }

  // Normaliser le chemin pour s'assurer qu'il commence par /
  const normalizedPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
  
  // Obtenir l'URL de base du backend
  const baseUrl = getBackendBaseUrl();
  
  return `${baseUrl}${normalizedPath}`;
}

