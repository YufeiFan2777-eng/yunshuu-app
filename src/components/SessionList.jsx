import React from 'react';

export default function SessionList({ sessions, activeId, onSelect, onNew, onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex',
    }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ flex: 1, background: 'rgba(0,0,0,0.4)' }}
      />

      {/* Panel */}
      <div style={{
        width: 280, background: 'var(--bg-card)',
        display: 'flex', flexDirection: 'column',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        boxShadow: '4px 0 20px rgba(0,0,0,0.2)',
      }}>
        <div style={{
          padding: '16px 16px 12px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontWeight: 600 }}>对话记录</div>
          <button onClick={onClose} style={{ padding: 6, borderRadius: 6, fontSize: 16 }}>✕</button>
        </div>

        <button
          onClick={onNew}
          style={{
            margin: 12, padding: '10px 16px',
            background: 'var(--accent)', color: '#fff',
            borderRadius: 12, fontSize: 14, fontWeight: 500,
          }}
        >
          + 新对话
        </button>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 16px' }}>
          {sessions.map(s => (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              style={{
                width: '100%', textAlign: 'left',
                padding: '10px 12px', borderRadius: 10,
                background: s.id === activeId ? 'var(--accent-light)' : 'transparent',
                color: s.id === activeId ? 'var(--accent)' : 'var(--fg)',
                fontSize: 14,
                display: 'block',
              }}
            >
              <div style={{ fontWeight: s.id === activeId ? 600 : 400 }}>{s.name}</div>
              <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>
                {new Date(s.updated_at).toLocaleDateString('zh-CN')}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
