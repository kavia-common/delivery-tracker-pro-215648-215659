import React, { useEffect, useState } from 'react';
import { apiGet } from '../api/client';
import { StatusBadge } from '../components/UiBits';

export default function History() {
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    status_filter: '',
    courier: '',
    q: '',
  });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, limit: 50, offset: 0 });

  async function loadHistory() {
    setLoading(true);
    setErr('');
    try {
      const params = new URLSearchParams();
      if (filters.start_date) params.append('start_date', new Date(filters.start_date).toISOString());
      if (filters.end_date) params.append('end_date', new Date(filters.end_date).toISOString());
      if (filters.status_filter) params.append('status_filter', filters.status_filter);
      if (filters.courier) params.append('courier', filters.courier);
      if (filters.q) params.append('q', filters.q);
      params.append('limit', String(meta.limit));
      params.append('offset', String(meta.offset));
      const data = await apiGet(`/history?${params.toString()}`);
      setItems(data.items || []);
      setMeta(data.meta || { total: 0, limit: 50, offset: 0 });
    } catch (e) {
      setErr(e?.response?.data?.detail || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyFilters(e) {
    e.preventDefault();
    setMeta(m => ({ ...m, offset: 0 }));
    loadHistory();
  }

  async function page(next = 0) {
    const newOffset = Math.max(0, meta.offset + next);
    setMeta(m => ({ ...m, offset: newOffset }));
    setTimeout(loadHistory, 0);
  }

  return (
    <div className="container">
      <h1>History</h1>
      <p>View historical deliveries and status events.</p>

      {err && <div style={{ color: 'red' }}>{err}</div>}

      <form onSubmit={applyFilters} style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr 1fr 1fr auto' }}>
        <input
          type="date"
          value={filters.start_date}
          onChange={(e) => setFilters(f => ({ ...f, start_date: e.target.value }))}
          style={{ padding: 8 }}
        />
        <input
          type="date"
          value={filters.end_date}
          onChange={(e) => setFilters(f => ({ ...f, end_date: e.target.value }))}
          style={{ padding: 8 }}
        />
        <select
          value={filters.status_filter}
          onChange={(e) => setFilters(f => ({ ...f, status_filter: e.target.value }))}
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
          placeholder="Courier or search"
          value={filters.courier}
          onChange={(e) => setFilters(f => ({ ...f, courier: e.target.value }))}
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
                  <th style={{ padding: 8 }}>Created</th>
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
                    <td style={{ padding: 8 }}>{new Date(d.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button className="theme-toggle" onClick={() => page(-meta.limit)} disabled={meta.offset <= 0}>
          Prev
        </button>
        <button className="theme-toggle" onClick={() => page(meta.limit)} disabled={meta.offset + meta.limit >= meta.total}>
          Next
        </button>
        <div style={{ alignSelf: 'center' }}>
          {meta.offset + 1}-{Math.min(meta.offset + meta.limit, meta.total)} of {meta.total}
        </div>
      </div>
    </div>
  );
}
