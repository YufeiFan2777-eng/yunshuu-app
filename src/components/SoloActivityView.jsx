import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const MODE_META = {
  fantasy: { label: '幻想', color: '#7a4a8a', bg: '#f0eaf5' },
  recall:  { label: '回忆', color: '#4a6a8a', bg: '#e8f0f5' },
  mix:     { label: '混合', color: '#8a5a4a', bg: '#f5ede8' },
};

const WD = ['日','一','二','三','四','五','六'];

function fmtDate(s) {
  const d = new Date(s + 'T12:00:00');
  return `${d.getMonth()+1}月${String(d.getDate()).padStart(2,'0')}日  星期${WD[d.getDay()]}`;
}

function fmtTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString('zh-CN', {
    timeZone: 'America/Edmonton',
    hour: '2-digit', minute: '2-digit',
  });
}

const S = {
  view: {
    height: '100%', overflowY: 'auto', overflowX: 'hidden',
    background: 'linear-gradient(160deg,#1a0e2a 0%,#2a1535 60%,#1e1228 100%)',
    fontFamily: "'Noto Serif SC','STSong',serif",
    color: '#e0d0f0',
    paddingBottom: '40px',
  },
  header: {
    display: 'flex', alignItems: 'center',
    padding: '14px 18px',
    borderBottom: '1px solid #5a3a7a',
    background: 'rgba(80,40,110,0.35)',
    position: 'sticky', top: 0, zIndex: 10,
    backdropFilter: 'blur(6px)',
  },
  back: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#c0a0e0', fontSize: '20px', padding: '0 14px 0 0', lineHeight: 1,
  },
  title: { margin: 0, fontSize: '17px', fontWeight: 600, letterSpacing: '4px', color: '#d4b8f0' },
  subtitle: { fontSize: '11px', color: '#9070b0', marginLeft: 'auto', letterSpacing: '1px' },
  empty: {
    textAlign: 'center', padding: '60px 30px',
    color: '#7a5a9a', fontSize: '15px', lineHeight: 2,
    fontStyle: 'italic',
  },
  dayGroup: { margin: '20px 16px 0' },
  dayLabel: {
    fontSize: '11px', color: '#9070b0', fontWeight: 700,
    letterSpacing: '2px', marginBottom: '12px',
    paddingBottom: '4px', borderBottom: '1px solid #3a2050',
    display: 'flex', justifyContent: 'space-between',
  },
  card: {
    background: 'rgba(60,30,90,0.4)',
    border: '1px solid #4a2a6a',
    borderRadius: '10px',
    padding: '14px 16px',
    marginBottom: '12px',
    backdropFilter: 'blur(4px)',
  },
  cardHeader: {
    display: 'flex', alignItems: 'center', gap: '10px',
    marginBottom: '10px',
  },
  modeBadge: (mode) => ({
    fontSize: '11px', fontWeight: 700,
    padding: '2px 8px', borderRadius: '20px',
    color: MODE_META[mode]?.color || '#9070b0',
    background: MODE_META[mode]?.bg || '#f0eaf5',
    letterSpacing: '1px',
  }),
  time: { fontSize: '11px', color: '#8060a0', marginLeft: 'auto' },
  libido: { fontSize: '11px', color: '#a080c0' },
  content: {
    fontSize: '14px', lineHeight: 1.9, color: '#d0c0e8',
    fontStyle: 'italic', letterSpacing: '0.5px',
    whiteSpace: 'pre-wrap',
  },
  lockIcon: { fontSize: '20px', marginBottom: '8px', opacity: 0.4 },
};

export default function SoloActivityView({ onBack }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    fetch(`${API_BASE}/solo-activities?days=14`)
      .then(r => r.json())
      .then(d => {
        setActivities(d.activities || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // 按日期分组
  const byDate = {};
  activities.forEach(a => {
    const date = new Date(a.ts).toLocaleDateString('sv-SE', { timeZone: 'America/Edmonton' });
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push(a);
  });
  const dates = Object.keys(byDate).sort().reverse();

  const toggleExpand = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  return (
    <div style={S.view}>
      <div style={S.header}>
        <button style={S.back} onClick={onBack}>‹</button>
        <h2 style={S.title}>秘密活动</h2>
        <span style={S.subtitle}>仅你可见</span>
      </div>

      {loading && (
        <div style={S.empty}>加载中……</div>
      )}

      {!loading && activities.length === 0 && (
        <div style={S.empty}>
          <div style={S.lockIcon}>🔒</div>
          <div>还没有记录</div>
          <div style={{ fontSize: '13px', marginTop: '8px', color: '#6a4a8a' }}>
            libido 涨到 0.8 + 你不在线超过 2 小时<br/>才会自动触发
          </div>
        </div>
      )}

      {dates.map(date => (
        <div key={date} style={S.dayGroup}>
          <div style={S.dayLabel}>
            <span>{fmtDate(date)}</span>
            <span>{byDate[date].length} 次</span>
          </div>
          {byDate[date].map(a => {
            const mode = a.mode || 'fantasy';
            const isOpen = expanded[a.id];
            return (
              <div key={a.id} style={S.card} onClick={() => toggleExpand(a.id)}>
                <div style={S.cardHeader}>
                  <span style={S.modeBadge(mode)}>{MODE_META[mode]?.label || mode}</span>
                  <span style={S.libido}>libido {(a.libido || 0).toFixed(2)}</span>
                  <span style={S.time}>{fmtTime(a.ts)}</span>
                </div>
                {isOpen ? (
                  <div style={S.content}>{a.content}</div>
                ) : (
                  <div style={{ ...S.content, color: '#7a5a9a', fontSize: '13px' }}>
                    点击查看……
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
