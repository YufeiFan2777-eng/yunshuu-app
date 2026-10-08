import React, { useState, useEffect } from 'react';
import paperTex from '/paper-tex.jpg';

const CONSCIOUSNESS_MAP = {
  awake:    { label: '清醒', color: '#5a9a6a' },
  drowsy:   { label: '困倦', color: '#a8843a' },
  sleeping: { label: '熟睡中', color: '#7a85a0' },
  dreaming: { label: '梦中', color: '#8a7aaa' },
};

const BG = `#e6d5b7 url('${paperTex}')`;

/* ────── 顶部栏 ────── */
function TopBar({ title, onBack, extra }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px',
      paddingTop: 'max(10px, env(safe-area-inset-top))',
      background: 'rgba(230,213,183,0.92)',
      backdropFilter: 'blur(8px)',
      borderBottom: '1px dashed #bda587',
      flexShrink: 0, zIndex: 10,
    }}>
      <button onClick={onBack} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: 22, color: '#7D5A44', lineHeight: 1, padding: '2px 6px',
      }}>‹</button>
      <span style={{
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: 18, color: '#3d2b1a', letterSpacing: 1,
      }}>{title}</span>
      {extra && <span style={{ marginLeft: 'auto' }}>{extra}</span>}
    </div>
  );
}

