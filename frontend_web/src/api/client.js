import axios from 'axios';

/**
 * Axios API client configured with base URL and auth interceptors.
 * Uses REACT_APP_API_BASE from environment for base URL.
 */

const API_BASE = process.env.REACT_APP_API_BASE || '';

/**
 * Simple in-memory token cache to avoid frequent localStorage reads.
 */
let inMemoryToken = null;

// PUBLIC_INTERFACE
export function setAccessToken(token) {
  /** Set access token to be used by the API client */
  inMemoryToken = token;
  if (token) {
    localStorage.setItem('access_token', token);
  } else {
    localStorage.removeItem('access_token');
  }
}

// PUBLIC_INTERFACE
export function getAccessToken() {
  /** Get the current access token */
  if (inMemoryToken) return inMemoryToken;
  const stored = localStorage.getItem('access_token');
  inMemoryToken = stored;
  return stored;
}

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach access token
client.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Simple response error logging
client.interceptors.response.use(
  (resp) => resp,
  (error) => {
    // Optional: Handle 401s globally here if needed
    return Promise.reject(error);
  }
);

// PUBLIC_INTERFACE
export async function apiPost(url, data, config = {}) {
  /** POST helper that returns response.data */
  const res = await client.post(url, data, config);
  return res.data;
}

// PUBLIC_INTERFACE
export async function apiGet(url, config = {}) {
  /** GET helper that returns response.data */
  const res = await client.get(url, config);
  return res.data;
}

// PUBLIC_INTERFACE
export async function apiDelete(url, config = {}) {
  /** DELETE helper that returns response.data or true on 204 */
  const res = await client.delete(url, config);
  return res.data ?? true;
}

// PUBLIC_INTERFACE
export function getApiBase() {
  /** Expose API base for debugging */
  return API_BASE;
}

export default client;
