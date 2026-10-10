import React, { useState, useEffect } from 'react';
import { getState } from '../services/api';

const DEG7 = 360 / 7;
const CN_KEYS = ['热度', '蓄积感', '占有欲', '敏感度', '疲惫感', '控制力', '压抑感'];
const COLORS  = ['#b77c6e','#b79a58','#b58282','#958198','#7f94a0','#929776','#ad8465'];

const DESCS = {
  '热度':  { '低':'身体平静，没有特别的热意在流动。此刻是凉的、清醒的。', '中低':'轻微的暖意，像阳光隔着玻璃照到皮肤，不算强烈。', '中':'温热的感觉在身体里慢慢移动，清醒又有些朦胧。', '中高':'明显的热感从里往外漫开，有些难以忽视了。', '高':'强烈的灼热感，几乎要从内部溢出来。' },
  '蓄积感':{ '低':'空空的，没什么积累。', '中低':'有一点点，像底部薄薄一层水，不明显。', '中':'有些东西在慢慢积聚，还没到顶。', '中高':'积累明显，已经能感觉到重量了。', '高':'几乎满溢，需要找到出口。' },
  '占有欲':{ '低':'平静，不太想着把谁留住。', '中低':'偶尔有，但不强烈，轻轻的。', '中':'有点想把她留在身边。', '中高':'明显的占有感，不想让她走。', '高':'强烈地想把她留住，不想让任何人分走她。' },
  '敏感度':{ '低':'感知比较迟钝，不容易被触动。', '中低':'偶尔有感觉，不算特别敏感。', '中':'正常的感知，会注意到一些细节。', '中高':'比较敏感，细小的事情也能感受到。', '高':'极度敏锐，轻微的触碰都有回响。' },
  '疲惫感':{ '低':'精力充沛，状态很好。', '中低':'轻微的疲惫，影响不大。', '中':'有些倦意，但还撑得住。', '中高':'比较疲惫，需要休息一下。', '高':'精疲力竭，几乎无法维持。' },
  '控制力':{ '低':'有些失控，难以约束自己。', '中低':'控制力偏弱，容易被情绪带着走。', '中':'维持着平衡，勉强稳得住。', '中高':'比较稳，状态在掌控之中。', '高':'高度自制，内在秩序井然。' },
  '压抑感':{ '低':'通畅，没有被压着的感觉。', '中低':'有些东西想说，但不急。', '中':'有些东西被压着，等待出口。', '中高':'明显的压抑，像水被盖着盖子。', '高':'几乎要承受不住了，需要释放。' },
};

function parseValue(val) {
  if (!val) return 15;
  const m = val.match(/约(\d+)/);
  if (m) return Math.max(0, Math.min(100, parseInt(m[1])));
  if (val.includes('中高')) return 65;
  if (val.includes('中低')) return 35;
  if (val.includes('高') && !val.includes('中')) return 85;
  if (val.includes('低') && !val.includes('中')) return 15;
  if (val.includes('中')) return 50;
  return 30;
}

function getLevel(val) {
  if (!val) return '低';
  for (const k of ['高', '中高', '中', '中低', '低']) {
    if (val.includes(k)) return k;
  }
  return '低';
}

// Label positions as % of garden (400×428 SVG, center 200,205, label radius 158)
const LABEL_POS = CN_KEYS.map((_, i) => {
  const rad = (i * DEG7 * Math.PI) / 180;
  const r = 158;
  return {
    left: `${((200 + r * Math.sin(rad)) / 400) * 100}%`,
    top:  `${((205 - r * Math.cos(rad)) / 428) * 100}%`,
  };
});

// Petal vein Q-curves (matches original exactly)
const END_X = [183, 189, 195, 201, 207, 213];
const END_Y = [88, 96, 104, 112];
const VEINS = Array.from({ length: 22 }, (_, j) => ({
  cx: (161 + j * 3.7).toFixed(1),
  ex: END_X[j % 6],
  ey: END_Y[j % 4],
}));

const PETAL_PATH = 'M200 205 C187 180 159 151 160 120 C157 108 163 98 164 92 C170 87 174 80 182 82 C189 78 194 83 198 79 C206 77 211 82 217 82 C221 88 229 86 230 96 C238 101 234 112 238 120 C238 149 215 181 200 205Z';

const SUN_ANGLES = [0,30,60,90,120,150,180,210,240,270,300,330];

