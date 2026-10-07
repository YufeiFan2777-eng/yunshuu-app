import React, { useState, useEffect } from 'react';
import { getState } from '../services/api';

const LEVEL_COLOR = {
  '高':   { bg: '#c0614a', fg: '#fff' },
  '中高': { bg: '#b8855a', fg: '#fff' },
  '中':   { bg: '#8a6b52', fg: '#f5ede2' },
  '中低': { bg: '#6b4f3a', fg: '#d4bca8' },
  '低':   { bg: 'rgba(0,0,0,0.18)', fg: '#c9a98a' },
};

function levelStyle(val) {
  for (const k of Object.keys(LEVEL_COLOR)) {
    if (val?.includes(k)) return LEVEL_COLOR[k];
  }
  return LEVEL_COLOR['低'];
}

function XinchaoPanel({ onXinchao }) {
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    getState().then(d => { if (d.available) setData(d); }).catch(() => {});
  }, []);

  if (!data) return null;

  const dims = Object.entries(data.state || {});

  return (
    <div style={{
      margin: '12px 12px 0',
      background: 'rgba(0,0,0,0.18)',
      borderRadius: 14,
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.1)',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '10px 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: 13, fontWeight: 600, color: '#f5ede2',
          background: 'transparent', border: 'none', cursor: 'pointer',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: dims.find(([k]) => k === '热度')?.[1]?.includes('高') ? '#c0614a' : '#c9a98a',
            display: 'inline-block',
            animation: 'slStatePulse 3s ease-in-out infinite',
          }} />
          身体状态
        </span>
        <span style={{ color: '#c9a98a', fontSize: 11 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ padding: '0 14px 12px', display: 'flex', flexDirection: 'column', gap: 7 }}>
          {dims.map(([k, v]) => {
            const s = levelStyle(v);
            return (
              <div key={k} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
              }}>
                <span style={{ fontSize: 12, color: '#d4bca8', flexShrink: 0 }}>{k}</span>
                <span style={{
                  fontSize: 11, fontWeight: 500,
                  padding: '2px 8px', borderRadius: 20,
                  background: s.bg, color: s.fg,
                }}>
                  {v}
                </span>
              </div>
            );
          })}
          {data.cycle && (
            <div style={{
              marginTop: 4, fontSize: 11, color: '#c9a98a',
              lineHeight: 1.6, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 8,
            }}>
              {data.cycle.slice(0, 60)}{data.cycle.length > 60 ? '…' : ''}
            </div>
          )}

          <button
            onClick={onXinchao}
            style={{
              marginTop: 10, width: '100%',
              padding: '7px 0', borderRadius: 8,
              background: 'rgba(255,255,255,0.1)',
              color: '#f5ede2', fontSize: 12, fontWeight: 500,
              border: '1px solid rgba(255,255,255,0.15)',
              cursor: 'pointer',
            }}
          >
            查看详细数据 →
          </button>
        </div>
      )}

      <style>{`
        @keyframes slStatePulse {
          0%, 100% { opacity: 0.6; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}

export default function SessionList({ sessions, activeId, onSelect, onNew, onClose, onXinchao }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex',
    }}>
      {/* Panel — left side */}
      <div style={{
        width: 290, background: '#7D5A44',
        display: 'flex', flexDirection: 'column',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        boxShadow: '4px 0 24px rgba(0,0,0,0.35)',
      }}>
        <div style={{
          padding: '16px 16px 12px',
          borderBottom: '1px solid rgba(255,255,255,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontWeight: 600, fontSize: 16, color: '#f5ede2', letterSpacing: 1 }}>云舒</div>
          <button
            onClick={onClose}
            style={{
              padding: 6, borderRadius: 6, fontSize: 16,
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: '#d4bca8',
            }}
          >✕</button>
        </div>

        {/* 身体状态 */}
        <XinchaoPanel onXinchao={onXinchao} />

        {/* 新对话 */}
        <button
          onClick={onNew}
          style={{
            margin: '12px 12px 4px', padding: '10px 16px',
            background: '#a07458', color: '#fff5ec',
            borderRadius: 12, fontSize: 14, fontWeight: 500,
            border: 'none', cursor: 'pointer',
          }}
        >
          + 新对话
        </button>

        <div style={{
          padding: '6px 12px 4px',
          fontSize: 11, color: '#c9a98a', fontWeight: 500,
          letterSpacing: '0.05em',
        }}>
          对话记录
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 16px' }}>
          {sessions.map(s => (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              style={{
                width: '100%', textAlign: 'left',
                padding: '10px 12px', borderRadius: 10,
                background: s.id === activeId ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: s.id === activeId ? '#fff5ec' : '#d4bca8',
                fontSize: 14,
                display: 'block',
                border: 'none', cursor: 'pointer',
              }}
            >
              <div style={{ fontWeight: s.id === activeId ? 600 : 400 }}>{s.name}</div>
              <div style={{ fontSize: 12, color: '#b89a80', marginTop: 2 }}>
                {new Date(s.updated_at).toLocaleDateString('zh-CN')}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Backdrop — right side */}
      <div
        onClick={onClose}
        style={{ flex: 1, background: 'rgba(0,0,0,0.45)' }}
      />
    </div>
  );
}
