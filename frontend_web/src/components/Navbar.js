import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getApiBase, getAccessToken } from '../api/client';

export default function Navbar() {
  const { user, logout } = useAuth();

  const exportHref = (() => {
    if (!user) return '#';
    const base = getApiBase() || '';
    // Add token for quick manual download in same origin cases
    const token = getAccessToken();
    const qs = token ? `?token=${encodeURIComponent(token)}` : '';
    return `${base}/deliveries/export${qs}`;
  })();

  return (
    <nav className="navbar" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 16px',
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-color)'
    }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Link to="/" className="App-link" style={{ fontWeight: 700 }}>Delivery Tracker</Link>
        <Link to="/" className="App-link">Dashboard</Link>
        <Link to="/history" className="App-link">History</Link>
        {user?.role === 'admin' && (
          <>
            <Link to="/admin" className="App-link">Admin</Link>
            <a href={exportHref} className="App-link" rel="noreferrer">Export CSV</a>
          </>
        )}
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {!user && (
          <>
            <Link to="/login" className="App-link">Login</Link>
            <Link to="/register" className="App-link">Register</Link>
          </>
        )}
        {user && (
          <>
            <span style={{ color: 'var(--text-primary)' }}>
              {user.full_name || user.email}
            </span>
            <button className="theme-toggle" onClick={logout} aria-label="Log out">
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
