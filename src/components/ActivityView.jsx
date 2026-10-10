import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const TYPE_META = {
  morning_moment: { label: '晨间感知', color: '#c97c3a', bg: '#fdf0e0',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg> },
  evening_diary:  { label: '写了日记', color: '#7a4f2e', bg: '#f5e9d8',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
  push_message:   { label: '找雨菲说话', color: '#4a7a5c', bg: '#e8f4ec',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
  moment_post:    { label: '发了朋友圈', color: '#7a5c8a', bg: '#f0eaf5',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> },
  thought:        { label: '加了一个念头', color: '#8a7a4a', bg: '#f5f0e0',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeDasharray="4 2"/></svg> },
  followup_push:  { label: '跟进消息', color: '#4a6a7a', bg: '#e8f0f5',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg> },
  followup_moment:    { label: '跟进朋友圈', color: '#7a5c8a', bg: '#f0eaf5',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> },
  forum_notification: { label: '论坛有动态', color: '#4a7a6a', bg: '#e4f2ee',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
};

const WD = ['日','一','二','三','四','五','六'];

function fmtDate(s) {
  const d = new Date(s + 'T12:00:00');
  return `${d.getMonth()+1}月${String(d.getDate()).padStart(2,'0')}日  星期${WD[d.getDay()]}`;
}

function fmtTime(ts) {
  // 把 UTC 时间转成卡尔加里时间显示
  const d = new Date(ts);
  return d.toLocaleTimeString('zh-CN', {
    timeZone: 'America/Edmonton',
    hour: '2-digit', minute: '2-digit',
  });
}

const S = {
  view: {
    minHeight: '100%',
    background: 'linear-gradient(160deg,#f7eed8 0%,#ecddb0 100%)',
    fontFamily: "'Noto Serif SC','STSong',serif",
    color: '#3d2b1f',
    paddingBottom: '40px',
  },
  header: {
    display: 'flex', alignItems: 'center',
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
  dayGroup: { margin: '18px 14px 0' },
  dayLabel: {
    fontSize: '12px', color: '#8b6344', fontWeight: 700,
    letterSpacing: '2px', marginBottom: '10px',
    paddingBottom: '4px', borderBottom: '1px solid #d4b07a',
    display: 'flex', justifyContent: 'space-between',
  },
  dayCount: { fontSize: '11px', color: '#b09070', fontWeight: 400 },
  timeline: { display: 'flex', flexDirection: 'column', gap: '0' },
  row: {
    display: 'flex', alignItems: 'flex-start', gap: '10px',
    padding: '10px 0',
    borderBottom: '1px solid #e8d8b890',
    position: 'relative',
  },
  timeCol: {
    width: '42px', flexShrink: 0, textAlign: 'right',
    fontSize: '12px', color: '#a08060', lineHeight: '22px',
    fontVariantNumeric: 'tabular-nums',
  },
  dot: {
    width: '8px', height: '8px', borderRadius: '50%',
    marginTop: '7px', flexShrink: 0,
    border: '2px solid currentColor',
  },
  content: { flex: 1, minWidth: 0 },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    fontSize: '11px', fontWeight: 600, padding: '2px 7px',
    borderRadius: '10px', marginBottom: '4px',
    letterSpacing: '0.5px',
  },
  preview: {
    fontSize: '13px', lineHeight: '1.7', color: '#5a3d28',
    margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all',
  },
  empty: { textAlign: 'center', color: '#9a7050', padding: '60px 20px', fontSize: '15px' },
};

export default function ActivityView({ onBack }) {
  const [days, setDays]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr]       = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/activities?days=7`)
      .then(r => r.json())
      .then(d => { setDays(d.days || []); setLoading(false); })
      .catch(() => { setErr('活动记录加载失败'); setLoading(false); });
  }, []);

  return (
    <div style={S.view}>
      <div style={S.header}>
        <button style={S.back} onClick={onBack}>‹</button>
        <h2 style={S.title}>他的活动</h2>
      </div>

      {loading && <div style={S.empty}>读取中…</div>}
      {err     && <div style={S.empty}>{err}</div>}
      {!loading && !err && days.length === 0 && <div style={S.empty}>还没有活动记录</div>}

      {days.map(day => {
        const acts = day.activities || [];
        const meta = TYPE_META;
        return (
          <div key={day.date} style={S.dayGroup}>
            <div style={S.dayLabel}>
              <span>{day.date.slice(5).replace('-','月') + '日'} · {fmtDate(day.date).split('  ')[1]}</span>
              <span style={S.dayCount}>{acts.length} 条活动</span>
            </div>
            {acts.length === 0
              ? <div style={{ fontSize: '13px', color: '#b09070', padding: '8px 0 4px' }}>这天没有活动记录</div>
              : (
                <div style={S.timeline}>
                  {acts.map((a, i) => {
                    const m = meta[a.type] || { label: a.type, color: '#8a7060', bg: '#f5ede0', icon: null };
                    return (
                      <div key={i} style={S.row}>
                        <div style={S.timeCol}>{fmtTime(a.ts)}</div>
                        <div style={{ ...S.dot, color: m.color, borderColor: m.color }} />
                        <div style={S.content}>
                          <div style={{ ...S.badge, color: m.color, background: m.bg }}>
                            {m.icon}
                            {m.label}
                          </div>
                          {a.preview && <p style={S.preview}>{a.preview}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            }
          </div>
        );
      })}
    </div>
  );
}
