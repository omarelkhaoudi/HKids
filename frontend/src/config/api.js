// Configuration de l'URL de l'API
// En développement : utilise le proxy Vite (/api)
// En production : utilise VITE_API_URL ou l'URL par défaut
const getApiUrl = () => {
  // Si VITE_API_URL est défini (production), l'utiliser
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Sinon, utiliser l'URL relative (fonctionne avec le proxy Vite en dev)
  return '/api';
};

export const API_URL = getApiUrl();

// Log de debug pour vérifier l'URL utilisée en production
if (typeof window !== 'undefined') {
  // S'affiche une seule fois au chargement de l'app
  console.log('[HKids] API_URL configuré =', API_URL);
}

export default API_URL;

