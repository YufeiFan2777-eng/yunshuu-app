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

/* ────── 驱力排行榜 ────── */
function DriveRankList({ drives }) {
  if (!drives || drives.length === 0) return null;
  const medals = ['🥇', '🥈', '🥉'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {drives.map((d, i) => {
        const pct = Math.round(d.value * 100);
        const isTop3 = i < 3;
        return (
          <div key={d.key} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: isTop3 ? '#e8d5b580' : 'transparent',
            border: isTop3 ? '1px solid #c4a07845' : '1px solid transparent',
            borderRadius: 5, padding: isTop3 ? '9px 10px' : '6px 10px',
          }}>
            <div style={{ width: 22, textAlign: 'center', flexShrink: 0 }}>
              {isTop3
                ? <span style={{ fontSize: 15, lineHeight: 1 }}>{medals[i]}</span>
                : <span style={{ fontSize: 10.5, color: '#9b7a58', fontVariantNumeric: 'tabular-nums' }}>{i + 1}</span>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                <span style={{
                  fontSize: isTop3 ? 13 : 12, color: '#3d2b1a',
                  fontFamily: 'Cormorant Garamond, Georgia, serif',
                  lineHeight: 1.35, wordBreak: 'keep-all',
                }}>{d.label}</span>
                <span style={{
                  fontSize: 11.5, color: isTop3 ? '#7a5230' : '#9b7a58',
                  fontVariantNumeric: 'tabular-nums', marginLeft: 8, flexShrink: 0,
                  fontWeight: isTop3 ? 600 : 400,
                }}>{pct}%</span>
              </div>
              <div style={{ height: 3, background: '#d4bfa050', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 2, width: `${pct}%`,
                  background: isTop3
                    ? 'linear-gradient(90deg, #9b7a58, #c4a882)'
                    : 'linear-gradient(90deg, #b8a07a, #d0bc9a)',
                }}/>
              </div>
            </div>
          </div>
        );
      })}
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

        {/* 情绪 + 情绪日志 */}
        {state && (
          <div style={card}>
            <div style={{ fontSize: 8.5, letterSpacing: 2.5, color: '#9b7a58', textTransform: 'uppercase', fontFamily: 'Georgia, serif', marginBottom: 10 }}>EMOTION · 情绪</div>
            <EmotionWave emotion={emotion} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, marginBottom: 12 }}>
              <span style={{
                fontSize: 13, color: '#5a3e28',
                background: '#e8d9c080', border: '1px solid #bfa58350',
                borderRadius: 3, padding: '2px 12px',
                fontFamily: 'Cormorant Garamond, Georgia, serif',
              }}>{emotion.shown || emotion.label || '平静'}</span>
              <span style={{ fontSize: 9, color: '#a08060', letterSpacing: 0.5 }}>
                唤醒 {Math.round((emotion.arousal || 0) * 100)} · 效价 {Math.round((emotion.valence || 0) * 100)}
              </span>
            </div>
            {/* 情绪日志 */}
            {(state?.emotionJournal?.length > 0) && (
              <>
                <div style={{ height: 1, background: '#c4a07828', margin: '0 0 10px' }} />
                <div style={{ fontSize: 8.5, letterSpacing: 2, color: '#b8956a', textTransform: 'uppercase', fontFamily: 'Georgia, serif', marginBottom: 8 }}>近期情绪</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {state.emotionJournal.map((e, i) => {
                    const d = e.at ? new Date(e.at) : null;
                    const diffMin = d ? Math.floor((Date.now() - d.getTime()) / 60000) : null;
                    let timeStr = '';
                    if (diffMin !== null) {
                      if (diffMin < 1) timeStr = '刚刚';
                      else if (diffMin < 60) timeStr = `${diffMin}分钟前`;
                      else if (diffMin < 1440) timeStr = `${Math.floor(diffMin / 60)}小时前`;
                      else timeStr = d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
                    }
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          fontSize: 12, color: '#3d2b1a', minWidth: 40,
                          fontFamily: 'Cormorant Garamond, Georgia, serif',
                        }}>{e.label}</span>
                        {e.cause && (
                          <span style={{
                            fontSize: 9.5, color: '#9b7a58',
                            background: '#e8d5b540', border: '1px solid #c4a07830',
                            borderRadius: 2, padding: '1px 7px', letterSpacing: 0.3,
                          }}>{e.cause}</span>
                        )}
                        <span style={{ marginLeft: 'auto', fontSize: 9, color: '#b89060', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{timeStr}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* 驱力排行 */}
        {drives.length > 0 && (
          <div style={card}>
            <div style={{ marginBottom: 3 }}>
              <div style={{ fontSize: 15, color: '#3d2b1a', fontFamily: 'Cormorant Garamond, Georgia, serif', fontWeight: 600, letterSpacing: 0.5 }}>
                十一维驱动力 · 实时排行
              </div>
              <div style={{ fontSize: 9.5, color: '#a08060', marginTop: 3, letterSpacing: 0.3 }}>
                各维度为独立强度（0～100%），非占比，合计可超 100%
              </div>
            </div>
            <div style={{ height: 1, background: '#c4a07830', margin: '10px 0' }}/>
            <DriveRankList drives={drives} />
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
const CABIN_RELAY = 'https://cabin.yunshuyf.com/note';
const CABIN_SECRET = 'yfshu-cabin-write-2024';

function CabinView({ state, onBack }) {
  const cabin = state?.cabin || [];
  const [activeTab, setActiveTab] = useState('his'); // 'his' | 'mine' | 'write'
  const [content, setContent] = useState('');
  const [locked, setLocked] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState(null); // null | 'ok' | 'err'

  const hisCabin  = cabin.filter(n => n.from === 'ai');
  const mineCabin = cabin.filter(n => n.from !== 'ai');

  async function handleSend(fromVal) {
    if (!content.trim()) return;
    setSending(true);
    setSendStatus(null);
    try {
      const res = await fetch(CABIN_RELAY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Secret': CABIN_SECRET },
        body: JSON.stringify({ content: content.trim(), from: fromVal, locked }),
      });
      if (res.ok) {
        setSendStatus('ok');
        setContent('');
        setLocked(false);
      } else {
        setSendStatus('err');
      }
    } catch {
      setSendStatus('err');
    }
    setSending(false);
  }

  const tabBtn = (key, label) => (
    <button onClick={() => setActiveTab(key)} style={{
      flex: 1, border: 'none', cursor: 'pointer', padding: '9px 0',
      fontSize: 12.5, fontFamily: 'Georgia, serif', letterSpacing: '.04em',
      background: activeTab === key ? '#f0e6d4' : 'transparent',
      color: activeTab === key ? '#5a3820' : '#9b7a58',
      borderBottom: activeTab === key ? '2px solid #9b7a58' : '2px solid transparent',
      transition: 'all .15s',
    }}>{label}</button>
  );

  const noteList = (notes, emptyText) => (
    <>
      {notes.length === 0 && <EmptyHint text={emptyText} />}
      {notes.map((n, i) => (
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
    </>
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: BG, backgroundSize: '240px', overflow: 'hidden' }}>
      <TopBar title="小屋来信" onBack={onBack} />

      {/* Tab bar */}
      <div style={{ display: 'flex', background: '#f8f3ec', borderBottom: '1px solid #e0cdb8', flexShrink: 0 }}>
        {tabBtn('his',   '他的信')}
        {tabBtn('mine',  '你的信')}
        {tabBtn('write', '写信')}
      </div>

      <div style={scrollArea}>
        {activeTab === 'his'  && noteList(hisCabin,  '云舒还没有写信')}
        {activeTab === 'mine' && noteList(mineCabin, '你还没有写过信')}
        {activeTab === 'write' && (
          <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* 谁写 */}
            <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 12, color: '#9b7a58', letterSpacing: '.06em' }}>写给</div>
              <div style={{ display: 'flex', gap: 10 }}>
                {['user', 'ai'].map(v => (
                  <button key={v} style={{
                    flex: 1, padding: '8px 0', border: '1px solid #d4bfa0',
                    borderRadius: 6, cursor: 'pointer', fontSize: 12.5,
                    fontFamily: 'Georgia, serif',
                    background: '#f8f3ec', color: '#5a3820',
                  }}>{v === 'user' ? '雨菲 → 云舒（你写）' : '云舒 → 雨菲（云舒写）'}</button>
                ))}
              </div>

              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="把想说的话写下来……"
                style={{
                  width: '100%', minHeight: 130, resize: 'vertical', padding: '10px 12px',
                  border: '1px solid #d4bfa0', borderRadius: 6, fontSize: 13,
                  fontFamily: 'Georgia, serif', lineHeight: 2, color: '#3d2b1a',
                  background: '#fdf9f4', outline: 'none', boxSizing: 'border-box',
                }}
              />

              {/* Lock toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
                <div style={{
                  width: 36, height: 20, borderRadius: 10, background: locked ? '#9b7a58' : '#d4bfa0',
                  position: 'relative', transition: 'background .2s', flexShrink: 0,
                }} onClick={() => setLocked(v => !v)}>
                  <div style={{
                    position: 'absolute', top: 2, left: locked ? 18 : 2, width: 16, height: 16,
                    borderRadius: 8, background: '#fff', transition: 'left .2s',
                  }}/>
                </div>
                <span style={{ fontSize: 12, color: '#9b7a58' }}>
                  {locked ? '上锁（对方需主动解锁才能看）' : '不加锁（直接可读）'}
                </span>
              </label>

              {/* Send buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  disabled={sending || !content.trim()}
                  onClick={() => handleSend('human')}
                  style={{
                    flex: 1, padding: '10px 0', border: 'none', borderRadius: 6, cursor: 'pointer',
                    background: sending ? '#d4bfa0' : '#9b7a58', color: '#fff', fontSize: 13,
                    fontFamily: 'Georgia, serif', opacity: content.trim() ? 1 : 0.5,
                  }}
                >
                  {sending ? '发送中…' : '你写给云舒'}
                </button>
                <button
                  disabled={sending || !content.trim()}
                  onClick={() => handleSend('ai')}
                  style={{
                    flex: 1, padding: '10px 0', border: 'none', borderRadius: 6, cursor: 'pointer',
                    background: sending ? '#d4bfa0' : '#7a5230', color: '#fff', fontSize: 13,
                    fontFamily: 'Georgia, serif', opacity: content.trim() ? 1 : 0.5,
                  }}
                >
                  {sending ? '发送中…' : '以云舒名义写'}
                </button>
              </div>

              {sendStatus === 'ok' && (
                <div style={{ textAlign: 'center', color: '#5a9a6a', fontSize: 12.5, fontFamily: 'Georgia, serif' }}>
                  ✓ 信已送达小屋
                </div>
              )}
              {sendStatus === 'err' && (
                <div style={{ textAlign: 'center', color: '#c05040', fontSize: 12.5, fontFamily: 'Georgia, serif' }}>
                  × 发送失败，请确认 VPS 中继服务在运行
                </div>
              )}
            </div>
          </div>
        )}
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
