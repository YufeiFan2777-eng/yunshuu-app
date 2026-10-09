import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const S = {
  view: {
    minHeight: '100%',
    background: 'linear-gradient(160deg,#f7eed8 0%,#ecddb0 100%)',
    fontFamily: "'Noto Serif SC','STSong',serif",
    color: '#3d2b1f',
    paddingBottom: '40px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: '14px 18px',
    borderBottom: '1px solid #c8a86a',
    background: 'rgba(210,175,105,0.28)',
    position: 'sticky', top: 0, zIndex: 10,
    backdropFilter: 'blur(6px)',
  },
  back: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#7a4f2e', fontSize: '20px', padding: '0 14px 0 0', lineHeight: 1,
  },
  title: { margin: 0, fontSize: '17px', fontWeight: 600, letterSpacing: '3px' },
  monthGroup: { margin: '18px 14px 0' },
  monthLabel: {
    fontSize: '12px', color: '#8b6344', fontWeight: 700,
    letterSpacing: '2px', marginBottom: '8px',
    paddingBottom: '4px', borderBottom: '1px solid #d4b07a',
  },
  card: {
    background: 'rgba(255,252,245,0.88)',
    borderRadius: '10px', marginBottom: '8px',
    border: '1px solid #d9be8a',
    boxShadow: '0 1px 6px rgba(100,60,10,0.08)',
    overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex', alignItems: 'center',
    padding: '11px 14px', cursor: 'pointer', userSelect: 'none',
  },
  day: {
    fontSize: '30px', fontWeight: 700, color: '#7a4f2e',
    width: '46px', lineHeight: 1, fontVariantNumeric: 'tabular-nums',
  },
  dateFull: { flex: 1, fontSize: '12px', color: '#9a7050', marginLeft: '8px', lineHeight: 1.4 },
  arrow: { color: '#c9a050', fontSize: '11px' },
  body: { padding: '10px 14px 14px', borderTop: '1px solid #e5cc90' },
  text: {
    margin: 0, fontSize: '14px', lineHeight: '1.95',
    color: '#3d2b1f', whiteSpace: 'pre-wrap',
    fontFamily: 'inherit', wordBreak: 'break-all',
  },
  hint: { color: '#9a7050', fontSize: '13px', padding: '6px 0' },
  empty: { textAlign: 'center', color: '#9a7050', padding: '60px 20px', fontSize: '15px' },
};

const WD = ['日','一','二','三','四','五','六'];

function fmtDate(s) {
  const d = new Date(s + 'T12:00:00');
  return `${d.getMonth()+1}月${String(d.getDate()).padStart(2,'0')}日  星期${WD[d.getDay()]}`;
}

export default function DiaryView({ onBack }) {
  const [list, setList]       = useState([]);
  const [open, setOpen]       = useState(null);
  const [body, setBody]       = useState({});
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/journals?limit=30`)
      .then(r => r.json())
      .then(d => {
        const j = d.journals || [];
        setList(j);
        setLoading(false);
        if (j.length > 0) { setOpen(j[0].date); fetchBody(j[0].date); }
      })
      .catch(() => { setErr('日记加载失败'); setLoading(false); });
  }, []);

  function fetchBody(date) {
    if (body[date] !== undefined) return;
    setBody(p => ({ ...p, [date]: null }));
    fetch(`${API_BASE}/journals/${date}`)
      .then(r => r.json())
      .then(d => setBody(p => ({ ...p, [date]: d.content || '' })))
      .catch(()  => setBody(p => ({ ...p, [date]: '(加载失败)' })));
  }

  function toggle(date) {
    if (open === date) { setOpen(null); }
    else { setOpen(date); fetchBody(date); }
  }

  const grouped = {};
  list.forEach(j => {
    const m = j.date.slice(0,7);
    (grouped[m] = grouped[m] || []).push(j);
  });

  return (
    <div style={S.view}>
      <div style={S.header}>
        <button style={S.back} onClick={onBack}>‹</button>
        <h2 style={S.title}>他的日记</h2>
      </div>

      {loading && <div style={S.empty}>读取中…</div>}
      {err     && <div style={S.empty}>{err}</div>}
      {!loading && !err && list.length === 0 && <div style={S.empty}>还没有日记</div>}

      {Object.keys(grouped).sort().reverse().map(m => (
        <div key={m} style={S.monthGroup}>
          <div style={S.monthLabel}>{m.replace('-','年')}月</div>
          {grouped[m].map(j => (
            <div key={j.date} style={S.card}>
              <div style={S.cardHeader} onClick={() => toggle(j.date)}>
                <span style={S.day}>{j.date.slice(8)}</span>
                <span style={S.dateFull}>{fmtDate(j.date)}</span>
                <span style={S.arrow}>{open === j.date ? '▲' : '▼'}</span>
              </div>
              {open === j.date && (
                <div style={S.body}>
                  {body[j.date] == null
                    ? <div style={S.hint}>读取中…</div>
                    : <pre style={S.text}>{body[j.date]}</pre>}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
