import React, { useState, useEffect } from 'react';
import { getVitals } from '../services/api';
import paperTex from '/paper-tex.jpg';

const BG = `#e6d5b7 url('${paperTex}')`;

const card = {
  background: '#f5e9d5d9', border: '1px solid #bfa58380',
  boxShadow: '2px 3px 0 #d8c3a17a, 0 4px 10px #71533210',
  borderRadius: '3px 6px 2px 5px', padding: '17px',
};
const sectionLabel = {
  fontSize: 8.5, letterSpacing: 2.5, color: '#9b7a58',
  textTransform: 'uppercase', fontFamily: 'Georgia, serif', marginBottom: 12,
};
const scrollArea = {
  flex: 1, overflowY: 'auto', overflowX: 'hidden',
  padding: '14px 14px 32px',
  display: 'flex', flexDirection: 'column', gap: 13,
  scrollbarWidth: 'thin', scrollbarColor: '#b89970 transparent',
};

/* ── TopBar ── */
function TopBar({ lastUpdate }) {
  const timeStr = lastUpdate
    ? new Date(lastUpdate).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 16px',
      paddingTop: 'max(10px, env(safe-area-inset-top))',
      background: 'rgba(230,213,183,0.92)',
      backdropFilter: 'blur(8px)',
      borderBottom: '1px dashed #bda587',
      flexShrink: 0,
    }}>
      <span style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 18, color: '#3d2b1a', letterSpacing: 1, flex: 1 }}>
        内在状态
      </span>
      {timeStr && (
        <span style={{ fontSize: 10, color: '#a08060', fontVariantNumeric: 'tabular-nums' }}>{timeStr}</span>
      )}
    </div>
  );
}

/* ── 进度条 ── */
function Bar({ value, baseline, color = '#9b7a58' }) {
  const pct = Math.round(Math.min(value, 1) * 100);
  const basePct = Math.round(Math.min(baseline || 0, 1) * 100);
  return (
    <div style={{ height: 3, background: '#d4bfa050', borderRadius: 2, overflow: 'visible', position: 'relative' }}>
      <div style={{
        height: '100%', borderRadius: 2, width: `${pct}%`,
        background: `linear-gradient(90deg, ${color}88, ${color})`,
        transition: 'width 0.4s ease',
      }} />
      {basePct > 0 && (
        <div style={{
          position: 'absolute', top: -1, left: `${basePct}%`,
          width: 1, height: 5, background: '#c4a07860',
        }} />
      )}
    </div>
  );
}

/* ── 欲望系统 ── */
function DesireSection({ data }) {
  if (!data) return null;
  const { drives = [], thoughts = [], last_interaction } = data;
  const idleMin = last_interaction
    ? Math.floor((Date.now() - last_interaction) / 60000) : null;

  return (
    <div style={card}>
      <div style={sectionLabel}>DESIRE · 欲望驱动</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {drives.map((d, i) => {
          const pct = Math.round(d.value * 100);
          const isTop = i < 3;
          const isHigh = d.delta > 0.08;
          const isLow  = d.delta < -0.08;
          const dotColor = isHigh ? '#a44936' : isLow ? '#7a9a7a' : '#c4a882';
          return (
            <div key={d.key}>
              <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 4, gap: 6 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%', background: dotColor,
                  flexShrink: 0, marginBottom: 1,
                }} />
                <span style={{
                  fontSize: isTop ? 13 : 11.5, color: '#3d2b1a',
                  fontFamily: 'Cormorant Garamond, Georgia, serif',
                  fontWeight: isTop ? 600 : 400, flex: 1,
                }}>{d.label}</span>
                <span style={{
                  fontSize: 11, color: isHigh ? '#a44936' : '#9b7a58',
                  fontVariantNumeric: 'tabular-nums',
                  fontWeight: isHigh ? 600 : 400,
                }}>{pct}%</span>
              </div>
              <Bar value={d.value} baseline={d.baseline}
                color={isHigh ? '#c4603a' : isLow ? '#7a9a7a' : '#9b7a58'} />
            </div>
          );
        })}
      </div>

      {thoughts.length > 0 && (
        <>
          <div style={{ height: 1, background: '#c4a07828', margin: '14px 0 10px' }} />
          <div style={{ fontSize: 8.5, letterSpacing: 2, color: '#b8956a', textTransform: 'uppercase', fontFamily: 'Georgia, serif', marginBottom: 8 }}>念头</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {thoughts.map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{
                  fontSize: 9, color: '#b89060', background: '#e8d5b540',
                  border: '1px solid #c4a07830', borderRadius: 2, padding: '1px 6px',
                  flexShrink: 0, marginTop: 1,
                }}>{t.type === 'fixation' ? '执念' : '浮念'}</span>
                <span style={{ fontSize: 12.5, color: '#513b29', lineHeight: 1.7, fontFamily: 'Cormorant Garamond, Georgia, serif' }}>{t.text}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {idleMin !== null && (
        <div style={{ marginTop: 12, fontSize: 10, color: '#a08060' }}>
          距上次互动 {idleMin < 60 ? `${idleMin}分钟` : `${Math.floor(idleMin / 60)}小时${idleMin % 60}分钟`}
        </div>
      )}
    </div>
  );
}

