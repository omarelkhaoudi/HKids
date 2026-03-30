// src/api.js
const API_URL = import.meta.env.VITE_API_URL;

// Signup
export async function signup(name, email, password) {
  const response = await fetch(`${API_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  return response.json();
}

// Login
export async function login(email, password) {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
}

// Reset Rate Limit (optionnel)
export async function resetRateLimit(email) {
  const response = await fetch(`${API_URL}/api/reset-rate-limit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return response.json();
}