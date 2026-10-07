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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
        paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))',
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        boxShadow: 'var(--shadow)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button onClick={onMenu} style={{ padding: 8, borderRadius: 8, fontSize: 18 }}>☰</button>
        <div style={{ fontWeight: 600, fontSize: 16 }}>云舒</div>
        <div style={{ width: 40, display: 'flex', justifyContent: 'center' }}>
          {stateData && <StateDot state={stateData} />}
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {loaded && messages.length === 0 && !streaming && (
          <Bubble msg={{ id: 'welcome', role: 'assistant', content: getWelcome() }} />
        )}
        {messages.map(msg => (
          <Bubble key={msg.id} msg={msg} />
        ))}
        {streaming && streamingText && (
          <Bubble msg={{ role: 'assistant', content: streamingText, streaming: true }} />
        )}
        {streaming && !streamingText && (
          <div style={{ display: 'flex', gap: 4, padding: '8px 12px', alignSelf: 'flex-start' }}>
            {[0, 1, 2].map(i => (
              <span key={i} style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'var(--fg-muted)',
                animation: `pulse 1.2s ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '12px 16px',
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
        background: 'var(--bg-card)',
        borderTop: '1px solid var(--border)',
        display: 'flex', gap: 10, alignItems: 'flex-end',
      }}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="说点什么..."
          rows={1}
          style={{
            flex: 1, padding: '10px 14px',
            borderRadius: 20, resize: 'none',
            maxHeight: 120, overflowY: 'auto',
            lineHeight: 1.5,
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || streaming}
          style={{
            width: 42, height: 42, borderRadius: '50%',
            background: input.trim() && !streaming ? 'var(--accent)' : 'var(--bg-input)',
            color: input.trim() && !streaming ? '#fff' : 'var(--fg-subtle)',
            fontSize: 18, flexShrink: 0,
            transition: 'background 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >↑</button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
        @keyframes statePulse {
          0%, 100% { opacity: 0.6; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
}

function StateDot({ state }) {
  const [open, setOpen] = React.useState(false);
  const hot = state.state?.['热度'] || '';
  const dotColor = hot.includes('高') ? '#f87171' : hot.includes('中') ? '#fb923c' : 'var(--accent-light)';

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        title="身体状态"
        style={{
          width: 10, height: 10, borderRadius: '50%',
          background: dotColor,
          border: 'none', cursor: 'pointer', padding: 0,
          animation: 'statePulse 3s ease-in-out infinite',
        }}
      />
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 18,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 12, padding: '12px 14px',
          width: 200, boxShadow: 'var(--shadow)',
          zIndex: 100, fontSize: 12,
          lineHeight: 1.8,
        }}>
          <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 13 }}>身体状态</div>
          {Object.entries(state.state || {}).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--fg-muted)' }}>{k}</span>
              <span>{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Bubble({ msg }) {
  const isMe = msg.role === 'user';
  const isError = msg.role === 'error';

  return (
    <div style={{
      display: 'flex',
      justifyContent: isMe ? 'flex-end' : 'flex-start',
      alignItems: 'flex-end',
      gap: 8,
    }}>
      {!isMe && (
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--accent-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, flexShrink: 0,
        }}>🌙</div>
      )}
      <div style={{
        maxWidth: '72%',
        padding: '10px 14px',
        borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        background: isError ? '#ff4444' : isMe ? 'var(--bubble-me)' : 'var(--bubble-them)',
        color: isError ? '#fff' : isMe ? 'var(--bubble-me-text)' : 'var(--bubble-them-text)',
        boxShadow: 'var(--shadow)',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        fontSize: 15,
        lineHeight: 1.6,
      }}>
        {msg.content}
        {msg.streaming && <span style={{ opacity: 0.5 }}>▋</span>}
      </div>
    </div>
  );
}
