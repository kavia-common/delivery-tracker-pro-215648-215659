import React from 'react';

// PUBLIC_INTERFACE
export function StatusBadge({ status }) {
  /** Simple colored badge for a delivery status */
  const color = {
    created: '#64748b',
    assigned: '#0ea5e9',
    in_transit: '#f59e0b',
    delivered: '#10b981',
    canceled: '#ef4444',
    failed: '#b91c1c',
  }[status] || '#64748b';

  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 999,
      fontSize: 12,
      background: color + '22',
      color,
      border: `1px solid ${color}66`,
    }}>
      {status || 'unknown'}
    </span>
  );
}

// PUBLIC_INTERFACE
export function MapPlaceholder({ latitude, longitude, height = 200 }) {
  /** Placeholder map box. Replace with real map in future. */
  return (
    <div style={{
      width: '100%',
      height,
      background: 'linear-gradient(135deg, #e5e7eb, #f3f4f6)',
      color: '#111827',
      border: '1px dashed #9ca3af',
      borderRadius: 8,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8
    }}>
      <div>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Map Placeholder</div>
        <div style={{ fontSize: 12, color: '#374151' }}>
          {latitude != null && longitude != null
            ? `Lat: ${latitude}, Lng: ${longitude}`
            : 'No coordinates'}
        </div>
      </div>
    </div>
  );
}
