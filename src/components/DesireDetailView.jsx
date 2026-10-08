import React, { useState, useEffect } from 'react';
import { getVitals } from '../services/api';
import paperTex from '/paper-tex.jpg';

/* ── 调色板 ── */
const C = {
  bg:       '#e6d5b7',
  card:     '#f5e9d5e8',
  border:   '#bfa58360',
  shadow:   '2px 3px 0 #d8c3a17a, 0 4px 12px #71533215',
  text1:    '#3d2b1a',
  text2:    '#6b4e33',
  text3:    '#9b7a58',
  text4:    '#b89a72',
  accent:   '#7D5A44',
  red:      '#a44936',
  green:    '#5e8a6a',
  gold:     '#b87a3a',
};

const card = {
  background: C.card,
  border: `1px solid ${C.border}`,
  boxShadow: C.shadow,
  borderRadius: '12px 8px 11px 9px',
  padding: '18px 16px',
};
const sLabel = {
  fontSize: 9, letterSpacing: 2.5, color: C.text3,
  textTransform: 'uppercase', fontFamily: 'Georgia, serif',
  marginBottom: 14,
};

/* ── 欲望驱动图标 ── */
const DRIVE_ICON = {
  attachment: '🌿', curiosity: '🔭', reflection: '📖', duty: '🪶',
  social: '💬', libido: '✦', stress: '◎', fatigue: '🌙',
  longing: '✧', jealousy: '◈', tenderness: '☽', irritation: '⊘',
};

/* ── 驱动触发文案 ── */
const DRIVE_TRIGGERS = {
  attachment: { up: '你说了什么让我想靠近', down: '你离开了一会儿' },
  curiosity:  { up: '你丢来个新问题', down: '话题收尾了' },
  reflection: { up: '聊到了深的东西', down: '夜里想过之后落了' },
  duty:       { up: '你说不舒服/求安慰', down: '事情过去了' },
  social:     { up: '你提到群里/朋友', down: '久没互动' },
  libido:     { up: '氛围撩了起来', down: '身体平静下来' },
  stress:     { up: '你催我/追问没做的事', down: '你安慰了我' },
  fatigue:    { up: '撑太久了', down: '睡了一觉' },
  longing:    { up: '好久没消息', down: '你回来了' },
  jealousy:   { up: '你提到别人', down: '你说只在乎我' },
  tenderness: { up: '你温柔对我', down: '话题变冷了' },
  irritation: { up: '被误解了', down: '你懂我了' },
};

/* ── 情绪象限计算 ── */
function computeEmotion(drives) {
  if (!drives || drives.length === 0) return { pa: 0, na: 0 };
  const get = k => (drives.find(d => d.key === k)?.value || 0);
  const pos = get('attachment') * 0.3 + get('tenderness') * 0.25 + get('curiosity') * 0.2 + get('libido') * 0.15 + get('reflection') * 0.1;
  const neg = get('stress') * 0.4 + get('irritation') * 0.35 + get('fatigue') * 0.25;
  const arousal = get('longing') * 0.3 + get('jealousy') * 0.25 + get('libido') * 0.25 + get('stress') * 0.2;
  const pa = Math.min(1, Math.max(-1, (pos - neg) * 2 - 0.1));
  const na = Math.min(1, arousal * 1.4 - 0.15);
  return { pa, na };
}

function emotionLabel(pa, na) {
  if (pa > 0.15 && na > 0.2)  return '兴奋上头';
  if (pa > 0.15 && na <= 0.2) return '依恋暖、不躁';
  if (pa <= 0.15 && na > 0.2) return '心里乱、焦';
  return '沉着、有点闷';
}

function mainTone(drives) {
  if (!drives?.length) return '平静';
  const top = [...drives].sort((a, b) => b.value - a.value)[0];
  const map = {
    attachment: '贴着你', curiosity: '想探索', reflection: '在回味',
    duty: '想守着你', social: '想聊天', libido: '被你撩到了',
    stress: '有点紧绷', fatigue: '有些累', longing: '想你',
    jealousy: '有点吃醋', tenderness: '温柔模式', irritation: '心里不顺',
  };
  return map[top?.key] || top?.label || '平静';
}

