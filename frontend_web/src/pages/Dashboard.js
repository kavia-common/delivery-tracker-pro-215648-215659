import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiGet, apiPost } from '../api/client';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../components/UiBits';

export default function Dashboard() {
  const { user } = useAuth();

  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);

  const [form, setForm] = useState({
    tracking_code: '',
    title: '',
    courier_name: '',
  });
  const [creating, setCreating] = useState(false);

  const canCreate = useMemo(() => !!form.tracking_code?.trim(), [form]);

  async function loadDeliveries() {
    setLoading(true);
    setErr('');
    try {
      const data = await apiGet('/deliveries?limit=20&offset=0');
      setDeliveries(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e?.response?.data?.detail || 'Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  }

  async function loadNotifications() {
    setNotifLoading(true);
    try {
      const data = await apiGet('/notifications?limit=10&offset=0&unread_only=false&since_hours=168');
      setNotifications(Array.isArray(data) ? data : []);
    } catch (e) {
      // ignore notifications failure for now
    } finally {
      setNotifLoading(false);
    }
  }

  useEffect(() => {
    loadDeliveries();
    loadNotifications();
  }, []);

  async function handleCreateDelivery(e) {
    e.preventDefault();
    if (!canCreate) return;
    setCreating(true);
    setErr('');
    try {
      // backend requires user_id in DeliveryCreate; regular users can only assign to themselves
      const payload = {
        tracking_code: form.tracking_code,
        title: form.title || null,
        courier_name: form.courier_name || null,
        user_id: user?.id,
      };
      await apiPost('/deliveries', payload);
      setForm({ tracking_code: '', title: '', courier_name: '' });
      await loadDeliveries();
    } catch (e) {
      setErr(e?.response?.data?.detail || 'Failed to create delivery');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="container">
      <h1>Dashboard</h1>
      <p>Welcome{user ? `, ${user.full_name || user.email}` : ''}!</p>

      <section style={{ marginTop: 16, textAlign: 'left' }}>
        <h2 style={{ margin: '16px 0 8px' }}>Quick create</h2>
        {err && <div style={{ color: 'red', marginBottom: 8 }}>{err}</div>}
        <form onSubmit={handleCreateDelivery} style={{ display: 'grid', gap: 8, gridTemplateColumns: '2fr 2fr 2fr auto' }}>
          <input
            placeholder="Tracking code"
            value={form.tracking_code}
            onChange={(e) => setForm(f => ({ ...f, tracking_code: e.target.value }))}
            required
            minLength={3}
            style={{ padding: 8 }}
          />
          <input
            placeholder="Title (optional)"
            value={form.title}
            onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
            style={{ padding: 8 }}
          />
          <input
            placeholder="Courier name (optional)"
            value={form.courier_name}
            onChange={(e) => setForm(f => ({ ...f, courier_name: e.target.value }))}
            style={{ padding: 8 }}
          />
          <button className="theme-toggle" type="submit" disabled={!canCreate || creating}>
            {creating ? 'Creating...' : 'Create'}
          </button>
        </form>
      </section>

      <section style={{ marginTop: 24, textAlign: 'left' }}>
        <h2 style={{ margin: '16px 0 8px' }}>Your Deliveries</h2>
        {loading ? (
          <div>Loading deliveries...</div>
        ) : deliveries.length === 0 ? (
          <div>No deliveries yet.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: 8 }}>Tracking</th>
                  <th style={{ padding: 8 }}>Title</th>
                  <th style={{ padding: 8 }}>Courier</th>
                  <th style={{ padding: 8 }}>Status</th>
                  <th style={{ padding: 8 }}>Created</th>
                  <th style={{ padding: 8 }}></th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: 8 }}>{d.tracking_code}</td>
                    <td style={{ padding: 8 }}>{d.title || '-'}</td>
                    <td style={{ padding: 8 }}>{d.courier_name || '-'}</td>
                    <td style={{ padding: 8 }}><StatusBadge status={d.status} /></td>
                    <td style={{ padding: 8 }}>{new Date(d.created_at).toLocaleString()}</td>
                    <td style={{ padding: 8 }}>
                      <Link to={`/deliveries/${d.id}`} className="App-link">Open</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section style={{ marginTop: 24, textAlign: 'left' }}>
        <h2 style={{ margin: '16px 0 8px' }}>Recent Notifications</h2>
        {notifLoading ? (
          <div>Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div>No recent notifications.</div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {notifications.map(n => (
              <li key={n.id} style={{ border: '1px solid var(--border-color)', borderRadius: 8, padding: 8, marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <strong>{n.title || n.type}</strong>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>{n.message}</div>
                {n.delivery_id && (
                  <div style={{ marginTop: 6 }}>
                    <Link to={`/deliveries/${n.delivery_id}`} className="App-link">View delivery</Link>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
