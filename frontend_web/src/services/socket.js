//
// Lightweight WebSocket manager for Delivery Tracker
// Provides a simple pub/sub API for notifications and per-delivery streams
//

const WS_BASE =
  process.env.REACT_APP_WS_URL ||
  (process.env.REACT_APP_BACKEND_URL
    ? process.env.REACT_APP_BACKEND_URL.replace(/^http/i, 'ws')
    : 'ws://localhost:3001');

let tokenProvider = null; // function returning current access token
let connections = {}; // key -> { ws, subs: Set<fn>, url, reconnectTimer, manualClosed }
let toastHandler = null;

// PUBLIC_INTERFACE
export function setTokenProvider(fn) {
  /** Set a function that returns the current access token string. */
  tokenProvider = fn;
}

// PUBLIC_INTERFACE
export function setToastHandler(fn) {
  /** Optionally set a function to show toasts for incoming notifications */
  toastHandler = fn;
}

function buildUrl(path) {
  const base = WS_BASE.replace(/\/+$/, '');
  const qs = new URLSearchParams();
  const token = tokenProvider ? tokenProvider() : null;
  if (token) qs.set('token', token);
  return `${base}${path}${qs.toString() ? `?${qs.toString()}` : ''}`;
}

function ensureConnection(key, path) {
  if (connections[key]?.ws && connections[key].ws.readyState <= 1) {
    return connections[key];
  }

  const url = buildUrl(path);
  const conn = {
    ws: null,
    subs: connections[key]?.subs || new Set(),
    url,
    reconnectTimer: null,
    manualClosed: false,
  };

  function connect() {
    try {
      const ws = new WebSocket(conn.url);
      conn.ws = ws;

      ws.onopen = () => {
        // noop
      };

      ws.onmessage = (ev) => {
        let payload = null;
        try {
          payload = JSON.parse(ev.data);
        } catch (_) {
          payload = ev.data;
        }
        for (const fn of conn.subs) {
          try {
            fn(payload);
          } catch (e) {
            // swallow subscriber error
            // eslint-disable-next-line no-console
            console.error('Subscriber error', e);
          }
        }

        // If this is a notification stream and we have a toast handler, try to show
        if (key === 'notifications' && toastHandler && payload && typeof payload === 'object') {
          const title = payload.title || payload.type || 'Notification';
          const message = payload.message || '';
          try {
            toastHandler(`${title}: ${message}`);
          } catch (_) {}
        }
      };

      ws.onclose = () => {
        if (conn.manualClosed) return;
        // simple backoff to reconnect
        clearTimeout(conn.reconnectTimer);
        conn.reconnectTimer = setTimeout(connect, 1500);
      };

      ws.onerror = () => {
        try {
          ws.close();
        } catch (_) {}
      };
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('WebSocket connect error', e);
      clearTimeout(conn.reconnectTimer);
      conn.reconnectTimer = setTimeout(connect, 2000);
    }
  }

  connect();
  connections[key] = conn;
  return conn;
}

// PUBLIC_INTERFACE
export function subscribeNotifications(callback) {
  /** Subscribe to /ws/notifications stream; returns an unsubscribe function */
  const key = 'notifications';
  const path = '/ws/notifications';
  const conn = ensureConnection(key, path);
  conn.subs.add(callback);
  return () => {
    unsubscribe(key, callback);
  };
}

// PUBLIC_INTERFACE
export function subscribeDelivery(deliveryId, callback) {
  /** Subscribe to /ws/deliveries/{delivery_id} stream; returns an unsubscribe function */
  const key = `delivery:${deliveryId}`;
  const path = `/ws/deliveries/${encodeURIComponent(deliveryId)}`;
  const conn = ensureConnection(key, path);
  conn.subs.add(callback);
  return () => {
    unsubscribe(key, callback);
  };
}

function unsubscribe(key, callback) {
  const conn = connections[key];
  if (!conn) return;
  conn.subs.delete(callback);
  if (conn.subs.size === 0) {
    // close connection cleanly
    try {
      conn.manualClosed = true;
      clearTimeout(conn.reconnectTimer);
      if (conn.ws && conn.ws.readyState <= 1) conn.ws.close(1000, 'client unsubscribe');
    } catch (_) {}
    delete connections[key];
  }
}

// PUBLIC_INTERFACE
export function disconnectAll() {
  /** Force close all active sockets (e.g., on logout) */
  Object.keys(connections).forEach((key) => {
    const conn = connections[key];
    try {
      conn.manualClosed = true;
      clearTimeout(conn.reconnectTimer);
      if (conn.ws && conn.ws.readyState <= 1) conn.ws.close(1000, 'client shutdown');
    } catch (_) {}
  });
  connections = {};
}

// PUBLIC_INTERFACE
export function getWsBase() {
  /** Returns the WS base URL being used (from env or default) */
  return WS_BASE;
}
