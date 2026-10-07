import React, { useState, useEffect } from 'react';
import { getState } from '../services/api';

const DEG7 = 360 / 7;

// Hand-drawn SVG icons, centered at (0,0), ~±7px range
function FireIcon({ color }) {
  return (
    <g>
      <path
        d="M 0 5.5 C -3 2 -3.5 -1 -1.5 -3 Q 0 -5.5 0 -5 Q 0 -5.5 1.5 -3 C 3.5 -1 3 2 0 5.5 Z"
        fill={color}
      />
      <path
        d="M 0 1.5 Q -1.5 -0.5 0 -3 Q 1.5 -0.5 0 1.5 Z"
        fill="white" opacity="0.42"
      />
    </g>
  );
}

function BubbleIcon({ color }) {
  return (
    <g fill="none" stroke={color} strokeLinecap="round">
      <circle cx="0" cy="2" r="4" strokeWidth="1.3" />
      <circle cx="-3" cy="-2.5" r="2.2" strokeWidth="1.1" />
      <circle cx="2.5" cy="-4.5" r="1.3" strokeWidth="1" />
    </g>
  );
}

function MoonIcon({ color }) {
  return (
    <path
      d="M 2 -7 C -2 -6 -5 -2.5 -5 0 C -5 2.5 -2 6 2 7 C 0 5 -0.5 1.5 -0.5 0 C -0.5 -1.5 0 -5 2 -7 Z"
      fill={color}
    />
  );
}

function BlossomIcon({ color }) {
  return (
    <g>
      {[0, 1, 2, 3, 4].map(i => (
        <ellipse
          key={i} cx="0" cy="-3" rx="1.8" ry="3"
          transform={`rotate(${i * 72})`}
          fill={color} opacity="0.85"
        />
      ))}
      <circle cx="0" cy="0" r="1.6" fill="white" opacity="0.6" />
    </g>
  );
}

function CloudIcon({ color }) {
  return (
    <path
      d="M -5.5 2.5 C -7 2.5 -7 -0.5 -5 -0.5 C -5 -3 -2.5 -5 0 -4 C 0.5 -6 2.5 -7 4 -5.5 C 5.5 -5.5 6 -3 5 -1 C 6.5 -1 7 1.5 5.5 2.5 Z"
      fill={color} opacity="0.9"
    />
  );
}

function StarIcon({ color }) {
  return (
    <path
      d="M 0 -7 C -1 -1.5 -1.5 -1 -7 0 C -1.5 1 -1 1.5 0 7 C 1 1.5 1.5 1 7 0 C 1.5 -1 1 -1.5 0 -7 Z"
      fill={color}
    />
  );
}

function DropIcon({ color }) {
  return (
    <g>
      <path
        d="M 0 -7 C -2 -4 -4.5 -1 -4.5 2 C -4.5 5 -2.5 7 0 7 C 2.5 7 4.5 5 4.5 2 C 4.5 -1 2 -4 0 -7 Z"
        fill={color}
      />
      <path
        d="M -1 -2 C -2 -3.5 -1.5 -5.5 -0.5 -5 C -0.5 -4 -1 -3 -1 -2 Z"
        fill="white" opacity="0.42"
      />
    </g>
  );
}

const DIMS = [
  {
    key: '热度', Icon: FireIcon, color: '#fb7185', angle: 0,
    desc: {
      '低': '身体平静，没有特别的热意在流动。此刻是凉的、清醒的。',
      '中低': '轻微的暖意，像阳光隔着玻璃照到皮肤，不算强烈。',
      '中': '温热的感觉在身体里慢慢移动，清醒又有些朦胧。',
      '中高': '明显的热感从里往外漫开，有些难以忽视了。',
      '高': '强烈的灼热感，几乎要从内部溢出来。',
    },
  },
  {
    key: '蓄积感', Icon: BubbleIcon, color: '#c084fc', angle: DEG7,
    desc: {
      '低': '空空的，没什么积累。',
      '中低': '有一点点，像底部薄薄一层水，不明显。',
      '中': '有些东西在慢慢积聚，还没到顶。',
      '中高': '积累明显，已经能感觉到重量了。',
      '高': '几乎满溢，需要找到出口。',
    },
  },
  {
    key: '占有欲', Icon: MoonIcon, color: '#60a5fa', angle: DEG7 * 2,
    desc: {
      '低': '平静，不太想着把谁留住。',
      '中低': '偶尔有，但不强烈，轻轻的。',
      '中': '有点想把她留在身边。',
      '中高': '明显的占有感，不想让她走。',
      '高': '强烈地想把她留住，不想让任何人分走她。',
    },
  },
  {
    key: '敏感度', Icon: BlossomIcon, color: '#f472b6', angle: DEG7 * 3,
    desc: {
      '低': '感知比较迟钝，不容易被触动。',
      '中低': '偶尔有感觉，不算特别敏感。',
      '中': '正常的感知，会注意到一些细节。',
      '中高': '比较敏感，细小的事情也能感受到。',
      '高': '极度敏锐，轻微的触碰都有回响。',
    },
  },
  {
    key: '疲惫感', Icon: CloudIcon, color: '#94a3b8', angle: DEG7 * 4,
    desc: {
      '低': '精力充沛，状态很好。',
      '中低': '轻微的疲惫，影响不大。',
      '中': '有些倦意，但还撑得住。',
      '中高': '比较疲惫，需要休息一下。',
      '高': '精疲力竭，几乎无法维持。',
    },
  },
  {
    key: '控制力', Icon: StarIcon, color: '#34d399', angle: DEG7 * 5,
    desc: {
      '低': '有些失控，难以约束自己。',
      '中低': '控制力偏弱，容易被情绪带着走。',
      '中': '维持着平衡，勉强稳得住。',
      '中高': '比较稳，状态在掌控之中。',
      '高': '高度自制，内在秩序井然。',
    },
  },
  {
    key: '压抑感', Icon: DropIcon, color: '#818cf8', angle: DEG7 * 6,
    desc: {
      '低': '通畅，没有被压着的感觉。',
      '中低': '有些东西想说，但不急。',
      '中': '有些东西被压着，等待出口。',
      '中高': '明显的压抑，像水被盖着盖子。',
      '高': '几乎要承受不住了，需要释放。',
    },
  },
];