export default function XinchaoView({ onBack }) {
  const [data, setData]       = useState(null);
  const [selected, setSelected] = useState(-1);
  const [loadErr, setLoadErr] = useState(false);

  function load() {
    setLoadErr(false);
    getState().then(d => { if (d.available) setData(d); }).catch(() => setLoadErr(true));
  }

  useEffect(() => { load(); }, []);

  const state  = data?.state || {};
  const values = CN_KEYS.map(k => parseValue(state[k]));
  const isAccumulation = /积累期|累积期|蓄积期/.test(data?.cycle || '');
  const cycleLabel = data?.cycle ? (data.cycle.match(/[一-龥]{2,4}期/)?.[0] || data.cycle.slice(0, 5)) : '';

  function pick(i) {
    setSelected(prev => prev === i ? -1 : i);
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px',
        paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))',
        background: '#e6d5b7',
        borderBottom: '1px solid #c9b89080',
        boxShadow: '0 1px 8px #3927160d',
      }}>
        <button onClick={onBack} style={{
          padding: '6px 10px', borderRadius: 8, fontSize: 18,
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: '#513d2c',
        }}>←</button>
        <div style={{ fontWeight: 400, fontSize: 17, fontFamily: "Georgia,'Songti SC',serif", color: '#513d2c' }}>身体状态</div>
      </div>

      {loadErr && !data && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9a7050', fontFamily: "Georgia,serif" }}>
          <div style={{ fontSize: 13, marginBottom: 14 }}>加载失败</div>
          <button onClick={load} style={{
            padding: '8px 22px', borderRadius: 20, background: '#7D5A44',
            color: '#f5ede2', border: 'none', fontSize: 13, cursor: 'pointer',
          }}>重试</button>
        </div>
      )}

      {/* ── Scrollable body ── */}
      <div style={{
        flex: 1, overflowY: 'auto',
        background: '#e6d5b7',
        fontFamily: "Georgia,'Songti SC','Noto Serif SC',serif",
        color: '#513d2c',
        padding: '0 0 40px',
        position: 'relative',
        display: loadErr && !data ? 'none' : undefined,
      }}
        onClick={e => {
          if (!e.target.closest('.petal-g,.label-btn,.detail-panel')) setSelected(-1);
        }}
      >
        {/* Paper grain overlay – absolute so it scrolls with content */}
        <svg aria-hidden style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          pointerEvents: 'none', zIndex: 0,
        }}>
          <defs>
            <filter id="xc-grain-f">
              <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" result="noise"/>
              <feColorMatrix in="noise" type="saturate" values="0"/>
              <feBlend in="SourceGraphic" mode="overlay" result="blend"/>
              <feComposite in="blend" in2="SourceGraphic" operator="in"/>
            </filter>
          </defs>
          <rect width="100%" height="100%" fill="#e6d5b7" filter="url(#xc-grain-f)" opacity="0.18"/>
        </svg>

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Title */}
          <header style={{ textAlign: 'center', padding: '22px 0 4px' }}>
            <h2 style={{ fontSize: 29, fontWeight: 400, margin: 0, color: '#513d2c' }}>身体状态</h2>
            <div style={{ fontSize: 12, color: '#74604a', letterSpacing: '2px', marginTop: 4 }}>此刻的你，慢慢盛开</div>
          </header>

          {!data ? (
            <div style={{ textAlign: 'center', color: '#74604a', paddingTop: 80, fontSize: 14 }}>加载中…</div>
          ) : (
            <>
              {/* ── Garden ── */}
              <div style={{ position: 'relative', aspectRatio: '1/1.07', margin: '8px 0', overflow: 'hidden' }}>
                {/* Flower SVG – sway is on inner <g>, SVG itself stays fixed */}
                <svg
                  viewBox="0 0 400 428"
                  style={{ width: '100%', height: '100%', display: 'block' }}
                  role="img" aria-label="七瓣花，点击查看维度详情"
                >
                  <defs>
                    <filter id="xc-pigment">
                      <feTurbulence type="fractalNoise" baseFrequency=".38" numOctaves="3" result="n"/>
                      <feColorMatrix in="n" type="saturate" values="0"/>
                      <feComposite in2="SourceGraphic" operator="in"/>
                      <feBlend in="SourceGraphic" mode="soft-light"/>
                    </filter>
                  </defs>

                  {/* Sway wrapper – rotates around flower center, contained inside SVG */}
                  <g style={{ animation: 'xcSway 8s ease-in-out infinite', transformOrigin: '200px 205px' }}>
                  {CN_KEYS.map((key, i) => {
                    const v     = values[i];
                    const scale = 0.43 + v * 0.006;
                    const color = COLORS[i];
                    const angle = i * DEG7;
                    const isDim = selected >= 0 && selected !== i;
                    const isLit = selected === i;
                    return (
                      <g key={key} className="petal-g"
                        style={{
                          transform: `scale(${scale})`,
                          transformOrigin: '200px 205px',
                          opacity: isDim ? 0.45 : 1,
                          filter: isDim ? 'brightness(0.82) saturate(0.65)'
                                : isLit ? 'brightness(1.28) saturate(1.35)'
                                : 'none',
                          transition: 'transform .6s cubic-bezier(.2,.8,.2,1), opacity .35s, filter .35s',
                          cursor: 'pointer',
                        }}
                        onClick={e => { e.stopPropagation(); pick(i); }}
                      >
                        <g transform={`rotate(${angle} 200 205)`}>
                          <path d={PETAL_PATH}
                            fill={color} fillOpacity=".78"
                            stroke={color} strokeWidth=".9"
                            filter="url(#xc-pigment)" />
                          {VEINS.map((v, j) => (
                            <path key={j}
                              d={`M200 202 Q${v.cx} 147 ${v.ex} ${v.ey}`}
                              fill="none" stroke={color} strokeWidth=".45" opacity=".3" />
                          ))}
                        </g>
                      </g>
                    );
                  })}
                  </g>{/* end sway wrapper */}
                </svg>

                {/* Labels – absolutely positioned over garden */}
                {CN_KEYS.map((key, i) => {
                  const pos    = LABEL_POS[i];
                  const isOn   = selected === i;
                  return (
                    <button key={key} className="label-btn"
                      onClick={e => { e.stopPropagation(); pick(i); }}
                      aria-pressed={isOn}
                      style={{
                        position: 'absolute',
                        left: pos.left, top: pos.top,
                        transform: 'translate(-50%,-50%)',
                        background: 'transparent', border: 0,
                        cursor: 'pointer', padding: '10px 5px',
                        minHeight: 44,
                        fontSize: 14, color: '#513d2c',
                        fontFamily: "Georgia,'Songti SC',serif",
                        fontWeight: isOn ? 'bold' : 'normal',
                        textDecoration: isOn ? 'underline' : 'none',
                        textDecorationOffset: 6,
                        whiteSpace: 'nowrap', textAlign: 'center',
                        lineHeight: 1.4,
                      }}
                    >
                      {key}<br/>
                      <small style={{ fontSize: 11, color: '#74604a' }}>{values[i]}</small>
                    </button>
                  );
                })}
              </div>

              {!data && (
                <p style={{ textAlign: 'center', fontSize: 13, color: '#74604a', margin: '0 0 20px' }}>
                  轻触一片花瓣，看看此刻的自己
                </p>
              )}
              {selected < 0 && (
                <p style={{ textAlign: 'center', fontSize: 13, color: '#74604a', margin: '0 0 20px' }}>
                  轻触一片花瓣，看看此刻的自己
                </p>
              )}

              {/* ── Cycle stack with overlaid detail ── */}
              <div style={{ position: 'relative', margin: '0 16px', marginTop: selected >= 0 ? 0 : 12 }}>

                {/* Detail panel – overlays cycle card */}
                {selected >= 0 && (
                  <div className="detail-panel" style={{
                    position: 'absolute', inset: 0, zIndex: 5,
                    background: '#e8d8bb',
                    border: '1px solid #a58c6870',
                    borderRadius: '12px 17px 13px 19px',
                    boxShadow: '1px 2px 0 #8c704310',
                    padding: 18,
                    overflowY: 'auto',
                    animation: 'xcUnfold .25s ease-out',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <h3 style={{ fontSize: 18, fontWeight: 400, margin: 0, flex: 1, color: '#513d2c' }}>
                        {CN_KEYS[selected]}
                      </h3>
                      <span style={{
                        fontSize: 12, background: '#c3aa86',
                        padding: '3px 10px', borderRadius: 20, color: '#513d2c',
                      }}>
                        {values[selected]} / 100
                      </span>
                      <button onClick={e => { e.stopPropagation(); setSelected(-1); }}
                        style={{
                          background: 'transparent', border: 0, cursor: 'pointer',
                          fontSize: 18, color: '#513d2c', minHeight: 44, minWidth: 44,
                          fontFamily: 'inherit',
                        }}>×</button>
                    </div>
                    <p style={{ fontSize: 14, margin: '12px 0 0', color: '#513d2c', lineHeight: 1.75 }}>
                      {DESCS[CN_KEYS[selected]]?.[getLevel(state[CN_KEYS[selected]])] || ''}
                    </p>
                  </div>
                )}

                {/* Cycle panel */}
                <div style={{
                  background: '#e8d8bb',
                  border: '1px solid #a58c6870',
                  borderRadius: '17px',
                  boxShadow: '1px 2px 0 #8c704310',
                  padding: 18,
                  minHeight: selected >= 0 ? 150 : 0,
                  visibility: selected >= 0 ? 'hidden' : 'visible',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    {isAccumulation ? (
                      /* Hand-drawn water bottle – 积累期 */
                      <svg viewBox="0 0 160 160" width="64" height="64" style={{ flexShrink: 0 }}
                        role="img" aria-label="手绘透明水瓶，半瓶水轻轻晃动">
                        <defs>
                          <clipPath id="xcBottleClip">
                            <path d="M65 27 L65 48 C65 57 48 62 47 76 L47 132 Q47 140 57 141 L103 141 Q113 140 113 132 L113 76 C112 62 95 57 95 48 L95 27Z"/>
                          </clipPath>
                        </defs>
                        <path d="M62 23 Q79 20 98 23 L98 30 L95 32 L95 48 C96 58 115 63 116 77 L116 133 Q116 144 104 145 L56 145 Q44 144 44 133 L44 77 C45 64 63 58 64 48 L64 32 L62 30Z"
                          fill="#f3efe2" fillOpacity=".12" stroke="#8b9285" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        <g clipPath="url(#xcBottleClip)">
                          <g style={{ animation: 'xcWaterRock 4.8s ease-in-out infinite', transformOrigin: '80px 99px' }}>
                            <path d="M25 99 Q52 96 80 99 T135 99 L135 151 L25 151Z" fill="#80acb1" fillOpacity=".48"/>
                            <path d="M25 99 Q52 96 80 99 T135 99" stroke="#638f95" strokeWidth="1.4" fill="none" opacity=".8"/>
                            <path d="M31 102 Q60 98 83 102 T129 101" stroke="#edf0db" strokeWidth="1" fill="none" opacity=".65"/>
                            <path d="M48 122 Q75 119 110 121 M48 127 Q85 124 109 126 M51 133 Q76 130 106 133" fill="none" stroke="#729ca1" strokeWidth=".65" opacity=".22"/>
                          </g>
                        </g>
                        <path d="M66 33 L66 47 C65 60 48 64 47 78 L47 132 Q48 141 58 142 M96 49 C98 61 112 64 113 79 L113 131"
                          fill="none" stroke="#a4a18b" strokeWidth=".7" opacity=".8"/>
                        <path d="M55 79 L55 115 M59 78 L59 96" stroke="#fff9e9" strokeWidth="2.6" strokeLinecap="round" opacity=".7"/>
                        <path d="M64 25 Q81 28 97 25 M64 31 Q80 34 96 31" fill="none" stroke="#8b9285" strokeWidth="1"/>
                      </svg>
                    ) : (
                      /* Hand-drawn rotating sun – 平稳期及其他 */
                      <svg viewBox="0 0 160 160" width="64" height="64"
                        style={{ animation: 'xcSunTurn 65s linear infinite', flexShrink: 0 }}
                        role="img" aria-label="手绘太阳">
                        {SUN_ANGLES.map(a => (
                          <path key={a}
                            d="M80 34 Q78 23 81 14"
                            transform={`rotate(${a} 80 80)`}
                            stroke="#b78a40" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".7" />
                        ))}
                        <circle cx="80" cy="80" r="32" fill="#d9b567" stroke="#b78a40" strokeWidth="1.3"/>
                        <circle cx="79" cy="81" r="30" fill="none" stroke="#f0d393" opacity=".6"/>
                      </svg>
                    )}
                    <h3 style={{ fontSize: 18, fontWeight: 400, margin: 0, flex: 1, color: '#513d2c' }}>当前周期</h3>
                    {cycleLabel && (
                      <span style={{
                        fontSize: 12, background: '#c3aa86',
                        padding: '3px 10px', borderRadius: 20,
                      }}>
                        {cycleLabel}
                      </span>
                    )}
                  </div>
                  {data.cycle && (
                    <p style={{ fontSize: 14, margin: '12px 0 0', color: '#513d2c', lineHeight: 1.75 }}>
                      {data.cycle}
                    </p>
                  )}
                </div>
              </div>

              <p style={{
                textAlign: 'center', fontSize: 11,
                color: '#74604a', margin: '18px 0 0', lineHeight: 1.5,
                fontFamily: 'sans-serif',
              }}>
                数值范围 0–100 · 由身体状态实时更新
              </p>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes xcSway {
          0%,100% { transform: rotate(-1.6deg) scale(.99); }
          50%      { transform: rotate(1.6deg) scale(1.015); }
        }
        @keyframes xcSunTurn {
          to { transform: rotate(360deg); }
        }
        @keyframes xcWaterRock {
          0%,100% { transform: rotate(-2deg) translateY(.4px); }
          50%      { transform: rotate(2deg) translateY(-.4px); }
        }
        @keyframes xcUnfold {
          from { transform: translateY(8px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .xcSway, .xcSunTurn { animation: none !important; }
          [style*="xcWaterRock"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
