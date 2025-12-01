import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';

const ToastsContext = createContext(null);

// PUBLIC_INTERFACE
export function ToastsProvider({ children }) {
  /** Provides lightweight toast state and render container */
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, ttlMs = 3500) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((arr) => [...arr, { id, message }]);
    setTimeout(() => {
      setToasts((arr) => arr.filter((t) => t.id !== id));
    }, ttlMs);
  }, []);

  const value = useMemo(() => ({ push, count: toasts.length }), [push, toasts.length]);

  return (
    <ToastsContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'fixed',
          right: 16,
          bottom: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          zIndex: 9999,
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 8,
              padding: '8px 12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              maxWidth: 360,
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastsContext.Provider>
  );
}

// PUBLIC_INTERFACE
export function useToasts() {
  /** Access toast push() and current count */
  const ctx = useContext(ToastsContext);
  if (!ctx) throw new Error('useToasts must be used inside ToastsProvider');
  return ctx;
}