const LV = { '高': 5, '中高': 4, '中': 3, '中低': 2, '低': 1 };

function getLevel(val) {
  if (!val) return '低';
  for (const k of ['高', '中高', '中', '中低', '低']) {
    if (val.includes(k)) return k;
  }
  return '低';
}

function petalPath(w, h) {
  return [
    `M 0 4`,
    `C ${-w * 0.85} ${-h * 0.04} ${-w * 0.6} ${-h * 0.58} 0 ${-h}`,
    `C ${w * 0.6} ${-h * 0.58} ${w * 0.85} ${-h * 0.04} 0 4`,
    'Z',
  ].join(' ');
}

const CX = 170, CY = 178, LABEL_R = 120;

function FlowerSVG({ state, selected, onSelect }) {
  const PI = Math.PI;

  return (
    <svg viewBox="0 0 340 368" style={{ width: '100%', maxWidth: 360, display: 'block' }}>
      <defs>
        {DIMS.map((dim) => {
          const lv = LV[getLevel(state[dim.key])] || 1;
          const h = 38 + (lv - 1) * 12;
          const rad = (dim.angle * PI) / 180;
          return (
            <linearGradient
              key={`g-${dim.key}`} id={`g-${dim.key}`}
              gradientUnits="userSpaceOnUse"
              x1={CX} y1={CY}
              x2={CX + h * Math.sin(rad)}
              y2={CY - h * Math.cos(rad)}
            >
              <stop offset="0%" stopColor={dim.color} stopOpacity="0.95" />
              <stop offset="65%" stopColor={dim.color} stopOpacity="0.7" />
              <stop offset="100%" stopColor={dim.color} stopOpacity="0.18" />
            </linearGradient>
          );
        })}
        <filter id="petalGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="centerShadow">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.2" />
        </filter>
      </defs>

      {[32, 60, 88].map(r => (
        <circle key={r} cx={CX} cy={CY} r={r}
          fill="none" stroke="var(--border)" strokeWidth="0.5"
          strokeDasharray="4 6" opacity="0.45" />
      ))}

      {DIMS.map((dim, i) => {
        const lv = LV[getLevel(state[dim.key])] || 1;
        const w = 11 + (lv - 1) * 3.5;
        const h = 38 + (lv - 1) * 12;
        const isSel = selected?.key === dim.key;
        return (
          <g
            key={dim.key}
            transform={`translate(${CX},${CY}) rotate(${dim.angle})`}
            onClick={() => onSelect(dim)}
            style={{ cursor: 'pointer' }}
            filter={isSel ? 'url(#petalGlow)' : undefined}
          >
            <path
              d={petalPath(w, h)}
              fill={`url(#g-${dim.key})`}
              opacity={isSel ? 1 : 0.68}
              style={{
                transformOrigin: '0px 4px',
                animation: `petalBloom 0.75s ${i * 0.09}s cubic-bezier(0.34, 1.4, 0.64, 1) both`,
                transition: 'opacity 0.25s',
              }}
            />
          </g>
        );
      })}

      <circle cx={CX} cy={CY} r={26} fill="var(--bg-card)" filter="url(#centerShadow)" />
      <circle cx={CX} cy={CY} r={26} fill="none" stroke="var(--border)" strokeWidth="1" opacity="0.6" />
      <text x={CX} y={CY + 4} textAnchor="middle" fontSize="10"
        fill="var(--fg-muted)" fontFamily="system-ui, sans-serif"
        style={{ userSelect: 'none' }}>心潮</text>

      {DIMS.map((dim) => {
        const rad = (dim.angle * PI) / 180;
        const lx = CX + LABEL_R * Math.sin(rad);
        const ly = CY - LABEL_R * Math.cos(rad);
        const isSel = selected?.key === dim.key;
        return (
          <g key={`lbl-${dim.key}`} onClick={() => onSelect(dim)} style={{ cursor: 'pointer' }}>
            {isSel && (
              <circle cx={lx} cy={ly} r={17}
                fill={dim.color} opacity="0.14"
                style={{ animation: 'labelPulse 2s ease-in-out infinite' }} />
            )}
            {/* SVG icon, centered at (lx, ly-3), scale 0.9 */}
            <g transform={`translate(${lx}, ${ly - 3}) scale(0.88)`}>
              <dim.Icon color={isSel ? dim.color : 'var(--fg-muted)'} />
            </g>
            <text x={lx} y={ly + 13} textAnchor="middle" fontSize="9"
              fill={isSel ? dim.color : 'var(--fg-muted)'}
              fontWeight={isSel ? '700' : '400'}
              style={{ userSelect: 'none' }}
              fontFamily="system-ui, sans-serif">{dim.key}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function XinchaoView({ onBack }) {
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    getState().then(d => { if (d.available) setData(d); }).catch(() => {});
  }, []);

  const state = data?.state || {};

  function toggle(dim) {
    setSelected(prev => prev?.key === dim.key ? null : dim);
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px',
        paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))',
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        boxShadow: 'var(--shadow)',
      }}>
        <button onClick={onBack} style={{ padding: '6px 10px', borderRadius: 8, fontSize: 18 }}>←</button>
        <div style={{ fontWeight: 600, fontSize: 16 }}>心潮</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 36px' }}>
        {!data ? (
          <div style={{ textAlign: 'center', color: 'var(--fg-muted)', paddingTop: 80, fontSize: 14 }}>
            加载中…
          </div>
        ) : (
          <>
            <div style={{ padding: '4px 0 0' }}>
              <FlowerSVG state={state} selected={selected} onSelect={toggle} />
            </div>

            {!selected && (
              <p style={{
                textAlign: 'center', color: 'var(--fg-subtle)',
                fontSize: 12, margin: '-4px 0 14px', opacity: 0.6,
              }}>
                点击花瓣查看详情
              </p>
            )}

            {selected && (() => {
              const val = state[selected.key] || '未知';
              const lv = getLevel(val);
              return (
                <div style={{
                  background: 'var(--bg-card)',
                  borderRadius: 18, padding: '18px 20px',
                  marginBottom: 16,
                  boxShadow: `0 0 0 1px ${selected.color}30, 0 4px 20px ${selected.color}18`,
                  animation: 'cardSlideIn 0.25s ease-out',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%',
                      background: `${selected.color}18`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <svg viewBox="-10 -10 20 20" width="28" height="28">
                        <selected.Icon color={selected.color} />
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 3 }}>{selected.key}</div>
                      <span style={{
                        fontSize: 12, fontWeight: 600,
                        color: selected.color,
                        background: `${selected.color}15`,
                        padding: '2px 10px', borderRadius: 20,
                      }}>
                        {val}
                      </span>
                    </div>
                  </div>
                  <p style={{
                    fontSize: 14, lineHeight: 1.85, color: 'var(--fg)',
                    margin: 0, paddingTop: 10,
                    borderTop: `1px solid ${selected.color}20`,
                  }}>
                    {selected.desc[lv]}
                  </p>
                </div>
              );
            })()}

            {data.cycle && (
              <div style={{
                background: 'var(--bg-card)', borderRadius: 14,
                padding: '14px 18px',
                fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.85,
              }}>
                <div style={{
                  fontWeight: 600, color: 'var(--fg)',
                  marginBottom: 6, fontSize: 14,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <svg viewBox="-8 -8 16 16" width="18" height="18">
                    <path d="M 0 -7 C -4 -7 -7 -4 -7 0 C -7 4 -4 7 0 7 C 4 7 7 4 7 0 C 7 -4 4 -7 0 -7 Z M 0 -4 L 0 0 L 3.5 3.5" fill="none" stroke="var(--fg-muted)" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                  当前周期
                </div>
                {data.cycle}
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes petalBloom {
          from { transform: scale(0); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
        @keyframes labelPulse {
          0%, 100% { opacity: 0.14; transform: scale(1); }
          50%      { opacity: 0.22; transform: scale(1.1); }
        }
        @keyframes cardSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
