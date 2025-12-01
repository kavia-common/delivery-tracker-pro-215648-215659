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
let refreshInFlight = null;
let logoutHandler = null;

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

// PUBLIC_INTERFACE
export function setRefreshToken(token) {
  /** Store refresh token (if backend issues one) */
  if (token) {
    localStorage.setItem('refresh_token', token);
  } else {
    localStorage.removeItem('refresh_token');
  }
}

// PUBLIC_INTERFACE
export function getRefreshToken() {
  /** Retrieve refresh token */
  return localStorage.getItem('refresh_token');
}

// PUBLIC_INTERFACE
export function onUnauthorized(fn) {
  /** Register a global logout/unauthorized handler invoked when refresh fails */
  logoutHandler = fn;
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

async function refreshAccessToken() {
  const refresh_token = getRefreshToken();
  if (!refresh_token) throw new Error('No refresh token');
  const res = await axios.post(
    `${API_BASE}/auth/refresh`,
    { refresh_token },
    { headers: { 'Content-Type': 'application/json' } }
  );
  const data = res.data || res;
  if (!data?.access_token) {
    throw new Error('Invalid refresh response');
  }
  setAccessToken(data.access_token);
  return data.access_token;
}

// Response interceptor: try token refresh on 401 once
client.interceptors.response.use(
  (resp) => resp,
  async (error) => {
    const original = error.config || {};
    const status = error?.response?.status;

    if (status === 401 && !original._retry) {
      original._retry = true;

      try {
        if (!refreshInFlight) {
          refreshInFlight = refreshAccessToken().finally(() => {
            refreshInFlight = null;
          });
        }
        const newToken = await refreshInFlight;
        // retry original request with new token
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return client(original);
      } catch (e) {
        // refresh failed -> logout if handler set
        if (logoutHandler) {
          try {
            logoutHandler();
          } catch (_) {}
        }
      }
    }
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
