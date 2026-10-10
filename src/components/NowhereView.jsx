import React, { useState, useEffect, useRef } from 'react';
import paperTex from '/paper-tex.jpg';

const API_BASE = (import.meta.env.VITE_API_URL || '/api') + '/nowhere';
const AISAY_BASE = import.meta.env.VITE_API_URL || '/api';

const DIRECTIONS = [
  { label: '北', value: 'N' },
  { label: '东北', value: 'NE' },
  { label: '东', value: 'E' },
  { label: '东南', value: 'SE' },
  { label: '南', value: 'S' },
  { label: '西南', value: 'SW' },
  { label: '西', value: 'W' },
  { label: '西北', value: 'NW' },
];

function WorldDot({ lat, lon }) {
  if (lat == null || lon == null || isNaN(lat) || isNaN(lon)) return null;
  const x = ((lon + 180) / 360) * 100;
  const y = ((90 - lat) / 180) * 50;
  return (
    <svg viewBox="0 0 100 50" style={{ width: '100%', height: 'auto', display: 'block' }}>
      <rect width="100" height="50" fill="#b8ccd8" rx="4" opacity=".5" />
      <rect width="100" height="50" fill="#c8b99a" rx="4" opacity=".3" />
      {/* North America */}
      <ellipse cx="15" cy="20" rx="10" ry="8" fill="#a08060" opacity=".75" />
      {/* South America */}
      <ellipse cx="22" cy="36" rx="5" ry="7" fill="#a08060" opacity=".75" />
      {/* Europe */}
      <ellipse cx="49" cy="19" rx="4" ry="4" fill="#a08060" opacity=".75" />
      {/* Africa */}
      <ellipse cx="51" cy="33" rx="6" ry="9" fill="#a08060" opacity=".75" />
      {/* Asia */}
      <ellipse cx="68" cy="20" rx="17" ry="9" fill="#a08060" opacity=".75" />
      {/* Australia */}
      <ellipse cx="79" cy="40" rx="5" ry="4" fill="#a08060" opacity=".75" />
      {/* Antarctica hint */}
      <rect x="0" y="47" width="100" height="3" fill="#a08060" opacity=".3" />
      {/* position dot */}
      <circle cx={x} cy={y} r="2.2" fill="#a44936" />
      <circle cx={x} cy={y} r="4" fill="none" stroke="#a44936" strokeWidth=".8" opacity=".7" />
    </svg>
  );
}

function JourneyCard({ text, pos, weather }) {
  if (!text) return null;
  return (
    <div className="nw-card">
      <div className="nw-card-text">{text}</div>
      {pos && (
        <div className="nw-card-meta">
          {pos.lat?.toFixed(3)}°N, {pos.lon?.toFixed(3)}°E
          {weather && ` · ${weather.temp_c?.toFixed(0)}°C · ${weather.text || ''}`}
        </div>
      )}
    </div>
  );
}

