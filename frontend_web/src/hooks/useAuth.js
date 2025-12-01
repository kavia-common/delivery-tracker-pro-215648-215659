import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import client, { apiGet, apiPost, setAccessToken, getAccessToken, setRefreshToken, onUnauthorized } from '../api/client';

/**
 * Auth context to store current user and token handling.
 */

const AuthContext = createContext(null);

// PUBLIC_INTERFACE
export function AuthProvider({ children }) {
  /**
   * PUBLIC_INTERFACE
   * Provides authentication state and actions to children.
   */
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  // load user from token on mount and register unauthorized handler
  useEffect(() => {
    onUnauthorized(() => {
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
    });

    const token = getAccessToken();
    if (!token) {
      setInitializing(false);
      return;
    }
    // Try fetch profile
    apiGet('/auth/me')
      .then((me) => {
        setUser(me);
      })
      .catch(() => {
        // invalid token
        setAccessToken(null);
        setRefreshToken(null);
        setUser(null);
      })
      .finally(() => setInitializing(false));
  }, []);

  const login = async (email, password) => {
    /**
     * PUBLIC_INTERFACE
     * Perform password login with backend form-encoded endpoint.
     * Accepts:
     *  - email (string)
     *  - password (string)
     * Returns current user profile, and stores access/refresh tokens if provided.
     */
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);
    // Backend uses application/x-www-form-urlencoded
    const res = await client.post('/auth/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const payload = res.data || res;
    const access_token = payload?.access_token;
    const me = payload?.user;
    const refresh_token = payload?.refresh_token;
    setAccessToken(access_token || null);
    if (refresh_token) setRefreshToken(refresh_token);
    setUser(me || null);
    return me;
  };

  const register = async (email, password, full_name) => {
    /**
     * PUBLIC_INTERFACE
     * Register a user; then auto-login using provided credentials.
     */
    await apiPost('/auth/register', { email, password, full_name });
    return login(email, password);
  };

  const logout = () => {
    /**
     * PUBLIC_INTERFACE
     * Clears auth state and tokens.
     */
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, initializing, login, register, logout }),
    [user, initializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// PUBLIC_INTERFACE
export function useAuth() {
  /** Hook to access authentication context */
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// PUBLIC_INTERFACE
export function ProtectedRoute({ children, roles }) {
  /**
   * PUBLIC_INTERFACE
   * Protects enclosed route; optionally restricts to roles (e.g., ['admin']).
   */
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return <div style={{ padding: 24 }}>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
