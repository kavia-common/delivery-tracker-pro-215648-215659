import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiGet, apiPost } from '../api/client';
import { StatusBadge, MapPlaceholder } from '../components/UiBits';
import { useAuth } from '../hooks/useAuth';
import { subscribeDelivery } from '../services/socket';

export default function DeliveryDetails() {
  const { id } = useParams();
  const deliveryId = useMemo(() => Number(id), [id]);
  const { user } = useAuth();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const [statusForm, setStatusForm] = useState({ status: 'in_transit', note: '' });
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  const [locForm, setLocForm] = useState({ latitude: '', longitude: '', accuracy_m: '' });
  const [locSubmitting, setLocSubmitting] = useState(false);

  async function loadDetail() {
    setLoading(true);
    setErr('');
    try {
      const data = await apiGet(`/deliveries/${deliveryId}`);
      setDetail(data);
    } catch (e) {
      setErr(e?.response?.data?.detail || 'Failed to load delivery');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (deliveryId > 0) loadDetail();
  }, [deliveryId]);

  // Realtime updates for this delivery
  useEffect(() => {
    if (!deliveryId) return;
    const unsub = subscribeDelivery(deliveryId, (msg) => {
      // Expected message types: { type: 'status_update'|'location_update'|'delivery_update', data: {...} }
      if (!msg || typeof msg !== 'object') return;
      setDetail((prev) => {
        if (!prev) return prev;
        const next = { ...prev };
        if (msg.type === 'delivery_update' && msg.data?.delivery) {
          next.delivery = { ...next.delivery, ...msg.data.delivery };
        }
        if (msg.type === 'status_update' && msg.data?.event) {
          next.delivery = { ...next.delivery, status: msg.data.event.status };
          const events = Array.isArray(next.recent_status_events) ? next.recent_status_events.slice(0) : [];
          events.unshift(msg.data.event);
          next.recent_status_events = events.slice(0, 20);
        }
        if (msg.type === 'location_update' && msg.data?.location) {
          next.latest_location = msg.data.location;
        }
        return next;
      });
    });
    return () => {
      try { unsub && unsub(); } catch (_) {}
    };
  }, [deliveryId]);

  async function submitStatus(e) {
    e.preventDefault();
    setStatusSubmitting(true);
    setErr('');
    try {
      await apiPost(`/deliveries/${deliveryId}/status`, {
        status: statusForm.status,
        note: statusForm.note || null,
      });
      setStatusForm({ status: 'in_transit', note: '' });
      // Do not force reload; realtime will update. Keep fallback:
      // await loadDetail();
    } catch (e) {
      setErr(e?.response?.data?.detail || 'Failed to append status');
    } finally {
      setStatusSubmitting(false);
    }
  }

  async function submitLocation(e) {
    e.preventDefault();
    const lat = parseFloat(locForm.latitude);
    const lng = parseFloat(locForm.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setErr('Latitude and longitude are required and must be numbers.');
      return;
    }
    setLocSubmitting(true);
    setErr('');
    try {
      await apiPost(`/deliveries/${deliveryId}/location`, {
        latitude: lat,
        longitude: lng,
        accuracy_m: locForm.accuracy_m ? parseFloat(locForm.accuracy_m) : null,
        source: 'web',
      });
      setLocForm({ latitude: '', longitude: '', accuracy_m: '' });
      // Realtime will reflect the change
    } catch (e) {
      setErr(e?.response?.data?.detail || 'Failed to ingest location');
    } finally {
      setLocSubmitting(false);
    }
  }

  if (loading) return <div className="container">Loading...</div>;
  if (err) return <div className="container" style={{ color: 'red' }}>{err}</div>;
  if (!detail) return <div className="container">Not found</div>;

  const d = detail.delivery;
  const latestLoc = detail.latest_location;

  const canModify = user && (user.role === 'admin' || user.id === d.user_id);

  return (
    <div className="container">
      <h1>Delivery #{d.id}</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
        <div>
          <div style={{ border: '1px solid var(--border-color)', borderRadius: 8, padding: 12, textAlign: 'left' }}>
            <h2 style={{ marginTop: 0, marginBottom: 8 }}>{d.title || d.tracking_code}</h2>
            <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <Info label="Tracking code" value={d.tracking_code} />
              <Info label="Courier" value={d.courier_name || '-'} />
              <Info label="Status" value={<StatusBadge status={d.status} />} />
              <Info label="Owner user id" value={d.user_id} />
              <Info label="Expected at" value={d.expected_delivery_at ? new Date(d.expected_delivery_at).toLocaleString() : '-'} />
              <Info label="Created" value={new Date(d.created_at).toLocaleString()} />
            </div>
            {d.description && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Description</div>
                <div>{d.description}</div>
              </div>
            )}
          </div>

          <div style={{ marginTop: 16, border: '1px solid var(--border-color)', borderRadius: 8, padding: 12, textAlign: 'left' }}>
            <h3 style={{ marginTop: 0 }}>Recent Status Events</h3>
            {detail.recent_status_events?.length ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {detail.recent_status_events.map(ev => (
                  <li key={ev.id} style={{ borderBottom: '1px solid var(--border-color)', padding: '8px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <StatusBadge status={ev.status} />
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {ev.timestamp ? new Date(ev.timestamp).toLocaleString() : ''}
                      </span>
                    </div>
                    {ev.note && <div style={{ fontSize: 14, marginTop: 4 }}>{ev.note}</div>}
                  </li>
                ))}
              </ul>
            ) : (
              <div>No status events yet.</div>
            )}
          </div>
        </div>

        <div>
          <div style={{ border: '1px solid var(--border-color)', borderRadius: 8, padding: 12, textAlign: 'left' }}>
            <h3 style={{ marginTop: 0 }}>Latest Location</h3>
            {latestLoc ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
                  <Info label="Latitude" value={latestLoc.latitude} />
                  <Info label="Longitude" value={latestLoc.longitude} />
                  <Info label="Accuracy (m)" value={latestLoc.accuracy_m ?? '-'} />
                  <Info label="Timestamp" value={latestLoc.timestamp ? new Date(latestLoc.timestamp).toLocaleString() : '-'} />
                </div>
                <MapPlaceholder latitude={latestLoc.latitude} longitude={latestLoc.longitude} height={220} />
              </>
            ) : (
              <>
                <div>No location yet.</div>
                <MapPlaceholder height={180} />
              </>
            )}
          </div>

          {canModify && (
            <>
              <div style={{ marginTop: 16, border: '1px solid var(--border-color)', borderRadius: 8, padding: 12, textAlign: 'left' }}>
                <h3 style={{ marginTop: 0 }}>Append Status</h3>
                <form onSubmit={submitStatus} style={{ display: 'grid', gap: 8 }}>
                  <select
                    value={statusForm.status}
                    onChange={(e) => setStatusForm(s => ({ ...s, status: e.target.value }))}
                    style={{ padding: 8 }}
                  >
                    <option value="created">created</option>
                    <option value="assigned">assigned</option>
                    <option value="in_transit">in_transit</option>
                    <option value="delivered">delivered</option>
                    <option value="canceled">canceled</option>
                    <option value="failed">failed</option>
                  </select>
                  <textarea
                    placeholder="Note (optional)"
                    value={statusForm.note}
                    onChange={(e) => setStatusForm(s => ({ ...s, note: e.target.value }))}
                    rows={3}
                    style={{ padding: 8 }}
                  />
                  <button className="theme-toggle" type="submit" disabled={statusSubmitting}>
                    {statusSubmitting ? 'Saving...' : 'Add status'}
                  </button>
                </form>
              </div>

              <div style={{ marginTop: 16, border: '1px solid var(--border-color)', borderRadius: 8, padding: 12, textAlign: 'left' }}>
                <h3 style={{ marginTop: 0 }}>Ingest Location</h3>
                <form onSubmit={submitLocation} style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr 1fr auto' }}>
                  <input
                    type="number"
                    step="any"
                    placeholder="Latitude"
                    value={locForm.latitude}
                    onChange={(e) => setLocForm(f => ({ ...f, latitude: e.target.value }))}
                    required
                    style={{ padding: 8 }}
                  />
                  <input
                    type="number"
                    step="any"
                    placeholder="Longitude"
                    value={locForm.longitude}
                    onChange={(e) => setLocForm(f => ({ ...f, longitude: e.target.value }))}
                    required
                    style={{ padding: 8 }}
                  />
                  <input
                    type="number"
                    step="any"
                    placeholder="Accuracy (m, optional)"
                    value={locForm.accuracy_m}
                    onChange={(e) => setLocForm(f => ({ ...f, accuracy_m: e.target.value }))}
                    style={{ padding: 8 }}
                  />
                  <button className="theme-toggle" type="submit" disabled={locSubmitting}>
                    {locSubmitting ? 'Sending...' : 'Submit'}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</div>
      <div>{value}</div>
    </div>
  );
}