/* ── 体感系统 ── */
function SomaticSection({ data }) {
  if (!data || data.length === 0) return null;
  const active = data.filter(ch => ch.active);

  return (
    <div style={card}>
      <div style={sectionLabel}>SOMATIC · 体感</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.map(ch => (
          <div key={ch.key}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 5, gap: 6 }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                background: ch.active ? '#c4603a' : '#d4bfa070',
                boxShadow: ch.active ? '0 0 4px #c4603a88' : 'none',
              }} />
              <span style={{
                fontSize: 12.5, color: ch.active ? '#3d2b1a' : '#a08060',
                fontFamily: 'Cormorant Garamond, Georgia, serif', flex: 1,
              }}>{ch.label}</span>
              {ch.detail && (
                <span style={{ fontSize: 10, color: '#9b7a58', background: '#e8d9c060', border: '1px solid #bfa58330', borderRadius: 2, padding: '1px 6px' }}>
                  {ch.detail}
                </span>
              )}
              <span style={{ fontSize: 10.5, color: '#9b7a58', fontVariantNumeric: 'tabular-nums', marginLeft: 4 }}>
                {Math.round(ch.value * 100)}%
              </span>
            </div>
            <Bar value={ch.value} color={ch.active ? '#c4603a' : '#b8a07a'} />
          </div>
        ))}
      </div>
      {active.length === 0 && (
        <div style={{ fontSize: 12, color: '#a08060', marginTop: 8, fontFamily: 'Georgia, serif' }}>体感平静</div>
      )}
    </div>
  );
}

/* ── 射精值 / 身体状态 ── */
const PHASE_INFO = {
  idle:       { label: '平静', color: '#9b9b7a', dot: '#b8b870' },
  charged:    { label: '被撩动', color: '#a47a3a', dot: '#c49a50' },
  edge:       { label: '临界', color: '#a44936', dot: '#c46040' },
  ponr:       { label: '临界点', color: '#8a2a1a', dot: '#c03020' },
  refractory: { label: '余温中', color: '#7a8a9a', dot: '#8a9aaa' },
};

