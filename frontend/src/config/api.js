import { Capacitor } from '@capacitor/core';

const configuredApiUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');

function resolveDefaultApiUrl() {
  if (configuredApiUrl) return configuredApiUrl;
  // Dev: relative /api URLs go through the Vite proxy (see vite.config.js).
  if (import.meta.env.DEV) return '';
  if (Capacitor.isNativePlatform()) return '';
  return globalThis.location?.origin || '';
}

export const API_URL = resolveDefaultApiUrl();

if (Capacitor.isNativePlatform() && !API_URL) {
  console.error(
    'VITE_API_URL is required for Android builds. Example: VITE_API_URL=https://your-backend.example.com'
  );
}

// ✅ On restore le /api prefix car les routes backend sont sous /api/
const API_BASE = API_URL;

export function buildApiUrl(path) {
  if (!path) return API_BASE;
  const sanitizedPath = path.startsWith('/') ? path : `/${path}`;
  // Add /api prefix if not already present
  const apiPath = sanitizedPath.startsWith('/api') ? sanitizedPath : `/api${sanitizedPath}`;
  return `${API_BASE}${apiPath}`;
}