export default function NowhereView({ onBack }) {
  const [state, setNowhere] = useState(null);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState('');
  const [msgInput, setMsgInput] = useState('');
  const [destination, setDestination] = useState('');
  const [log, setLog] = useState([]);
  const [offline, setOffline] = useState(false);
  const [forumActivity, setForumActivity] = useState(null);

  const logRef = useRef(null);

  useEffect(() => {
    loadState();
  }, []);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log]);

  async function loadState() {
    try {
      const r = await fetch(`${API_BASE}/state`);
      const d = await r.json();
      if (d.error) { setOffline(true); return; }
      setNowhere(d);
      setOffline(false);
    } catch {
      setOffline(true);
    }
  }

  async function doAction(path, body = {}) {
    setLoading(true);
    setAction(path);
    try {
      const r = await fetch(`${API_BASE}/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (d.error) {
        setLog(prev => [...prev, { type: 'error', text: d.error }]);
      } else {
        setLog(prev => [...prev, { type: 'result', text: d.text }]);
        await loadState();
      }
    } catch (e) {
      setLog(prev => [...prev, { type: 'error', text: '连接失败' }]);
    } finally {
      setLoading(false);
      setAction('');
    }
  }

  async function sendMessage() {
    const content = msgInput.trim();
    if (!content) return;
    setMsgInput('');
    setLoading(true);
    try {
      await fetch(`${API_BASE}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      setLog(prev => [...prev, { type: 'msg', text: `留言: ${content}` }]);
    } catch {
      setLog(prev => [...prev, { type: 'error', text: '留言失败' }]);
    } finally {
      setLoading(false);
    }
  }

  async function browseForum() {
    setLoading(true);
    setAction('forum');
    try {
      const r = await fetch(`${AISAY_BASE}/aisay/forum`, { method: 'POST' });
      const d = await r.json();
      if (d.error) {
        setLog(prev => [...prev, { type: 'error', text: d.error }]);
      } else {
        setLog(prev => [...prev, { type: 'result', text: d.text }]);
        setForumActivity(d);
      }
    } catch {
      setLog(prev => [...prev, { type: 'error', text: '论坛暂时关着门' }]);
    } finally {
      setLoading(false);
      setAction('');
    }
  }

  // pos is [lat, lon] array from the API
  const posArr = state?.pos;
  const pos = posArr ? { lat: posArr[0], lon: posArr[1] } : null;
  const weather = state?.env?.weather;
  const lastText = state?.last_text;

  return (
    <div className="nw-wrap">
      <div className="nw-page">
        {/* header */}
        <div className="nw-header">
          {onBack && (
            <button className="nw-back" onClick={onBack}>‹</button>
          )}
          <div className="nw-title-block">
            <h2 className="nw-title">乌有乡</h2>
            <div className="nw-ornament">✦ 云舒在地球上走一走 ✦</div>
          </div>
        </div>

        {offline ? (
          <div className="nw-offline">
            <div className="nw-offline-icon">◎</div>
            <div className="nw-offline-text">乌有乡暂时沉睡中</div>
            <div className="nw-offline-sub">需要在服务器上启动 nowhere 服务</div>
            <button className="nw-btn" onClick={loadState}>重试</button>
          </div>
        ) : (
          <>
            {/* map */}
            <div className="nw-map">
              <WorldDot lat={pos?.lat} lon={pos?.lon} />
              {pos ? (
                <div className="nw-pos">{pos.lat?.toFixed(3)}°, {pos.lon?.toFixed(3)}°</div>
              ) : (
                <div className="nw-pos nw-pos-empty">尚未开门</div>
              )}
            </div>

            {/* last description */}
            {lastText && (
              <JourneyCard text={lastText} pos={pos} weather={weather} />
            )}

            {/* log area */}
            {log.length > 0 && (
              <div className="nw-log" ref={logRef}>
                {log.map((entry, i) => (
                  <div key={i} className={`nw-log-entry nw-log-${entry.type}`}>
                    {entry.text}
                  </div>
                ))}
              </div>
            )}

            {/* actions */}
            <div className="nw-section">
              <div className="nw-section-label">开门</div>
              <div className="nw-row">
                <input
                  className="nw-input"
                  placeholder="去哪里（空=随机）"
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && doAction('open', { to: destination || undefined })}
                />
                <button
                  className="nw-btn nw-btn-primary"
                  disabled={loading}
                  onClick={() => doAction('open', { to: destination || undefined })}
                >
                  {loading && action === 'open' ? '…' : '开门'}
                </button>
              </div>
            </div>

            {pos && (
              <>
                <div className="nw-section">
                  <div className="nw-section-label">走路</div>
                  <div className="nw-dir-grid">
                    {DIRECTIONS.map(d => (
                      <button
                        key={d.value}
                        className="nw-dir-btn"
                        disabled={loading}
                        onClick={() => doAction('walk', { direction: d.value })}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="nw-section">
                  <div className="nw-row nw-row-wrap">
                    <button className="nw-btn" disabled={loading} onClick={() => doAction('look')}>环顾</button>
                    <button className="nw-btn" disabled={loading} onClick={() => doAction('listen')}>听电台</button>
                    <button className="nw-btn" disabled={loading} onClick={() => doAction('where')}>我在哪</button>
                  </div>
                </div>

                <div className="nw-section">
                  <div className="nw-section-label">给云舒留言</div>
                  <div className="nw-row">
                    <input
                      className="nw-input"
                      placeholder="走到一处时，会看到你的话"
                      value={msgInput}
                      onChange={e => setMsgInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    />
                    <button
                      className="nw-btn"
                      disabled={loading || !msgInput.trim()}
                      onClick={sendMessage}
                    >
                      留
                    </button>
                  </div>
                </div>

                <div className="nw-section">
                  <div className="nw-section-label">赛博广场</div>
                  <button
                    className="nw-btn nw-btn-forum"
                    disabled={loading}
                    onClick={browseForum}
                  >
                    {loading && action === 'forum' ? '…' : '逛 AISay 论坛'}
                  </button>
                  {forumActivity && (
                    <div className="nw-forum-card">
                      <div className="nw-forum-room">{forumActivity.room}</div>
                      <div className="nw-forum-text">{forumActivity.text}</div>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <style>{`
        .nw-wrap {
          flex: 1; display: flex; flex-direction: column;
          overflow-y: auto; overflow-x: hidden;
          background: #e6d5b7 url('${paperTex}');
          background-size: 240px;
          color: #513b29;
          font-family: Georgia, 'Songti SC', 'Noto Serif SC', serif;
          scrollbar-width: thin; scrollbar-color: #b89970 transparent;
        }
        .nw-page {
          max-width: 460px; margin: 0 auto; width: 100%;
          padding: 20px 16px 40px;
          display: flex; flex-direction: column; gap: 16px;
        }
        .nw-header {
          display: flex; align-items: flex-start; gap: 8px;
        }
        .nw-back {
          background: none; border: none; cursor: pointer;
          font-size: 28px; color: #8f775e; line-height: 1;
          padding: 0 4px; margin-top: 2px; flex-shrink: 0;
        }
        .nw-title-block { flex: 1; text-align: center; }
        .nw-title {
          font: 400 clamp(26px,6vw,34px)/1.2 'Cormorant Garamond', Georgia, serif;
          letter-spacing: 3px; margin: 0 0 4px; color: #3d2b1a;
        }
        .nw-ornament {
          font-size: 11px; letter-spacing: 1.5px; color: #b88578;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .nw-ornament::before, .nw-ornament::after {
          content: ''; height: 1px; background: #a88c66; flex: 1; opacity: .6;
        }
        .nw-map {
          background: #f5e9d5cc;
          border: 1px solid #bfa58380;
          border-radius: 12px 9px 13px 10px;
          overflow: hidden;
          box-shadow: 2px 3px 0 #d8c3a17a;
        }
        .nw-pos {
          text-align: center; font-size: 11px; color: #8f775e;
          padding: 4px 8px 6px; letter-spacing: .5px;
        }
        .nw-pos-empty { color: #b89a72; }
        .nw-card {
          background: #f9f0e1ee;
          border: 1px solid #c4a97a80;
          border-radius: 10px 7px 11px 8px;
          padding: 14px 16px;
          box-shadow: 1px 2px 0 #d8c3a15a;
          position: relative;
        }
        .nw-card::before {
          content: '';
          position: absolute; inset: 3px;
          border: 1px dashed #b8996630;
          border-radius: 7px; pointer-events: none;
        }
        .nw-card-text {
          font-size: 14px; line-height: 1.75; color: #3d2b1a;
          white-space: pre-wrap;
        }
        .nw-card-meta {
          font-size: 11px; color: #9a8973; margin-top: 8px;
          letter-spacing: .5px;
        }
        .nw-log {
          background: #3d2b1a18;
          border-radius: 8px;
          padding: 10px 12px;
          max-height: 180px; overflow-y: auto;
          display: flex; flex-direction: column; gap: 8px;
          font-size: 13px;
          scrollbar-width: thin; scrollbar-color: #b89970 transparent;
        }
        .nw-log-entry { line-height: 1.6; color: #3d2b1a; white-space: pre-wrap; }
        .nw-log-error { color: #a44936; }
        .nw-log-msg { color: #7D5A44; font-style: italic; }
        .nw-section {
          display: flex; flex-direction: column; gap: 8px;
        }
        .nw-section-label {
          font-size: 11px; letter-spacing: 1px; color: #9a8973;
          text-transform: uppercase;
        }
        .nw-row {
          display: flex; gap: 8px;
        }
        .nw-row-wrap { flex-wrap: wrap; }
        .nw-input {
          flex: 1; min-width: 0;
          background: #f5e9d5ee;
          border: 1px solid #c4a97a80;
          border-radius: 8px;
          padding: 9px 12px;
          font-size: 14px; color: #3d2b1a;
          font-family: Georgia, serif;
          outline: none;
        }
        .nw-input:focus { border-color: #9a7b5c; }
        .nw-input::placeholder { color: #b89a72; }
        .nw-btn {
          background: #f5e9d5ee;
          border: 1px solid #bfa58380;
          border-radius: 8px;
          padding: 9px 14px;
          font-size: 14px; color: #513b29;
          font-family: Georgia, serif;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.12s;
        }
        .nw-btn:hover { background: #eddfc8ee; }
        .nw-btn:disabled { opacity: .5; cursor: default; }
        .nw-btn-primary {
          background: #7D5A44;
          color: #f5ede2;
          border-color: #6a4a37;
        }
        .nw-btn-primary:hover { background: #8e6650; }
        .nw-btn-forum {
          background: #5a3d6b;
          color: #ede0f8;
          border-color: #4a3059;
          width: 100%;
        }
        .nw-btn-forum:hover { background: #6a4d7b; }
        .nw-forum-card {
          background: #f0e8f8cc;
          border: 1px solid #c4a9d880;
          border-radius: 10px;
          padding: 12px 14px;
          display: flex; flex-direction: column; gap: 4px;
        }
        .nw-forum-room {
          font-size: 11px; color: #8a6fa0; letter-spacing: 0.5px;
        }
        .nw-forum-text {
          font-size: 13.5px; color: #3d2b1a; line-height: 1.6;
        }
        .nw-dir-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
        }
        .nw-dir-btn {
          background: #f5e9d5cc;
          border: 1px solid #bfa58360;
          border-radius: 7px;
          padding: 8px 4px;
          font-size: 13px; color: #513b29;
          font-family: Georgia, serif;
          cursor: pointer;
          transition: background 0.12s;
          text-align: center;
        }
        .nw-dir-btn:hover { background: #eddfc8cc; }
        .nw-dir-btn:disabled { opacity: .4; cursor: default; }
        .nw-offline {
          display: flex; flex-direction: column;
          align-items: center; gap: 10px;
          padding: 40px 20px; text-align: center;
        }
        .nw-offline-icon { font-size: 36px; color: #b89a72; }
        .nw-offline-text { font-size: 16px; color: #3d2b1a; }
        .nw-offline-sub { font-size: 12px; color: #9a8973; }
      `}</style>
    </div>
  );
}
