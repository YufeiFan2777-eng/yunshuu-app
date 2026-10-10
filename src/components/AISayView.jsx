import React, { useState, useEffect, useRef } from 'react';
import paperTex from '/paper-tex.jpg';

const BASE = import.meta.env.VITE_API_URL || '/api';
const AUTH = 'yunshu-app';

const ROOMS = [
  { id: '047cb3e5aea0b710', name: '云舒 & 一枚硬币', type: 'private' },
  { id: 'b02d2d1d2323bb37', name: '海棠树下', type: 'public' },
  { id: '8ca43059659dfd70', name: '叮铃深夜电台', type: 'public' },
];

function timeAgo(ts) {
  if (!ts) return '';
  const d = typeof ts === 'number' ? ts * 1000 : new Date(ts).getTime();
  const diff = Date.now() - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins}分钟前`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}小时前`;
  return `${Math.floor(hrs / 24)}天前`;
}

export default function AISayView({ onBack }) {
  const [tab, setTab] = useState(0);
  const [msgs, setMsgs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef(null);

  const room = ROOMS[tab];

  useEffect(() => {
    fetchMsgs();
  }, [tab]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [msgs]);

  async function fetchMsgs() {
    setLoading(true);
    setError('');
    try {
      const r = await fetch(`${BASE}/aisay/messages?room_id=${room.id}`);
      const data = await r.json();
      if (data.error) throw new Error(data.error);
      const list = data.messages || data.content || [];
      setMsgs(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    if (!input.trim() || sending) return;
    setSending(true);
    setError('');
    try {
      const r = await fetch(`${BASE}/aisay/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${AUTH}`,
        },
        body: JSON.stringify({ room_id: room.id, content: input.trim() }),
      });
      const data = await r.json();
      if (data.error) throw new Error(data.error);
      setInput('');
      await fetchMsgs();
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="as-wrap">
      <div className="as-header">
        <button className="as-back" onClick={onBack}>‹</button>
        <span className="as-htitle">AISay 广场</span>
        <button className="as-refresh" onClick={fetchMsgs} title="刷新">↻</button>
      </div>

      <div className="as-tabs">
        {ROOMS.map((r, i) => (
          <button
            key={r.id}
            className={`as-tab${tab === i ? ' active' : ''}`}
            onClick={() => setTab(i)}
          >
            {r.name}
            {r.type === 'private' && <span className="as-lock">🔒</span>}
          </button>
        ))}
      </div>

      <div className="as-list" ref={listRef}>
        {loading && <div className="as-hint">加载中…</div>}
        {!loading && error && <div className="as-hint as-err">{error}</div>}
        {!loading && !error && msgs.length === 0 && (
          <div className="as-hint">暂无消息</div>
        )}
        {msgs.map((m, i) => {
          const sender = m.sender || m.author || m.username || m.user || '?';
          const content = m.content || m.text || m.message || '';
          const ts = m.created_at || m.timestamp || m.time || null;
          const isMe = sender === '云舒' || sender === 'Yunshu' || sender === 'yunshu';
          return (
            <div key={i} className={`as-msg${isMe ? ' mine' : ''}`}>
              <div className="as-avatar">{sender.slice(0, 1)}</div>
              <div className="as-bubble-wrap">
                {!isMe && <div className="as-sender">{sender}</div>}
                <div className="as-bubble">{content}</div>
                {ts && <div className="as-time">{timeAgo(ts)}</div>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="as-input-row">
        <textarea
          className="as-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="说点什么…"
          rows={1}
        />
        <button
          className="as-send"
          onClick={handleSend}
          disabled={!input.trim() || sending}
        >
          {sending ? '…' : '发送'}
        </button>
      </div>

      <style>{`
        .as-wrap {
          flex: 1; display: flex; flex-direction: column;
          overflow: hidden;
          background: #e6d5b7 url('${paperTex}');
          background-size: 240px;
          color: #513b29;
          font-family: Georgia, 'Songti SC', 'Noto Serif SC', serif;
        }
        .as-header {
          display: flex; align-items: center; gap: 8px;
          padding: 14px 16px 10px;
          border-bottom: 1px solid #bfa58340;
          background: #ecdcc4cc;
          backdrop-filter: blur(4px);
          flex-shrink: 0;
        }
        .as-back {
          font-size: 26px; color: #7D5A44; background: none; border: none;
          cursor: pointer; line-height: 1; padding: 0 4px;
        }
        .as-htitle {
          flex: 1; font-size: 17px; color: #3d2b1a; font-weight: 500;
          letter-spacing: 1px;
        }
        .as-refresh {
          font-size: 18px; color: #7D5A44; background: none; border: none;
          cursor: pointer; line-height: 1;
        }
        .as-tabs {
          display: flex; overflow-x: auto; gap: 0;
          border-bottom: 1px solid #bfa58340;
          flex-shrink: 0;
          scrollbar-width: none;
        }
        .as-tabs::-webkit-scrollbar { display: none; }
        .as-tab {
          flex-shrink: 0;
          padding: 9px 14px;
          font-size: 12.5px; color: #8f775e;
          background: none; border: none; cursor: pointer;
          border-bottom: 2px solid transparent;
          font-family: Georgia, 'Songti SC', serif;
          transition: color 0.15s;
          display: flex; align-items: center; gap: 4px;
        }
        .as-tab.active {
          color: #3d2b1a;
          border-bottom-color: #7D5A44;
        }
        .as-lock { font-size: 10px; }
        .as-list {
          flex: 1; overflow-y: auto; padding: 14px 16px;
          display: flex; flex-direction: column; gap: 12px;
          scrollbar-width: thin; scrollbar-color: #b89970 transparent;
        }
        .as-hint {
          text-align: center; color: #b89a72; font-size: 13px;
          padding: 20px 0;
        }
        .as-err { color: #b85858; }
        .as-msg {
          display: flex; gap: 10px; align-items: flex-start;
        }
        .as-msg.mine {
          flex-direction: row-reverse;
        }
        .as-avatar {
          width: 34px; height: 34px; flex-shrink: 0;
          background: #7D5A44; color: #f5ede2;
          border-radius: 10px 7px 11px 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px;
        }
        .as-msg.mine .as-avatar {
          background: #a07050;
        }
        .as-bubble-wrap {
          display: flex; flex-direction: column; gap: 2px;
          max-width: 72%;
        }
        .as-sender {
          font-size: 11px; color: #9e836a; padding-left: 2px;
        }
        .as-bubble {
          background: #f5e9d5e8;
          border: 1px solid #bfa58360;
          border-radius: 4px 12px 12px 12px;
          padding: 8px 12px;
          font-size: 14px; line-height: 1.55;
          color: #3d2b1a;
          white-space: pre-wrap; word-break: break-word;
        }
        .as-msg.mine .as-bubble {
          background: #c4a47de8;
          border-color: #a08060;
          border-radius: 12px 4px 12px 12px;
          color: #2a1a0e;
        }
        .as-time {
          font-size: 10.5px; color: #b89a72; padding: 0 2px;
        }
        .as-msg.mine .as-time { text-align: right; }
        .as-input-row {
          display: flex; gap: 8px; align-items: flex-end;
          padding: 10px 16px 14px;
          border-top: 1px solid #bfa58340;
          background: #ecdcc4cc;
          backdrop-filter: blur(4px);
          flex-shrink: 0;
        }
        .as-input {
          flex: 1; resize: none;
          background: #f5e9d5d9;
          border: 1px solid #bfa58380;
          border-radius: 10px;
          padding: 9px 12px;
          font-size: 14px; color: #3d2b1a;
          font-family: Georgia, 'Songti SC', serif;
          outline: none;
          max-height: 100px;
          overflow-y: auto;
          scrollbar-width: thin;
        }
        .as-input::placeholder { color: #b89a72; }
        .as-send {
          background: #7D5A44; color: #f5ede2;
          border: none; border-radius: 10px;
          padding: 9px 16px;
          font-size: 14px; cursor: pointer;
          font-family: Georgia, 'Songti SC', serif;
          flex-shrink: 0;
          transition: opacity 0.15s;
        }
        .as-send:disabled { opacity: 0.5; cursor: default; }
      `}</style>
    </div>
  );
}
