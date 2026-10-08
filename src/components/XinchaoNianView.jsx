import React, { useState, useEffect } from 'react';
import paperTex from '/paper-tex.jpg';

const CONSCIOUSNESS_MAP = {
  awake:    { label: '清醒', color: '#5a9a6a' },
  drowsy:   { label: '困倦', color: '#a8843a' },
  sleeping: { label: '熟睡中', color: '#7a85a0' },
  dreaming: { label: '梦中', color: '#8a7aaa' },
};

function DriveBar({ label, value }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 12.5, color: '#513b29', lineHeight: 1.5, flex: 1, paddingRight: 8 }}>{label}</span>
        <span style={{ fontSize: 12, color: '#9b7a58', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
          {Math.round(value * 100)}
        </span>
      </div>
      <div style={{ height: 4, background: '#d4bfa080', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 2,
          width: `${value * 100}%`,
          background: 'linear-gradient(90deg, #9b5d49, #c48a60)',
          transition: 'width 1s ease',
        }} />
      </div>
    </div>
  );
}

function EmotionGrid({ valence = 0.5, arousal = 0.5 }) {
  const cx = 50 + (valence - 0.5) * 72;
  const cy = 50 - (arousal - 0.5) * 72;
  return (
    <svg viewBox="0 0 100 100" width={88} height={88} style={{ flexShrink: 0 }}>
      <circle cx="50" cy="50" r="42" stroke="#c4a882" strokeWidth="0.7" fill="none" strokeDasharray="3,4" />
      <line x1="50" y1="8" x2="50" y2="92" stroke="#c4a882" strokeWidth="0.5" strokeDasharray="2,3" />
      <line x1="8" y1="50" x2="92" y2="50" stroke="#c4a882" strokeWidth="0.5" strokeDasharray="2,3" />
      <text x="50" y="6" textAnchor="middle" fill="#b89060" fontSize="7" fontFamily="Georgia">高唤醒</text>
      <text x="50" y="97" textAnchor="middle" fill="#b89060" fontSize="7" fontFamily="Georgia">低唤醒</text>
      <text x="4" y="52" fill="#b89060" fontSize="7" fontFamily="Georgia">负</text>
      <text x="89" y="52" fill="#b89060" fontSize="7" fontFamily="Georgia">正</text>
      <circle cx={cx} cy={cy} r="7" fill="#9b5d49" opacity="0.22" />
      <circle cx={cx} cy={cy} r="4" fill="#9b5d49" opacity="0.85" />
    </svg>
  );
}

