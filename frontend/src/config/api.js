// src/config/api.js

export const API_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, '') || 'https://hkids.onrender.com';

// ✅ On restore le /api prefix car les routes backend sont sous /api/
const API_BASE = API_URL;

export function buildApiUrl(path) {
  if (!path) return API_BASE;
  const sanitizedPath = path.startsWith('/') ? path : `/${path}`;
  // Add /api prefix if not already present
  const apiPath = sanitizedPath.startsWith('/api') ? sanitizedPath : `/api${sanitizedPath}`;
  return `${API_BASE}${apiPath}`;
}

export async function loginRequest(username, password) {
  const response = await fetch(buildApiUrl('/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return response.json();
}

export async function signupRequest(username, password) {
  const response = await fetch(buildApiUrl('/auth/signup'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return response.json();
}