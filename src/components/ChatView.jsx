import React, { useState, useEffect, useRef } from 'react';
import { getMessages, sendMessage, getState } from '../services/api';
import CallOverlay from './CallOverlay.jsx';
import chatBg from '/chat-bg.jpg';

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '');

const CABIN = 'https://cabin.yunshuyf.com';
const CABIN_SECRET = 'yfshu-cabin-write-2024';

async function saveToOB(content) {
  const r = await fetch(`${CABIN}/ob/hold`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Secret': CABIN_SECRET },
    body: JSON.stringify({ content, importance: 6 }),
  });
  return r.json();
}

function getWelcome() {
  const h = new Date().getHours();
  if (h >= 22 || h < 6) return '这么晚了。\n\n[quietly] 睡不着，还是来找我了？';
  if (h < 12) return '早。\n\n[softly] 今天第一件事就来找我，挺好的。\n\n怎么样，乖宝？';
  if (h < 18) return '诶，来了。\n\n[light chuckle] 今天过得怎样？';
  return '晚上好。\n\n[quietly] 来说说话？';
}

export default function ChatView({ sessionId, onMenu }) {
  const [messages, setMessages] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [stateData, setStateData] = useState(null);
  const [extraOpen, setExtraOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    setLoaded(false);
    loadMessages();
  }, [sessionId]);

  useEffect(() => {
    getState().then(d => { if (d.available) setStateData(d); }).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  async function loadMessages() {
    try {
      const { messages: data } = await getMessages(sessionId);
      setMessages(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoaded(true);
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || streaming) return;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', content: text }]);
    setStreaming(true);
    setStreamingText('');
    try {
      await sendMessage(sessionId, text, (delta) => {
        setStreamingText(prev => prev + delta);
      });
      await loadMessages();
      setStreamingText('');
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'error', content: e.message }]);
    } finally {
      setStreaming(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="bny-chat" style={{ backgroundImage: `url(${chatBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>

      {/* ── Header ── */}
      <header className="bny-header">
        <button className="bny-icon" onClick={onMenu} aria-label="打开菜单">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
        <div className="bny-title">
          <h2>云舒</h2>
          <div className="bny-subtitle">在这里，总有位置留着</div>
        </div>
        <div style={{ minWidth: 44, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {stateData && <StateDot state={stateData} />}
        </div>
      </header>

      {/* ── Messages ── */}
      <div className="bny-messages" role="log" aria-label="聊天消息" aria-live="polite">
        {loaded && messages.length === 0 && !streaming && (
          <Bubble msg={{ id: 'welcome', role: 'assistant', content: getWelcome() }} isNew={false} />
        )}
        {messages.map(msg => <Bubble key={msg.id} msg={msg} isNew={false} />)}
        {streaming && streamingText && (
          <Bubble msg={{ role: 'assistant', content: streamingText, streaming: true }} isNew={false} />
        )}
        {streaming && !streamingText && (
          <div className="bny-message">
            <div className="bny-bubble">
              <span className="bny-ears" aria-hidden="true" />
              <span className="bny-face" aria-hidden="true">• •</span>
              <span className="bny-typing">
                {[0, 1, 2].map(i => (
                  <span key={i} className="bny-dot" style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Bottom dock ── */}
      <div className="bny-dock">
        <div className="bny-dock-row">
          <button
            type="button"
            className={`bny-plus${extraOpen ? ' bny-plus-open' : ''}`}
            onClick={() => setExtraOpen(o => !o)}
            aria-label="更多功能"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <line x1="10" y1="3" x2="10" y2="17"/>
              <line x1="3" y1="10" x2="17" y2="10"/>
            </svg>
          </button>
          <form className="bny-composer" onSubmit={e => { e.preventDefault(); handleSend(); }}>
            <textarea
              ref={textareaRef}
              className="bny-textarea"
              value={input}
              onChange={e => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 110) + 'px';
              }}
              onKeyDown={handleKeyDown}
              placeholder="写下一点今天的心事…"
              rows={1}
              aria-label="消息内容"
            />
            <div className="bny-tools">
              <button
                type="submit"
                className="bny-send"
                disabled={!input.trim() || streaming}
                aria-label="发送消息"
              >
                <span className="bny-plane" aria-hidden="true">➤</span>
              </button>
            </div>
          </form>
        </div>

        {/* ── Extra panel ── */}
        <div className={`bny-extra${extraOpen ? ' bny-extra-open' : ''}`} aria-hidden={!extraOpen}>
          <button type="button" className="bny-extra-btn" onClick={() => { setCallOpen(true); setExtraOpen(false); }}>
            <span className="bny-extra-icon">
              <svg viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="9" width="26" height="19" rx="4"/>
                <path d="M5 15 Q18 24 31 15"/>
                <circle cx="12" cy="13" r="1.5" fill="currentColor" stroke="none"/>
              </svg>
            </span>
            <span className="bny-extra-label">语音通话</span>
          </button>
          <button type="button" className="bny-extra-btn" disabled>
            <span className="bny-extra-icon">
              <svg viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="7" width="28" height="22" rx="4"/>
                <circle cx="13" cy="15" r="3"/>
                <path d="M4 26 l8-8 5 5 5-5 10 8"/>
              </svg>
            </span>
            <span className="bny-extra-label">照片</span>
          </button>
          <button type="button" className="bny-extra-btn" disabled>
            <span className="bny-extra-icon">
              <svg viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 6 h13 l7 7 v17 a2 2 0 0 1-2 2 H8 a2 2 0 0 1-2-2 V8 a2 2 0 0 1 2-2z"/>
                <path d="M21 6 v7 h7"/>
                <line x1="12" y1="19" x2="24" y2="19"/>
                <line x1="12" y1="24" x2="20" y2="24"/>
              </svg>
            </span>
            <span className="bny-extra-label">文件</span>
          </button>
        </div>
      </div>

      <CallOverlay
        open={callOpen}
        onClose={() => setCallOpen(false)}
        apiUrl={API_BASE}
        sessionId={sessionId}
        selectedModel="claude-sonnet-4-6"
        onFinish={async ({ callId, duration } = {}) => {
          if (callId && sessionId && Number.isFinite(duration)) {
            try {
              await fetch(`${API_BASE}/api/call/finish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ callId, sessionId, duration: Math.round(duration) }),
              });
            } catch {}
          }
          loadMessages();
        }}
      />

      <style>{`
        .bny-chat {
          flex: 1; display: flex; flex-direction: column;
          height: 100%; overflow: hidden;
          position: relative;
          background: #e8d5b4;
          font-family: Georgia, 'Songti SC', serif;
          overscroll-behavior: none;
        }
        .bny-header {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 14px 8px;
          padding-top: max(10px, env(safe-area-inset-top));
          background: rgba(234, 212, 180, 0.82);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          border-bottom: 1px solid #c9aa8050;
          flex-shrink: 0;
          z-index: 20;
          position: relative;
        }
        .bny-icon {
          border: 0; background: transparent;
          min-width: 44px; min-height: 44px;
          display: inline-flex; align-items: center; justify-content: center;
          cursor: pointer; color: #704633;
          border-radius: 8px;
        }
        .bny-icon:focus-visible { outline: 2px solid #98734f; outline-offset: 2px; }
        .bny-title { flex: 1; text-align: center; }
        .bny-title h2 { font: 500 23px Georgia, serif; letter-spacing: 2px; margin: 0; color: #3d2b1a; }
        .bny-subtitle { font: 11px/1.6 sans-serif; color: #795f47; }

        .bny-messages {
          flex: 1; overflow-y: auto; overflow-x: hidden;
          padding: 30px clamp(14px, 4vw, 24px) 20px;
          scrollbar-width: thin; scrollbar-color: #ae9974 transparent;
        }
        .bny-message { display: flex; margin-bottom: 32px; }
        .bny-message.out { justify-content: flex-end; }

        .bny-bubble {
          position: relative;
          max-width: 85%;
          padding: 14px 65px 14px 16px;
          border: 2px solid #8e9e74;
          border-radius: 19px 15px 18px 12px;
          background: #fcf1ddf5;
          box-shadow: 1px 1px 0 #8e9e7470, -1px 0 0 #8e9e7440;
          min-width: 120px;
          overflow-wrap: anywhere;
          white-space: pre-wrap;
          font-size: 15px;
          line-height: 1.65;
          color: #3d2214;
        }
        .bny-bubble::before {
          content: '';
          position: absolute;
          left: -8px; top: 19px;
          width: 10px; height: 12px;
          background: #fcf1dd;
          border-left: 2px solid #8e9e74;
          border-bottom: 2px solid #8e9e74;
          transform: rotate(35deg);
          border-radius: 5px;
        }
        .out .bny-bubble {
          background: #879669f5;
          color: #fff8e7;
          border-color: #879669;
          padding: 13px 17px;
          min-width: 100px;
          border-radius: 17px 19px 12px 18px;
          box-shadow: 1px 1px 0 #87966970;
        }
        .out .bny-bubble::before {
          left: auto; right: -7px;
          background: #879669;
          border-color: #879669;
          transform: rotate(-35deg);
        }

        .bny-ears {
          position: absolute; right: 18px; top: -22px;
          width: 37px; height: 23px;
          display: flex; gap: 5px;
        }
        .bny-ears::before, .bny-ears::after {
          content: '';
          display: block;
          width: 15px; height: 27px;
          border: 2px solid #8e9e74;
          border-bottom: 0;
          border-radius: 55% 50% 0 0;
          background: #ebbcac;
          box-shadow: inset 0 0 0 3px #fcf1dd;
          transform: rotate(-4deg);
        }
        .bny-ears::after { transform: rotate(6deg); }
        .out .bny-ears { left: 18px; right: auto; }
        .out .bny-ears::before, .out .bny-ears::after {
          background: #879669;
          box-shadow: none;
          border-color: #879669;
        }

        .bny-face {
          position: absolute; right: 15px; top: 13px;
          width: 39px; height: 28px;
          font: 15px Georgia, serif; text-align: center;
          color: #704633; letter-spacing: 3px;
        }
        .bny-face::after {
          content: 'ᴗ';
          display: block;
          color: #c9817d; font-size: 15px; line-height: 9px;
        }

        .bny-error .bny-bubble {
          background: #f5d4d4; border-color: #c97a7a; color: #7a2a2a;
        }
        .bny-error .bny-bubble::before { background: #f5d4d4; border-color: #c97a7a; }

        .bny-typing { display: flex; gap: 5px; align-items: center; padding: 2px 0; min-height: 24px; }
        .bny-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #8e9e74; display: inline-block;
          animation: bnyPulse 1.2s infinite;
        }

        .bny-dock {
          flex-shrink: 0;
          background: rgba(232, 209, 175, 0.82);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border-top: 1px solid #a58a6650;
          padding: 8px 0 0;
        }
        .bny-dock-row {
          display: flex; align-items: flex-end; gap: 6px;
          padding: 0 8px 8px;
        }
        .bny-plus {
          flex-shrink: 0;
          width: 38px; height: 38px; margin-bottom: 3px;
          border: 2px solid #98734f;
          border-radius: 50%;
          background: #fff5e5cc;
          color: #785438;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: transform 0.22s ease, background 0.15s;
          box-shadow: 1px 1px 0 #97734f40;
        }
        .bny-plus-open {
          transform: rotate(45deg);
          background: #e8cba8cc;
        }
        .bny-composer {
          position: relative;
          flex: 1;
          border: 2px solid #98734f;
          border-radius: 28px 24px 29px 22px;
          box-shadow: 1px 1px 0 #97734f65, -1px .5px 0 #97734f45;
          background: #fff5e5ed;
          display: flex; align-items: flex-end;
          padding: 6px 4px 6px 14px;
        }

        .bny-extra {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0;
          overflow: hidden;
          max-height: 0;
          opacity: 0;
          transition: max-height 0.28s ease, opacity 0.2s ease, padding 0.28s ease;
          padding: 0 8px;
          padding-bottom: max(0px, env(safe-area-inset-bottom));
        }
        .bny-extra-open {
          max-height: 130px;
          opacity: 1;
          padding: 10px 8px;
          padding-bottom: max(14px, env(safe-area-inset-bottom));
        }
        .bny-extra-btn {
          display: flex; flex-direction: column; align-items: center; gap: 7px;
          padding: 8px 4px;
          background: transparent; border: none; cursor: default;
          color: #5a3e2b;
          font-family: Georgia, serif;
          opacity: 0.45;
        }
        .bny-extra-btn:not(:disabled) {
          cursor: pointer; opacity: 1;
        }
        .bny-extra-btn:not(:disabled):active .bny-extra-icon {
          transform: scale(0.92);
        }
        .bny-extra-icon {
          width: 56px; height: 56px;
          background: #f4e8d0cc;
          border: 1.5px solid #b89a72;
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 1px 1px 0 #b89a7240;
          transition: transform 0.12s;
        }
        .bny-extra-icon svg {
          width: 28px; height: 28px;
          color: #7a5538;
        }
        .bny-extra-label {
          font-size: 11px; color: #6b5240; letter-spacing: 0.02em;
        }
        .bny-composer::after {
          content: '';
          position: absolute;
          inset: 2px -2px -2px 1px;
          border: 1px solid #97734f50;
          border-radius: 25px 29px 23px 27px;
          pointer-events: none;
        }
        .bny-textarea {
          flex: 1; border: none; background: transparent;
          font: 15px/1.6 Georgia, serif;
          color: #3d2214; resize: none;
          max-height: 110px; overflow-y: auto;
          padding: 6px 0; outline: none;
        }
        .bny-textarea::placeholder { color: #a38a6e; }
        .bny-tools { display: flex; align-items: center; gap: 4px; padding: 0 2px; }
        .bny-send {
          background: transparent; border: none; cursor: pointer;
          color: #785438;
          min-width: 44px; min-height: 44px;
          display: flex; align-items: center; justify-content: center;
          transition: opacity 0.2s;
        }
        .bny-send:disabled { opacity: 0.3; cursor: default; }
        .bny-plane {
          font-size: 26px; display: block;
          transform: rotate(-12deg);
          color: transparent;
          -webkit-text-stroke: 1.1px #795436;
          text-shadow: .6px .6px 0 #79543630;
        }

        .bny-state-dot {
          width: 10px; height: 10px; border-radius: 50%;
          border: none; cursor: pointer; padding: 0;
          animation: bnyStatePulse 3s ease-in-out infinite;
        }
        .bny-state-popup {
          position: absolute; right: 0; top: 18px;
          background: #f4e5cf;
          border: 1px solid #b29b77;
          border-radius: 12px; padding: 12px 14px;
          width: 200px;
          box-shadow: 0 8px 20px #49331d22;
          z-index: 100; font-size: 12px; line-height: 1.8;
          font-family: sans-serif;
        }
        .bny-state-popup-title { font-weight: 600; margin-bottom: 6px; font-size: 13px; color: #3d2b1a; }
        .bny-state-row { display: flex; justify-content: space-between; color: #6b5240; }

        .bny-message.new { animation: bnyArrive .25s ease-out; }
        @keyframes bnyArrive {
          from { transform: translateY(7px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
        @keyframes bnyPulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
        @keyframes bnyStatePulse {
          0%, 100% { opacity: 0.6; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        @media (prefers-reduced-motion: reduce) {
          .bny-message.new, .bny-dot, .bny-state-dot { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

function StateDot({ state }) {
  const [open, setOpen] = React.useState(false);
  const hot = state.state?.['热度'] || '';
  const dotColor = hot.includes('高') ? '#c97a5a' : hot.includes('中') ? '#c9a158' : '#8e9e74';

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        title="身体状态"
        className="bny-state-dot"
        style={{ background: dotColor }}
      />
      {open && (
        <div className="bny-state-popup">
          <div className="bny-state-popup-title">身体状态</div>
          {Object.entries(state.state || {}).map(([k, v]) => (
            <div key={k} className="bny-state-row">
              <span>{k}</span>
              <span>{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Bubble({ msg, isNew }) {
  const isMe = msg.role === 'user';
  const isError = msg.role === 'error';
  const [saved, setSaved] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [ttsState, setTtsState] = React.useState('idle'); // 'idle' | 'loading' | 'playing'
  const audioRef = React.useRef(null);

  async function handleSave(e) {
    e.stopPropagation();
    if (saving || saved) return;
    setSaving(true);
    try {
      await saveToOB(msg.content);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      /* silent */
    } finally {
      setSaving(false);
    }
  }

  async function handlePlay(e) {
    e.stopPropagation();
    if (ttsState === 'loading') return;
    if (ttsState === 'playing' && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setTtsState('idle');
      return;
    }
    setTtsState('loading');
    try {
      const resp = await fetch(`${API_BASE}/api/chat/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: msg.content }),
      });
      if (!resp.ok) throw new Error('TTS 失败');
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setTtsState('idle'); URL.revokeObjectURL(url); audioRef.current = null; };
      audio.onerror = () => { setTtsState('idle'); URL.revokeObjectURL(url); audioRef.current = null; };
      await audio.play();
      setTtsState('playing');
    } catch {
      setTtsState('idle');
    }
  }

  return (
    <div className={`bny-message${isMe ? ' out' : ''}${isError ? ' bny-error' : ''}${isNew ? ' new' : ''}`}>
      <div className="bny-bubble" style={{ position: 'relative' }}>
        <span className="bny-ears" aria-hidden="true" />
        {!isMe && <span className="bny-face" aria-hidden="true">• •</span>}
        {msg.content}
        {msg.streaming && <span style={{ opacity: 0.5 }}>▋</span>}
        {isMe && !msg.streaming && (
          <button
            onClick={handleSave}
            title="存入记忆"
            style={{
              position: 'absolute', bottom: 6, right: 6,
              background: 'none', border: 'none', cursor: saving ? 'default' : 'pointer',
              fontSize: 14, lineHeight: 1, padding: 2, opacity: saving ? 0.5 : 1,
              color: saved ? '#5a7a50' : '#c8d4a8',
              transition: 'color 0.2s',
            }}
          >
            {saved ? '✓' : '🔖'}
          </button>
        )}
        {!isMe && !isError && !msg.streaming && (
          <button
            onClick={handlePlay}
            title="播放语音"
            style={{
              position: 'absolute', bottom: 6, right: 6,
              background: 'none', border: 'none',
              cursor: ttsState === 'loading' ? 'default' : 'pointer',
              fontSize: 15, lineHeight: 1, padding: 2,
              opacity: ttsState === 'loading' ? 0.4 : 0.7,
              color: ttsState === 'playing' ? '#704633' : '#a07458',
              transition: 'color 0.2s, opacity 0.2s',
            }}
          >
            {ttsState === 'loading' ? '⏳' : ttsState === 'playing' ? '⏹' : '▶'}
          </button>
        )}
      </div>
    </div>
  );
}