function ArousalSection({ data }) {
  if (!data) return null;
  const { phase, phase_label, reserve, reserve_label, refractory,
    last_climax_quality, last_climax_quality_label,
    last_output, last_output_label } = data;
  const pi = PHASE_INFO[phase] || { label: phase_label, color: '#9b7a58', dot: '#9b7a58' };
  const reservePct = Math.round((reserve || 0) * 100);

  return (
    <div style={card}>
      <div style={sectionLabel}>BODY · 身体状态</div>

      {/* 当前阶段 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: pi.dot, boxShadow: `0 0 6px ${pi.dot}aa`, flexShrink: 0,
        }} />
        <span style={{ fontSize: 15, color: pi.color, fontFamily: 'Cormorant Garamond, Georgia, serif', fontWeight: 600 }}>
          {pi.label}
        </span>
        {refractory && (
          <span style={{ fontSize: 10, color: '#9b7a58', marginLeft: 4 }}>
            余温还有 {Math.round(refractory)}s
          </span>
        )}
      </div>

      {/* 储备 */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 11, color: '#9b7a58', fontFamily: 'Georgia, serif' }}>储备</span>
          <span style={{ fontSize: 11, color: '#9b7a58', fontVariantNumeric: 'tabular-nums' }}>
            {reservePct}% · {reserve_label}
          </span>
        </div>
        <Bar value={reserve || 0} color={reservePct > 60 ? '#9b7a58' : '#a47a3a'} />
      </div>

      {/* 上次记录 */}
      {last_climax_quality != null && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <div style={{
            flex: 1, background: '#e8d5b540', border: '1px solid #c4a07830',
            borderRadius: 4, padding: '7px 10px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 9, color: '#a08060', marginBottom: 3, letterSpacing: 1 }}>上次质量</div>
            <div style={{ fontSize: 13, color: '#5a3820', fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
              {last_climax_quality_label || '—'}
            </div>
            <div style={{ fontSize: 10, color: '#b89060', fontVariantNumeric: 'tabular-nums' }}>
              {Math.round((last_climax_quality || 0) * 100)}%
            </div>
          </div>
          <div style={{
            flex: 1, background: '#e8d5b540', border: '1px solid #c4a07830',
            borderRadius: 4, padding: '7px 10px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 9, color: '#a08060', marginBottom: 3, letterSpacing: 1 }}>输出量</div>
            <div style={{ fontSize: 13, color: '#5a3820', fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
              {last_output_label || '—'}
            </div>
            <div style={{ fontSize: 10, color: '#b89060', fontVariantNumeric: 'tabular-nums' }}>
              {Math.round((last_output || 0) * 100)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── 记忆摘要 ── */
function MemoriesSection({ memories }) {
  if (!memories || memories.length === 0) return null;
  return (
    <div style={card}>
      <div style={sectionLabel}>MEMORY · 记忆摘要</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {memories.map((m, i) => {
          const d = m.timestamp ? new Date(m.timestamp) : null;
          const timeStr = d ? d.toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
          return (
            <div key={i} style={{
              borderLeft: '2px solid #c4a07860', paddingLeft: 10,
            }}>
              <div style={{ fontSize: 12.5, color: '#3d2b1a', lineHeight: 1.75, fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
                {m.summary}
              </div>
              {timeStr && <div style={{ fontSize: 9.5, color: '#b89060', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>{timeStr}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── 主组件 ── */
export default function VitalsView() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [ts, setTs] = useState(null);

  async function load() {
    try {
      const d = await getVitals();
      if (d && !d.error) { setData(d); setTs(d.ts); setError(false); }
      else setError(true);
    } catch { setError(true); }
  }

  useEffect(() => {
    load();
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: BG, backgroundSize: '240px', overflow: 'hidden' }}>
      <TopBar lastUpdate={ts} />
      <div style={scrollArea}>
        {error && !data && (
          <div style={{ textAlign: 'center', color: '#a08060', padding: '32px 16px', fontFamily: 'Georgia, serif', fontSize: 13 }}>
            连接中…
          </div>
        )}
        {data && (
          <>
            <DesireSection data={data.desire} />
            <SomaticSection data={data.somatic} />
            <ArousalSection data={data.arousal} />
            <MemoriesSection memories={data.memories} />
          </>
        )}
      </div>
    </div>
  );
}
