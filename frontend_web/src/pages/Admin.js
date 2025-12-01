import React, { useEffect, useState } from 'react';
import { apiDelete, apiGet } from '../api/client';
import { StatusBadge } from '../components/UiBits';

export default function Admin() {
  const [filters, setFilters] = useState({
    status: '',
    user_id: '',
    q: '',
  });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [items, setItems] = useState([]);

  async function loadAdminList() {
    setLoading(true);
    setErr('');
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.user_id) params.append('user_id', filters.user_id);
      if (filters.q) params.append('q', filters.q);
      params.append('limit', '100');
      params.append('offset', '0');
      const data = await apiGet(`/deliveries?${params.toString()}`);
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e?.response?.data?.detail || 'Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdminList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyFilters(e) {
    e.preventDefault();
    loadAdminList();
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this delivery?')) return;
    try {
      await apiDelete(`/deliveries/${id}`);
      await loadAdminList();
    } catch (e) {
      setErr(e?.response?.data?.detail || 'Failed to delete');
    }
  }

  return (
    <div className="container">
      <h1>Admin Panel</h1>
      <p>Manage deliveries and users.</p>
      {err && <div style={{ color: 'red' }}>{err}</div>}

      <form onSubmit={applyFilters} style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr 2fr auto' }}>
        <select
          value={filters.status}
          onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
          style={{ padding: 8 }}
        >
          <option value="">Any status</option>
          <option value="created">created</option>
          <option value="assigned">assigned</option>
          <option value="in_transit">in_transit</option>
          <option value="delivered">delivered</option>
          <option value="canceled">canceled</option>
          <option value="failed">failed</option>
        </select>
        <input
          type="number"
          placeholder="User ID"
          value={filters.user_id}
          onChange={(e) => setFilters(f => ({ ...f, user_id: e.target.value }))}
          style={{ padding: 8 }}
        />
        <input
          placeholder="Search tracking or title"
          value={filters.q}
          onChange={(e) => setFilters(f => ({ ...f, q: e.target.value }))}
          style={{ padding: 8 }}
        />
        <button className="theme-toggle" type="submit">Apply</button>
      </form>

      <div style={{ marginTop: 16, textAlign: 'left' }}>
        {loading ? (
          <div>Loading...</div>
        ) : items.length === 0 ? (
          <div>No results.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: 8 }}>ID</th>
                  <th style={{ padding: 8 }}>Tracking</th>
                  <th style={{ padding: 8 }}>Title</th>
                  <th style={{ padding: 8 }}>Courier</th>
                  <th style={{ padding: 8 }}>Status</th>
                  <th style={{ padding: 8 }}>Owner</th>
                  <th style={{ padding: 8 }}>Created</th>
                  <th style={{ padding: 8 }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: 8 }}>{d.id}</td>
                    <td style={{ padding: 8 }}>{d.tracking_code}</td>
                    <td style={{ padding: 8 }}>{d.title || '-'}</td>
                    <td style={{ padding: 8 }}>{d.courier_name || '-'}</td>
                    <td style={{ padding: 8 }}><StatusBadge status={d.status} /></td>
                    <td style={{ padding: 8 }}>{d.user_id}</td>
                    <td style={{ padding: 8 }}>{new Date(d.created_at).toLocaleString()}</td>
                    <td style={{ padding: 8 }}>
                      <button className="theme-toggle" onClick={() => handleDelete(d.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