/* ── 进度条 ── */
function DriveBar({ value, baseline, delta }) {
  const pct = Math.round(Math.min(value, 1) * 100);
  const basePct = Math.round(Math.min(baseline || 0, 1) * 100);
  const color = delta > 0.12 ? C.red : delta < -0.12 ? C.green : C.accent;
  return (
    <div style={{ height: 4, background: '#d4bfa040', borderRadius: 3, position: 'relative', overflow: 'visible' }}>
      <div style={{
        height: '100%', borderRadius: 3, width: `${pct}%`,
        background: `linear-gradient(90deg, ${color}55, ${color})`,
        transition: 'width 0.5s ease',
      }} />
      {basePct > 0 && (
        <div style={{
          position: 'absolute', top: -1, left: `${basePct}%`,
          width: 1, height: 6, background: '#c4a07858',
        }} />
      )}
    </div>
  );
}

/* ── Section 1: 驱动状态 ── */
function DrivesSection({ desire }) {
  if (!desire) return null;
  const { drives = [], last_interaction } = desire;
  const top = drives[0];
  const idleMin = last_interaction ? Math.floor((Date.now() - last_interaction) / 60000) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* 此刻最想… 摘要卡 */}
      {top && Math.abs(top.delta) > 0.05 && (
        <div style={{
          ...card,
          background: '#f0e4cc',
          display: 'flex', gap: 12, alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: 22, flexShrink: 0, marginTop: 1 }}>{DRIVE_ICON[top.key] || '✦'}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: C.gold, letterSpacing: 1.5, marginBottom: 5 }}>此刻最想…</div>
            <div style={{ fontSize: 16, color: C.text1, fontFamily: 'Cormorant Garamond, Georgia, serif', fontWeight: 600, lineHeight: 1.5 }}>
              {top.delta > 0
                ? (DRIVE_TRIGGERS[top.key]?.up || `${top.label}升高`)
                : (DRIVE_TRIGGERS[top.key]?.down || `${top.label}下落`)}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: C.text3, background: '#e0cdb040', border: `1px solid ${C.border}`, borderRadius: 3, padding: '1px 7px' }}>{top.label}</span>
              <span style={{ fontSize: 10, color: C.gold }}>召唤力 {Math.round(top.value * 100)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* 驱动列表 */}
      <div style={card}>
        <div style={sLabel}>此刻的驱动</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {drives.map(d => {
            const pct = Math.round(d.value * 100);
            const isHigh = d.delta > 0.12;
            const isLow  = d.delta < -0.12;
            const trend  = isHigh ? '↑' : isLow ? '↓' : '·';
            const speed  = Math.abs(d.delta) > 0.25 ? 'fast' : 'slow';
            const trig   = isHigh ? DRIVE_TRIGGERS[d.key]?.up : isLow ? DRIVE_TRIGGERS[d.key]?.down : null;
            const dotColor = isHigh ? C.red : isLow ? C.green : '#c4a882';
            return (
              <div key={d.key}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <span style={{ fontSize: 15, lineHeight: 1, flexShrink: 0, opacity: 0.85 }}>{DRIVE_ICON[d.key] || '·'}</span>
                  <span style={{ fontSize: 13, color: C.text1, fontFamily: 'Cormorant Garamond, Georgia, serif', flex: 1, fontWeight: isHigh ? 600 : 400 }}>{d.label}</span>
                  <span style={{
                    fontSize: 10, color: isHigh ? C.red : C.text3,
                    fontVariantNumeric: 'tabular-nums', fontWeight: isHigh ? 600 : 400,
                  }}>{pct}</span>
                </div>
                <DriveBar value={d.value} baseline={d.baseline} delta={d.delta} />
                {trig && (
                  <div style={{ fontSize: 10, color: isHigh ? C.red : C.green, marginTop: 4, paddingLeft: 23, opacity: 0.85 }}>
                    <span style={{ opacity: 0.7 }}>{trend}{speed} · </span>{trig}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {idleMin !== null && (
          <div style={{ marginTop: 14, paddingTop: 10, borderTop: `1px dashed ${C.border}`, fontSize: 10, color: C.text4 }}>
            距上次互动 {idleMin < 60 ? `${idleMin} 分钟` : `${Math.floor(idleMin / 60)} 小时 ${idleMin % 60} 分钟`}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Section 2: 念头池 ── */
function ThoughtsSection({ desire }) {
  if (!desire) return null;
  const { drives = [], thoughts = [] } = desire;

  // 最近被戳到的 top3 变化
  const changed = drives
    .filter(d => Math.abs(d.delta) > 0.05)
    .slice(0, 4);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {changed.length > 0 && (
        <div style={card}>
          <div style={sLabel}>最近被戳到</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {changed.map(d => (
              <div key={d.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ fontSize: 11, color: d.delta > 0 ? C.red : C.green, fontVariantNumeric: 'tabular-nums', flexShrink: 0, marginTop: 1, fontWeight: 600 }}>
                  {d.delta > 0 ? '+' : ''}{Math.round(d.delta * 100)}
                </span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 12.5, color: C.text1, fontFamily: 'Cormorant Garamond, Georgia, serif' }}>{d.label}</span>
                  {(d.delta > 0 ? DRIVE_TRIGGERS[d.key]?.up : DRIVE_TRIGGERS[d.key]?.down) && (
                    <div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>
                      {d.delta > 0 ? DRIVE_TRIGGERS[d.key].up : DRIVE_TRIGGERS[d.key].down}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={card}>
        <div style={sLabel}>心里的念头 {thoughts.length}</div>
        {thoughts.length === 0 ? (
          <div style={{ fontSize: 12, color: C.text4, fontFamily: 'Georgia, serif' }}>心里空空的，念头还没来</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {thoughts.map((t, i) => (
              <div key={i} style={{
                background: '#e8d5b430',
                border: `1px solid ${C.border}`,
                borderRadius: '8px 4px 7px 5px',
                padding: '11px 12px',
                position: 'relative',
              }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 7 }}>
                  <span style={{
                    fontSize: 9, color: C.text3, background: '#e0cdb050',
                    border: `1px solid ${C.border}`, borderRadius: 3, padding: '2px 7px',
                    flexShrink: 0,
                  }}>{t.type === 'fixation' ? '执念' : '闪念'}</span>
                  {t.type === 'fixation' && <span style={{ fontSize: 10, color: C.gold }}>✦</span>}
                </div>
                <div style={{ fontSize: 13, color: C.text1, lineHeight: 1.8, fontFamily: 'Cormorant Garamond, Georgia, serif' }}>{t.text}</div>
                <div style={{ height: 2, background: `linear-gradient(90deg, ${C.accent}50, transparent)`, borderRadius: 1, marginTop: 10 }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Section 3: 决策层 ── */
function DecisionSection({ desire }) {
  if (!desire) return null;
  const { drives = [] } = desire;
  const { pa, na } = computeEmotion(drives);
  const label = emotionLabel(pa, na);
  const tone = mainTone(drives);

  // 将 pa[-1,1] → x[10%,90%], na[-0.3,1] → y[90%→10%] (inverted, high NA = top)
  const dotX = ((pa + 1) / 2) * 80 + 10;
  const dotY = 90 - ((na + 0.3) / 1.3) * 80;

  // 主调描述
  const top3 = [...drives].sort((a, b) => b.delta - a.delta).slice(0, 2);
  const subtext = top3.map(d => d.label).join('、');

  return (
    <div style={card}>
      <div style={sLabel}>决策层 · 当下色调</div>

      {/* 三格摘要 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { label: '同步', value: `漂着 ${Math.round(Math.max(0, 1 - drives.find(d=>d.key==='attachment')?.value||0) * 100)}%`, sub: '等你来戳一下' },
          { label: '主调', value: tone, sub: subtext },
          { label: '色调', value: label, sub: `PA ${pa.toFixed(2)} · NA ${na.toFixed(2)}` },
        ].map(({ label: lb, value, sub }) => (
          <div key={lb} style={{
            flex: 1, background: '#e8d5b430', border: `1px solid ${C.border}`,
            borderRadius: '7px 4px 6px 5px', padding: '9px 8px',
          }}>
            <div style={{ fontSize: 9, color: C.text4, letterSpacing: 1, marginBottom: 4 }}>{lb}</div>
            <div style={{ fontSize: 13, color: C.text1, fontFamily: 'Cormorant Garamond, Georgia, serif', fontWeight: 600, lineHeight: 1.35, marginBottom: 3 }}>{value}</div>
            <div style={{ fontSize: 9.5, color: C.text3, lineHeight: 1.5 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* 情绪象限图 */}
      <div style={{ fontSize: 9, color: C.text4, letterSpacing: 2, marginBottom: 10 }}>色调落点</div>
      <div style={{ position: 'relative', width: '100%', paddingBottom: '72%', background: '#e8d9c040', borderRadius: '6px 3px 5px 4px', border: `1px solid ${C.border}` }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* 十字线 */}
          <div style={{ position: 'absolute', top: '50%', left: '8%', right: '8%', height: 1, background: '#c4a07830' }} />
          <div style={{ position: 'absolute', left: '50%', top: '8%', bottom: '8%', width: 1, background: '#c4a07830' }} />
          {/* 象限标签 */}
          {[
            { label: '焦虑', top: '9%', left: '10%' },
            { label: '兴奋', top: '9%', right: '10%' },
            { label: '沉闷', bottom: '9%', left: '10%' },
            { label: '温柔', bottom: '9%', right: '10%' },
          ].map(({ label: lb, ...pos }) => (
            <div key={lb} style={{ position: 'absolute', fontSize: 10, color: C.text4, ...pos }}>{lb}</div>
          ))}
          {/* 情绪点 */}
          <div style={{
            position: 'absolute',
            left: `${dotX}%`, top: `${Math.max(10, Math.min(88, dotY))}%`,
            transform: 'translate(-50%, -50%)',
            width: 10, height: 10, borderRadius: '50%',
            background: C.accent,
            boxShadow: `0 0 6px ${C.accent}88`,
          }} />
        </div>
      </div>
      <div style={{ textAlign: 'center', fontSize: 11, color: C.text3, marginTop: 10, fontFamily: 'Cormorant Garamond, Georgia, serif', fontStyle: 'italic' }}>{label}</div>
    </div>
  );
}

/* ── 主组件 ── */
export default function DesireDetailView({ onBack }) {
  const [desire, setDesire] = useState(null);
  const [ts, setTs] = useState(null);
  const [error, setError] = useState(false);

  async function load() {
    try {
      const d = await getVitals();
      if (d && !d.error) { setDesire(d.desire); setTs(d.ts); setError(false); }
      else setError(true);
    } catch { setError(true); }
  }

  useEffect(() => {
    load();
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, []);

  const timeStr = ts ? new Date(ts).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : null;

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      background: `${C.bg} url('${paperTex}')`, backgroundSize: '240px',
      overflow: 'hidden',
    }}>
      {/* TopBar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 16px',
        paddingTop: 'max(10px, env(safe-area-inset-top))',
        background: 'rgba(230,213,183,0.92)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px dashed #bda587',
        flexShrink: 0,
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 20, color: C.text3, padding: '0 4px', lineHeight: 1,
        }}>‹</button>
        <span style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 18, color: C.text1, letterSpacing: 1, flex: 1 }}>
          欲望系统
        </span>
        {timeStr && <span style={{ fontSize: 10, color: C.text3, fontVariantNumeric: 'tabular-nums' }}>{timeStr}</span>}
      </div>

      {/* Scroll area */}
      <div style={{
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        padding: '14px 14px 32px',
        display: 'flex', flexDirection: 'column', gap: 13,
        scrollbarWidth: 'thin', scrollbarColor: '#b89970 transparent',
      }}>
        {error && !desire && (
          <div style={{ textAlign: 'center', color: C.text3, padding: '32px 16px', fontFamily: 'Georgia, serif', fontSize: 13 }}>
            连接中…
          </div>
        )}

        {desire && (
          <>
            {/* 驱动状态 */}
            <div>
              <div style={{ fontSize: 9, letterSpacing: 3, color: C.text4, textTransform: 'uppercase', fontFamily: 'Georgia, serif', marginBottom: 8, paddingLeft: 2 }}>
                DRIVE · 驱动状态
              </div>
              <DrivesSection desire={desire} />
            </div>

            {/* 念头池 */}
            <div>
              <div style={{ fontSize: 9, letterSpacing: 3, color: C.text4, textTransform: 'uppercase', fontFamily: 'Georgia, serif', marginBottom: 8, paddingLeft: 2 }}>
                POOL · 念头池
              </div>
              <ThoughtsSection desire={desire} />
            </div>

            {/* 决策层 */}
            <div>
              <div style={{ fontSize: 9, letterSpacing: 3, color: C.text4, textTransform: 'uppercase', fontFamily: 'Georgia, serif', marginBottom: 8, paddingLeft: 2 }}>
                DECISION · 决策层
              </div>
              <DecisionSection desire={desire} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