export default function XinchaoNianView({ onBack }) {
  const [state, setState] = useState(null);
  const [loadError, setLoadError] = useState(false);

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

  const cInfo = CONSCIOUSNESS_MAP[state?.consciousness] || { label: state?.consciousness || '—', color: '#999' };
  const emotion = state?.emotion || {};
  const drives = (state?.topDrives || []).slice(0, 4);
  const updatedAt = state?.updatedAt;

  const timeStr = updatedAt
    ? new Date(updatedAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      background: `#e6d5b7 url('${paperTex}')`,
      backgroundSize: '240px',
      overflow: 'hidden',
    }}>
      {/* 返回栏 */}
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
        }}>心潮</span>
        {timeStr && (
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#a08060', fontVariantNumeric: 'tabular-nums' }}>
            {timeStr} 更新
          </span>
        )}
      </div>

      {/* 内容 */}
      <div style={{
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        padding: '14px 14px 28px',
        display: 'flex', flexDirection: 'column', gap: 13,
        scrollbarWidth: 'thin', scrollbarColor: '#b89970 transparent',
      }}>

        {loadError && !state && (
          <div style={{
            textAlign: 'center', color: '#a08060', padding: '32px 16px',
            fontFamily: 'Georgia, serif', fontSize: 13, lineHeight: 2,
          }}>
            暂无数据<br />
            <span style={{ fontSize: 11, opacity: 0.7 }}>等待心潮同步…</span>
          </div>
        )}

        {state && <>
          {/* 意识 + 情绪坐标 */}
          <div style={card}>
            <div style={tab}>意识 · 情绪</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingTop: 4 }}>
              <EmotionGrid valence={emotion.valence} arousal={emotion.arousal} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: cInfo.color,
                    boxShadow: `0 0 5px ${cInfo.color}88`,
                    flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 15, color: '#3d2b1a', fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
                    {cInfo.label}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: 22, color: '#3d2b1a', fontFamily: 'Cormorant Garamond, Georgia, serif', lineHeight: 1.2 }}>
                    {emotion.shown || emotion.label || '—'}
                  </div>
                  <div style={{ fontSize: 11, color: '#9b7a58', marginTop: 3 }}>
                    愉悦 {emotion.valence != null ? Math.round(emotion.valence * 100) : '—'}
                    &ensp;·&ensp;
                    唤醒 {emotion.arousal != null ? Math.round(emotion.arousal * 100) : '—'}
                  </div>
                </div>
                {emotion.trend?.labels?.length > 0 && (
                  <div style={{ fontSize: 11, color: '#9b7a58', lineHeight: 1.8 }}>
                    今日情绪路径<br />
                    <span style={{ color: '#7a5a3a' }}>{emotion.trend.labels.join(' → ')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 驱力 */}
          {drives.length > 0 && (
            <div style={card}>
              <div style={tab}>当前驱力</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 4 }}>
                {drives.map(d => (
                  <DriveBar key={d.key} label={d.label} value={d.value} />
                ))}
              </div>
            </div>
          )}

          {/* 此刻 */}
          {state.thoughts?.flash?.length > 0 && (
            <div style={card}>
              <div style={tab}>此刻</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 4 }}>
                {state.thoughts.flash.map((f, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                      <span style={{
                        fontSize: 10, color: '#9b7a58',
                        background: '#d4bfa040', border: '1px solid #bfa58340',
                        borderRadius: 2, padding: '1px 7px', letterSpacing: 1,
                      }}>{f.label || f.key}</span>
                      <span style={{ fontSize: 10, color: '#b89060', marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>
                        {f.age > 0 ? `${f.age}分钟前` : '片刻前'}
                      </span>
                    </div>
                    {f.text && (
                      <div style={{ fontSize: 12.5, color: '#513b29', lineHeight: 1.8, marginBottom: 6 }}>
                        {f.text}
                      </div>
                    )}
                    <div style={{ height: 2, background: '#d4bfa050', borderRadius: 1, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 1,
                        width: `${Math.min((f.intensity || 0) * 100, 100)}%`,
                        background: 'linear-gradient(90deg, #9b7a58, #c4a882)',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 记互动 */}
          {state.interactions?.length > 0 && (
            <div style={card}>
              <div style={tab}>记互动</div>
              <div style={{ paddingTop: 6 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {state.interactions.map((ix, i) => {
                    const d = ix.at ? new Date(ix.at) : null;
                    const now = Date.now();
                    const diffMs = d ? now - d.getTime() : 0;
                    const diffMin = Math.floor(diffMs / 60000);
                    let timeStr;
                    if (diffMin < 1) timeStr = '刚刚';
                    else if (diffMin < 60) timeStr = `${diffMin}分钟前`;
                    else if (diffMin < 1440) timeStr = `${Math.floor(diffMin / 60)}小时前`;
                    else timeStr = d ? d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }) : '—';
                    return (
                      <div key={i} style={{
                        fontSize: 11, color: '#7a5a3a',
                        background: '#e8d9c040', border: '1px solid #bfa58330',
                        borderRadius: 3, padding: '3px 10px',
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        {ix.type && <span style={{ color: '#9b7a58', marginRight: 5 }}>{ix.type}</span>}
                        {timeStr}
                      </div>
                    );
                  })}
                </div>
                {state.interactions[0]?.at && (
                  <div style={{ fontSize: 10, color: '#b89060', marginTop: 10 }}>
                    共 {state.interactions.length} 次近期互动
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 疲劳 */}
          {state.fatigue != null && (
            <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 14, padding: '13px 17px' }}>
              <span style={{ fontSize: 12, color: '#9b7a58', letterSpacing: 1 }}>疲劳值</span>
              <div style={{ flex: 1, height: 4, background: '#d4bfa080', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 2,
                  width: `${state.fatigue * 100}%`,
                  background: 'linear-gradient(90deg, #7a85a0, #a09080)',
                  transition: 'width 1s ease',
                }} />
              </div>
              <span style={{ fontSize: 13, color: '#7a5a3a', fontVariantNumeric: 'tabular-nums', width: 28, textAlign: 'right' }}>
                {Math.round(state.fatigue * 100)}
              </span>
            </div>
          )}
        </>}
      </div>
    </div>
  );
}

const card = {
  background: '#f5e9d5d9',
  border: '1px solid #bfa58380',
  boxShadow: '2px 3px 0 #d8c3a17a, 0 4px 10px #71533210',
  borderRadius: '3px 6px 2px 5px',
  padding: '17px',
  position: 'relative',
};
const tab = {
  display: 'inline-block',
  background: '#d8b7a28a',
  padding: '2px 13px',
  margin: '-17px 0 10px -8px',
  transform: 'rotate(-1deg)',
  fontSize: 13, letterSpacing: 2,
  fontFamily: 'Georgia, serif',
  position: 'relative', zIndex: 1,
};