/* ────── 状态摘要条 ────── */
function StateSummary({ state }) {
  const cInfo = CONSCIOUSNESS_MAP[state?.consciousness] || { label: state?.consciousness || '—', color: '#999' };
  const emotion = state?.emotion || {};
  const drives = (state?.topDrives || []).slice(0, 2);
  const fatigue = state?.fatigue;
  return (
    <div style={{
      background: '#f5e9d5cc', border: '1px solid #bfa58340',
      borderRadius: 6, padding: '12px 16px', margin: '14px 14px 0',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: cInfo.color, boxShadow: `0 0 5px ${cInfo.color}88`, flexShrink: 0,
        }} />
        <span style={{ fontSize: 14, color: '#3d2b1a', fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
          {cInfo.label}
        </span>
        <span style={{ fontSize: 15, color: '#3d2b1a', fontFamily: 'Cormorant Garamond, Georgia, serif', marginLeft: 6 }}>
          {emotion.shown || emotion.label || '—'}
        </span>
        {fatigue != null && (
          <span style={{ marginLeft: 'auto', fontSize: 10, color: '#9b7a58' }}>
            疲劳 {Math.round(fatigue * 100)}
          </span>
        )}
      </div>
      {drives.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {drives.map(d => (
            <span key={d.key} style={{
              fontSize: 10, color: '#7a5a3a',
              background: '#e8d9c040', border: '1px solid #bfa58330',
              borderRadius: 3, padding: '2px 8px',
            }}>{d.label}</span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ────── 情绪波浪 ────── */
function EmotionWave({ emotion }) {
  const arousal = typeof emotion?.arousal === 'number' ? emotion.arousal : 0.3;
  const valence = typeof emotion?.valence === 'number' ? emotion.valence : 0.5;
  const W = 260, H = 52, cy = H / 2;
  const amp = 4 + arousal * 22;
  const pts = [];
  for (let i = 0; i <= 64; i++) {
    const x = (i / 64) * W;
    const y = cy + Math.sin((i / 64) * Math.PI * 2 * 2.5) * amp;
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  const wavePath = 'M ' + pts.join(' L ');
  const r = Math.round(160 + valence * 40);
  const g = Math.round(110 + valence * 30);
  const b = Math.round(60 + (1 - valence) * 70);
  const sc = `rgb(${r},${g},${b})`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 52 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="waveGrad" x1="0" x2="1">
          <stop offset="0%" stopColor={sc} stopOpacity="0.05"/>
          <stop offset="25%" stopColor={sc} stopOpacity="0.85"/>
          <stop offset="75%" stopColor={sc} stopOpacity="0.85"/>
          <stop offset="100%" stopColor={sc} stopOpacity="0.05"/>
        </linearGradient>
      </defs>
      <path d={wavePath} fill="none" stroke="url(#waveGrad)" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

/* ────── 驱力花瓣图 ────── */
function DriveFlower({ drives, emotion }) {
  const [selectedKey, setSelectedKey] = useState(null);
  const n = drives.length;
  if (n === 0) return null;
  const cx = 110, cy = 110, minR = 22, maxR = 78;
  const maxVal = Math.max(...drives.map(d => d.value), 0.001);
  const sp = 0.38;

  const petals = drives.map((d, i) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    const r = minR + (d.value / maxVal) * (maxR - minR);
    const tx = (cx + Math.cos(angle) * r).toFixed(1);
    const ty = (cy + Math.sin(angle) * r).toFixed(1);
    const path = [
      `M ${cx},${cy}`,
      `C ${(cx+Math.cos(angle+sp)*r*0.5).toFixed(1)},${(cy+Math.sin(angle+sp)*r*0.5).toFixed(1)}`,
      ` ${(cx+Math.cos(angle+sp*0.3)*r*0.96).toFixed(1)},${(cy+Math.sin(angle+sp*0.3)*r*0.96).toFixed(1)}`,
      ` ${tx},${ty}`,
      `C ${(cx+Math.cos(angle-sp*0.3)*r*0.96).toFixed(1)},${(cy+Math.sin(angle-sp*0.3)*r*0.96).toFixed(1)}`,
      ` ${(cx+Math.cos(angle-sp)*r*0.5).toFixed(1)},${(cy+Math.sin(angle-sp)*r*0.5).toFixed(1)}`,
      ` ${cx},${cy}`,
    ].join(' ');
    const ld = r + 18;
    const lx = (cx + Math.cos(angle) * ld).toFixed(1);
    const ly = (cy + Math.sin(angle) * ld).toFixed(1);
    const shortLabel = (d.label || d.key).slice(0, 3);
    const isSelected = selectedKey === d.key;
    const opacity = isSelected
      ? Math.min(0.22 + (d.value / maxVal) * 0.52 + 0.28, 0.95).toFixed(2)
      : (0.22 + (d.value / maxVal) * 0.52).toFixed(2);
    return { key: d.key, label: d.label, value: d.value, path, lx, ly, shortLabel, opacity, isSelected };
  });

  const emotionLabel = emotion?.shown || emotion?.label || '—';
  const selected = drives.find(d => d.key === selectedKey);

  return (
    <div>
      <svg viewBox="0 0 220 220" style={{ width: '100%', maxWidth: 220, margin: '0 auto', display: 'block' }}>
        {petals.map(p => (
          <g key={p.key} onClick={() => setSelectedKey(p.isSelected ? null : p.key)} style={{ cursor: 'pointer' }}>
            <path d={p.path}
              fill={`rgba(175,138,88,${p.opacity})`}
              stroke={p.isSelected ? 'rgba(125,90,60,0.9)' : 'rgba(155,122,88,0.45)'}
              strokeWidth={p.isSelected ? '1.2' : '0.5'}/>
            <text x={p.lx} y={p.ly} textAnchor="middle" dominantBaseline="middle"
              fontSize="8" fill={p.isSelected ? '#3d2b1a' : '#7a5a3a'}
              fontWeight={p.isSelected ? 'bold' : 'normal'}>{p.shortLabel}</text>
          </g>
        ))}
        <circle cx={cx} cy={cy} r="19" fill="#f5ece0" stroke="#c4a07860" strokeWidth="0.8"/>
        <text x={cx} y={cy+1} textAnchor="middle" dominantBaseline="middle"
          fontSize="9" fill="#5a3e28" fontFamily="Cormorant Garamond, Georgia, serif">{emotionLabel}</text>
      </svg>

      {/* 点击花瓣后的详情 */}
      {selected && (
        <div style={{
          marginTop: 10, background: '#ede3d0', border: '1px solid #bfa58360',
          borderRadius: 4, padding: '10px 14px',
          animation: 'fadeIn 0.15s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 7 }}>
            <span style={{ fontSize: 15, color: '#3d2b1a', fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
              {selected.label}
            </span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: '#9b7a58', fontVariantNumeric: 'tabular-nums' }}>
              {Math.round(selected.value * 100)}
            </span>
          </div>
          <div style={{ height: 2, background: '#d4bfa060', borderRadius: 1, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 1,
              width: `${Math.round((selected.value / maxVal) * 100)}%`,
              background: 'linear-gradient(90deg, #9b7a58, #c4a882)',
            }}/>
          </div>
        </div>
      )}
    </div>
  );
}

/* ────── 卡片样式 ────── */
const card = {
  background: '#f5e9d5d9', border: '1px solid #bfa58380',
  boxShadow: '2px 3px 0 #d8c3a17a, 0 4px 10px #71533210',
  borderRadius: '3px 6px 2px 5px', padding: '17px', position: 'relative',
};
const tab = {
  display: 'inline-block', background: '#d8b7a28a',
  padding: '2px 13px', margin: '-17px 0 10px -8px',
  transform: 'rotate(-1deg)', fontSize: 13, letterSpacing: 2,
  fontFamily: 'Georgia, serif', position: 'relative', zIndex: 1,
};
const scrollArea = {
  flex: 1, overflowY: 'auto', overflowX: 'hidden',
  padding: '14px 14px 28px',
  display: 'flex', flexDirection: 'column', gap: 13,
  scrollbarWidth: 'thin', scrollbarColor: '#b89970 transparent',
};

/* ────── 详情页：此刻 ────── */
function FlashView({ state, onBack }) {
  const consciousness = state?.consciousness || 'awake';
  const cInfo = CONSCIOUSNESS_MAP[consciousness] || { label: consciousness, color: '#999' };
  const emotion = state?.emotion || {};
  const fatigue = typeof state?.fatigue === 'number' ? state.fatigue : null;
  const drives = state?.topDrives || [];
  const flash = state?.thoughts?.flash || [];
  const noData = !state;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: BG, backgroundSize: '240px', overflow: 'hidden' }}>
      <TopBar title="此刻" onBack={onBack} />
      <div style={scrollArea}>
        {noData && <EmptyHint text="等待心潮同步…" />}

        {/* 意识 + 疲劳 */}
        {state && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 2px' }}>
            <span style={{ fontSize: 8.5, letterSpacing: 2.5, color: '#9b7a58', textTransform: 'uppercase', fontFamily: 'Georgia, serif' }}>CONSCIOUSNESS</span>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: cInfo.color, boxShadow: `0 0 5px ${cInfo.color}aa`, flexShrink: 0 }}/>
            <span style={{ fontSize: 13, color: '#3d2b1a', fontFamily: 'Cormorant Garamond, Georgia, serif' }}>{cInfo.label}</span>
            {fatigue !== null && (
              <span style={{ marginLeft: 'auto', fontSize: 9, color: '#a08060', letterSpacing: 0.5 }}>
                疲劳 {Math.round(fatigue * 100)}%
              </span>
            )}
          </div>
        )}

        {/* 情绪波浪 */}
        {state && (
          <div style={card}>
            <div style={{ fontSize: 8.5, letterSpacing: 2.5, color: '#9b7a58', textTransform: 'uppercase', fontFamily: 'Georgia, serif', marginBottom: 10 }}>INNER TIDE · 情绪</div>
            <EmotionWave emotion={emotion} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
              <span style={{
                fontSize: 12, color: '#5a3e28',
                background: '#e8d9c080', border: '1px solid #bfa58350',
                borderRadius: 3, padding: '2px 12px',
                fontFamily: 'Cormorant Garamond, Georgia, serif',
              }}>{emotion.shown || emotion.label || '平静'}</span>
              <span style={{ fontSize: 9, color: '#a08060', letterSpacing: 0.5 }}>
                唤醒 {Math.round((emotion.arousal || 0) * 100)} · 效价 {Math.round((emotion.valence || 0) * 100)}
              </span>
            </div>
          </div>
        )}

        {/* 驱力花瓣 */}
        {drives.length > 0 && (
          <div style={card}>
            <div style={{ fontSize: 8.5, letterSpacing: 2.5, color: '#9b7a58', textTransform: 'uppercase', fontFamily: 'Georgia, serif', marginBottom: 6 }}>INNER TIDE · 驱力</div>
            <DriveFlower drives={drives} emotion={emotion} />
            <div style={{ fontSize: 10, color: '#a08060', textAlign: 'center', marginTop: 4, fontFamily: 'Cormorant Garamond, Georgia, serif', letterSpacing: 0.5 }}>
              {drives.length}股潮水，共用一个身体
            </div>
            {/* 情绪详情框 */}
            <div style={{
              marginTop: 14, background: '#ede3d0', border: '1px solid #bfa58345',
              borderRadius: 4, padding: '10px 14px',
              display: 'flex', alignItems: 'flex-start', gap: 12,
            }}>
              <span style={{
                fontSize: 18, color: '#3d2b1a', fontFamily: 'Cormorant Garamond, Georgia, serif',
                lineHeight: 1.2, paddingTop: 2, minWidth: 40,
              }}>{emotion.shown || emotion.label || '—'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, color: '#9b7a58', letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Georgia, serif' }}>
                  唤醒 {Math.round((emotion.arousal || 0) * 100)} · 效价 {Math.round((emotion.valence || 0) * 100)}
                </div>
                <div style={{ fontSize: 11.5, color: '#5a3e28', marginTop: 5, lineHeight: 1.7, fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
                  {(() => {
                    const a = emotion?.arousal || 0, v = emotion?.valence || 0.5;
                    if (a > 0.65 && v > 0.6) return "激活而愉悦，潮水高涨开阔";
                    if (a > 0.65 && v < 0.4) return "紧绷而低沉，潮水翻涌不安";
                    if (a > 0.65)            return "有些激动，潮水起伏明显";
                    if (a < 0.25 && v > 0.6) return "宁静而温暖，潮水平缓流淌";
                    if (a < 0.25 && v < 0.4) return "安静而低落，潮水悄悄退落";
                    if (a < 0.25)            return "近乎平静无波，各片潮水静守";
                    if (v > 0.6)             return "心情尚好，潮水轻轻流动";
                    if (v < 0.4)             return "有些沉郁，潮水慢慢低落";
                    return "海面平，有点起伏，各片潮水照常";
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 浮念 */}
        {flash.length > 0 && (
          <>
            <div style={{ fontSize: 8.5, letterSpacing: 2.5, color: '#9b7a58', textTransform: 'uppercase', fontFamily: 'Georgia, serif', padding: '4px 2px' }}>THOUGHTS · 浮念</div>
            {flash.map((f, i) => (
              <div key={i} style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{
                    fontSize: 9.5, color: '#9b7a58', background: '#d4bfa040',
                    border: '1px solid #bfa58340', borderRadius: 2, padding: '1px 7px', letterSpacing: 0.8,
                  }}>{(f.label || f.key).split('、')[0].slice(0, 5)}</span>
                  <span style={{ fontSize: 9.5, color: '#b89060', marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>
                    {f.age > 0 ? `${f.age}分钟前` : '片刻前'}
                  </span>
                </div>
                {f.text && <div style={{ fontSize: 12.5, color: '#513b29', lineHeight: 1.8, marginBottom: 8, fontFamily: 'Cormorant Garamond, Georgia, serif' }}>{f.text}</div>}
                <div style={{ height: 2, background: '#d4bfa050', borderRadius: 1, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 1,
                    width: `${Math.min((f.intensity || 0) * 100, 100)}%`,
                    background: 'linear-gradient(90deg, #9b7a58, #c4a882)',
                  }}/>
                </div>
              </div>
            ))}
          </>
        )}

        {state && flash.length === 0 && drives.length === 0 && (
          <EmptyHint text="此刻平静，无浮现的念" />
        )}
      </div>
    </div>
  );
}

/* ────── 详情页：互动 ────── */
function InteractionView({ state, onBack }) {
  const interactions = state?.interactions || [];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: BG, backgroundSize: '240px', overflow: 'hidden' }}>
      <TopBar title="互动" onBack={onBack} />
      <div style={scrollArea}>
        {interactions.length === 0 && <EmptyHint text="暂无近期互动记录" />}
        {interactions.length > 0 && (
          <div style={card}>
            <div style={tab}>近期互动</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingTop: 4 }}>
              {interactions.map((ix, i) => {
                const d = ix.at ? new Date(ix.at) : null;
                const diffMin = d ? Math.floor((Date.now() - d.getTime()) / 60000) : 0;
                let timeStr;
                if (diffMin < 1) timeStr = '刚刚';
                else if (diffMin < 60) timeStr = `${diffMin}分钟前`;
                else if (diffMin < 1440) timeStr = `${Math.floor(diffMin / 60)}小时前`;
                else timeStr = d ? d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }) : '—';
                return (
                  <div key={i} style={{
                    fontSize: 11, color: '#7a5a3a',
                    background: '#e8d9c040', border: '1px solid #bfa58330',
                    borderRadius: 3, padding: '3px 10px', fontVariantNumeric: 'tabular-nums',
                  }}>
                    {ix.type && <span style={{ color: '#9b7a58', marginRight: 5 }}>{ix.type}</span>}
                    {timeStr}
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: 10, color: '#b89060', marginTop: 12 }}>
              共 {interactions.length} 次近期互动
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ────── 详情页：匣子 ────── */
function BridgeView({ state, onBack }) {
  const bridge = state?.bridge || [];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: BG, backgroundSize: '240px', overflow: 'hidden' }}>
      <TopBar title="匣子" onBack={onBack} />
      <div style={scrollArea}>
        {bridge.length === 0 && <EmptyHint text="匣子暂时为空" />}
        {bridge.map((b, i) => {
          const d = b.at ? new Date(b.at) : null;
          const timeStr = d ? d.toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
          return (
            <div key={i} style={card}>
              {b.reason && (
                <div style={{ fontSize: 10, color: '#9b7a58', marginBottom: 8, letterSpacing: 0.5 }}>{b.reason}</div>
              )}
              <div style={{ fontSize: 12.5, color: '#513b29', lineHeight: 1.8 }}>{b.message}</div>
              {timeStr && <div style={{ fontSize: 10, color: '#b89060', marginTop: 8 }}>{timeStr}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ────── 详情页：小屋来信 ────── */
function CabinView({ state, onBack }) {
  const cabin = state?.cabin || [];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: BG, backgroundSize: '240px', overflow: 'hidden' }}>
      <TopBar title="小屋来信" onBack={onBack} />
      <div style={scrollArea}>
        {cabin.length === 0 && <EmptyHint text="小屋暂无来信" />}
        {cabin.map((n, i) => (
          <div key={i} style={card}>
            <div style={tab}>
              {n.from === 'ai' ? '云舒 → 雨菲' : n.from === 'human' ? '雨菲 → 云舒' : n.from}
            </div>
            <div style={{
              fontSize: 13, color: '#3d2b1a', lineHeight: 2,
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              fontFamily: 'Georgia, serif', paddingTop: 4,
            }}>{n.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyHint({ text }) {
  return (
    <div style={{ textAlign: 'center', color: '#a08060', padding: '32px 16px', fontFamily: 'Georgia, serif', fontSize: 13, lineHeight: 2 }}>
      {text}
    </div>
  );
}

/* ────── 列表项图标 ────── */
const SECTIONS = [
  {
    key: 'flash',
    title: '此刻',
    subtitle: '浮现的念与思绪流',
    icon: (
      <svg viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
        <circle cx="18" cy="18" r="3" fill="currentColor" opacity=".3"/>
        <path d="M18 6 Q24 12 18 18 Q12 24 18 30" strokeWidth="1.2"/>
        <path d="M10 10 Q14 14 12 18" strokeWidth="1" opacity=".5"/>
        <path d="M26 10 Q22 14 24 18" strokeWidth="1" opacity=".5"/>
      </svg>
    ),
  },
  {
    key: 'interactions',
    title: '互动',
    subtitle: '近期互动时间轴',
    icon: (
      <svg viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
        <circle cx="18" cy="18" r="10"/>
        <path d="M18 10 v4 M18 22 v4 M10 18 h4 M22 18 h4" strokeWidth="1"/>
        <circle cx="18" cy="18" r="3" fill="currentColor" opacity=".25"/>
      </svg>
    ),
  },
  {
    key: 'bridge',
    title: '匣子',
    subtitle: '待送达的心意',
    icon: (
      <svg viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
        <rect x="6" y="12" width="24" height="16" rx="2"/>
        <path d="M6 14 L18 22 L30 14"/>
        <path d="M14 8 h8" strokeWidth="1.2" opacity=".6"/>
      </svg>
    ),
  },
  {
    key: 'cabin',
    title: '小屋来信',
    subtitle: '小屋里写下的信',
    icon: (
      <svg viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
        <path d="M6 18 L18 8 L30 18"/>
        <rect x="10" y="18" width="16" height="12" rx="1"/>
        <rect x="15" y="22" width="6" height="8" rx="1"/>
      </svg>
    ),
  },
];

/* ────── 列表首页 ────── */
function XinchaoIndex({ state, loadError, onBack, onSelect, timeStr }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: BG, backgroundSize: '240px', overflow: 'hidden' }}>
      <TopBar
        title="心潮"
        onBack={onBack}
        extra={timeStr && (
          <span style={{ fontSize: 11, color: '#a08060', fontVariantNumeric: 'tabular-nums' }}>{timeStr} 更新</span>
        )}
      />
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'thin', scrollbarColor: '#b89970 transparent' }}>
        {loadError && !state && <EmptyHint text={'暂无数据\n等待心潮同步…'} />}
        <div style={{ padding: '12px 14px 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SECTIONS.map(sec => (
            <button key={sec.key} onClick={() => onSelect(sec.key)} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              background: '#f5e9d5d9', border: '1px solid #bfa58380',
              boxShadow: '2px 3px 0 #d8c3a17a, 0 4px 10px #71533210',
              borderRadius: '14px 10px 13px 11px',
              padding: '15px 14px', cursor: 'pointer', textAlign: 'left',
              transition: 'background 0.15s, transform 0.12s',
              position: 'relative',
            }}>
              <span style={{
                width: 44, height: 44, flexShrink: 0,
                background: '#7D5A44', borderRadius: '12px 9px 13px 10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#f5ede2', boxShadow: '1px 2px 0 #5a3e2b50',
              }}>{sec.icon}</span>
              <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontSize: 16, color: '#3d2b1a', fontWeight: 500 }}>{sec.title}</span>
                <span style={{ fontSize: 12, color: '#8f775e' }}>{sec.subtitle}</span>
              </span>
              <span style={{ fontSize: 22, color: '#b89a72', lineHeight: 1, marginRight: 2 }}>›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ────── 主组件 ────── */
export default function XinchaoNianView({ onBack }) {
  const [state, setState] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [subView, setSubView] = useState(null);

  function loadState() {
    fetch(`${import.meta.env.BASE_URL}xinchao-state.json?t=${Date.now()}`)
      .then(r => r.json())
      .then(d => { setState(d); setLoadError(false); })
      .catch(() => setLoadError(true));
  }

  useEffect(() => {
    loadState();
    const iv = setInterval(loadState, 5 * 60 * 1000);
    return () => clearInterval(iv);
  }, []);

  const updatedAt = state?.updatedAt;
  const timeStr = updatedAt
    ? new Date(updatedAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

  const goBack = () => setSubView(null);

  if (subView === 'flash')        return <FlashView state={state} onBack={goBack} />;
  if (subView === 'interactions') return <InteractionView state={state} onBack={goBack} />;
  if (subView === 'bridge')       return <BridgeView state={state} onBack={goBack} />;
  if (subView === 'cabin')        return <CabinView state={state} onBack={goBack} />;

  return (
    <XinchaoIndex
      state={state}
      loadError={loadError}
      onBack={onBack}
      onSelect={setSubView}
      timeStr={timeStr}
    />
  );
}
