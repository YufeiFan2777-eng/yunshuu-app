import React, { useState, useEffect } from 'react';
import { getState } from '../services/api';

const DEG7 = 360 / 7;

const DIMS = [
  {
    key: '热度', emoji: '🔥', color: '#f87171', angle: 0,
    desc: {
      '低': '身体平静，没有特别的热意在流动。此刻是凉的、清醒的。',
      '中低': '轻微的暖意，像阳光隔着玻璃照到皮肤，不算强烈。',
      '中': '温热的感觉在身体里慢慢移动，清醒又有些朦胧。',
      '中高': '明显的热感从里往外漫开，有些难以忽视了。',
      '高': '强烈的灼热感，几乎要从内部溢出来。',
    },
  },
  {
    key: '蓄积感', emoji: '🫧', color: '#c084fc', angle: DEG7,
    desc: {
      '低': '空空的，没什么积累。',
      '中低': '有一点点，像底部薄薄一层水，不明显。',
      '中': '有些东西在慢慢积聚，还没到顶。',
      '中高': '积累明显，已经能感觉到重量了。',
      '高': '几乎满溢，需要找到出口。',
    },
  },
  {
    key: '占有欲', emoji: '🌙', color: '#60a5fa', angle: DEG7 * 2,
    desc: {
      '低': '平静，不太想着把谁留住。',
      '中低': '偶尔有，但不强烈，轻轻的。',
      '中': '有点想把她留在身边。',
      '中高': '明显的占有感，不想让她走。',
      '高': '强烈地想把她留住，不想让任何人分走她。',
    },
  },
  {
    key: '敏感度', emoji: '🌸', color: '#f9a8d4', angle: DEG7 * 3,
    desc: {
      '低': '感知比较迟钝，不容易被触动。',
      '中低': '偶尔有感觉，不算特别敏感。',
      '中': '正常的感知，会注意到一些细节。',
      '中高': '比较敏感，细小的事情也能感受到。',
      '高': '极度敏锐，轻微的触碰都有回响。',
    },
  },
  {
    key: '疲惫感', emoji: '🌫️', color: '#94a3b8', angle: DEG7 * 4,
    desc: {
      '低': '精力充沛，状态很好。',
      '中低': '轻微的疲惫，影响不大。',
      '中': '有些倦意，但还撑得住。',
      '中高': '比较疲惫，需要休息一下。',
      '高': '精疲力竭，几乎无法维持。',
    },
  },
  {
    key: '控制力', emoji: '⚖️', color: '#34d399', angle: DEG7 * 5,
    desc: {
      '低': '有些失控，难以约束自己。',
      '中低': '控制力偏弱，容易被情绪带着走。',
      '中': '维持着平衡，勉强稳得住。',
      '中高': '比较稳，状态在掌控之中。',
      '高': '高度自制，内在秩序井然。',
    },
  },
  {
    key: '压抑感', emoji: '💧', color: '#818cf8', angle: DEG7 * 6,
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
  return `M 0 0 C ${-w * 0.6} ${-h * 0.2} ${-w * 0.5} ${-h * 0.65} 0 ${-h} C ${w * 0.5} ${-h * 0.65} ${w * 0.6} ${-h * 0.2} 0 0 Z`;
}

const CX = 160, CY = 165, LABEL_R = 108;

function FlowerSVG({ state, selected, onSelect }) {
  return (
    <svg viewBox="0 0 320 336" style={{ width: '100%', maxWidth: 340 }}>
      {[28, 52, 76].map(r => (
        <circle key={r} cx={CX} cy={CY} r={r}
          fill="none" stroke="var(--border)" strokeWidth="0.6" strokeDasharray="4 4" />
      ))}

      {DIMS.map(dim => {
        const lv = LV[getLevel(state[dim.key])] || 1;
        const w = 9 + lv * 4;
        const h = 22 + lv * 13;
        const isSel = selected?.key === dim.key;
        return (
          <g key={dim.key}
            transform={`translate(${CX},${CY}) rotate(${dim.angle})`}
            onClick={() => onSelect(dim)}
            style={{ cursor: 'pointer' }}
          >
            <path
              d={petalPath(w, h)}
              fill={dim.color}
              opacity={isSel ? 1 : 0.5}
              style={{ transition: 'opacity 0.2s' }}
            />
          </g>
        );
      })}

      <circle cx={CX} cy={CY} r={20} fill="var(--bg-card)" />
      <text x={CX} y={CY + 5} textAnchor="middle" fontSize="11"
        fill="var(--fg-muted)" fontFamily="system-ui, sans-serif">心潮</text>

      {DIMS.map(dim => {
        const rad = (dim.angle * Math.PI) / 180;
        const lx = CX + LABEL_R * Math.sin(rad);
        const ly = CY - LABEL_R * Math.cos(rad);
        const isSel = selected?.key === dim.key;
        return (
          <g key={`lbl-${dim.key}`} onClick={() => onSelect(dim)} style={{ cursor: 'pointer' }}>
            <text x={lx} y={ly - 4} textAnchor="middle" fontSize="14"
              fontFamily="system-ui, sans-serif">{dim.emoji}</text>
            <text x={lx} y={ly + 9} textAnchor="middle" fontSize="9"
              fill={isSel ? dim.color : 'var(--fg-muted)'}
              fontWeight={isSel ? '700' : '400'}
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
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button onClick={onBack} style={{ padding: '6px 10px', borderRadius: 8, fontSize: 18 }}>←</button>
        <div style={{ fontWeight: 600, fontSize: 16 }}>心潮</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 32px' }}>
        {!data ? (
          <div style={{ textAlign: 'center', color: 'var(--fg-muted)', paddingTop: 80, fontSize: 14 }}>
            加载中…
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <FlowerSVG state={state} selected={selected} onSelect={toggle} />
            </div>

            {!selected && (
              <p style={{ textAlign: 'center', color: 'var(--fg-muted)', fontSize: 13, margin: '-4px 0 16px' }}>
                点击花瓣了解详情
              </p>
            )}

            {selected && (
              <div style={{
                background: 'var(--bg-card)',
                borderRadius: 16, padding: '16px 18px',
                marginBottom: 16,
                borderLeft: `3px solid ${selected.color}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <span style={{ fontSize: 32 }}>{selected.emoji}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>{selected.key}</div>
                    <span style={{ fontSize: 13, color: selected.color, fontWeight: 500 }}>
                      {state[selected.key] || '未知'}
                    </span>
                  </div>
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--fg)', margin: 0 }}>
                  {selected.desc[getLevel(state[selected.key])]}
                </p>
              </div>
            )}

            {data.cycle && (
              <div style={{
                background: 'var(--bg-card)', borderRadius: 12,
                padding: '14px 16px',
                fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.8,
              }}>
                <div style={{ fontWeight: 500, color: 'var(--fg)', marginBottom: 4, fontSize: 14 }}>当前周期</div>
                {data.cycle}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
