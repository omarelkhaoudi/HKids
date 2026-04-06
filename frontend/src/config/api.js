// src/config/api.js

export const API_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, '') || 'https://hkids.onrender.com';

// ❌ On supprime complètement le /api
const API_BASE = API_URL;

export function buildApiUrl(path) {
  if (!path) return API_BASE;
  const sanitizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${sanitizedPath}`;
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