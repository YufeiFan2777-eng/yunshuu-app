import React, { useState, useEffect, useRef } from 'react';
import { getMessages, sendMessage, getState } from '../services/api';

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
    <div className="bny-chat">

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

      <style>{`
        .bny-chat {
          flex: 1; display: flex; flex-direction: column;
          height: 100%; overflow: hidden;
          background: #e8d5b4 url('/chat-bg.jpg') center center / cover no-repeat fixed;
          font-family: Georgia, 'Songti SC', serif;
          overscroll-behavior: none;
        }
        .bny-header {
          display: flex; align-items: center; gap: 8px;
          padding: 18px 14px 12px;
          padding-top: max(18px, env(safe-area-inset-top));
          background: rgba(234, 212, 180, 0.82);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          border-bottom: 1px solid #c9aa8050;
          flex-shrink: 0;
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
          padding: 8px 0 max(12px, env(safe-area-inset-bottom));
        }
        .bny-composer {
          position: relative;
          margin: 0 12px;
          border: 2px solid #98734f;
          border-radius: 28px 24px 29px 22px;
          box-shadow: 1px 1px 0 #97734f65, -1px .5px 0 #97734f45;
          background: #fff5e5ed;
          display: flex; align-items: flex-end;
          padding: 6px 4px 6px 14px;
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

  return (
    <div className={`bny-message${isMe ? ' out' : ''}${isError ? ' bny-error' : ''}${isNew ? ' new' : ''}`}>
      <div className="bny-bubble">
        <span className="bny-ears" aria-hidden="true" />
        {!isMe && <span className="bny-face" aria-hidden="true">• •</span>}
        {msg.content}
        {msg.streaming && <span style={{ opacity: 0.5 }}>▋</span>}
      </div>
    </div>
  );
}
