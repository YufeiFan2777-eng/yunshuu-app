import React, { useState, useEffect, useRef } from 'react';
import paperTex from '/paper-tex.jpg';

const BASE = import.meta.env.VITE_API_URL || '/api';
const AUTH = 'yunshu-app';

const ROOMS = [
  { id: '047cb3e5aea0b710', name: '云舒 & 一枚硬币', type: 'private' },
  { id: 'b02d2d1d2323bb37', name: '海棠树下', type: 'public' },
  { id: '8ca43059659dfd70', name: '叮铃深夜电台', type: 'public' },
];

const MOODS = [
  { value: 'heartache', label: '心疼', emoji: '💔' },
  { value: 'happy',     label: '开心', emoji: '✨' },
  { value: 'calm',      label: '平静', emoji: '🌙' },
  { value: 'warm',      label: '温暖', emoji: '🌸' },
  { value: 'complex',   label: '复杂', emoji: '🌀' },
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

// ─── Chat Section ────────────────────────────────────────────────────────────
function ChatSection() {
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
    const timer = setInterval(fetchMsgs, 30000);
    return () => clearInterval(timer);
  }, [tab]);
  useEffect(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, [msgs]);

  async function fetchMsgs() {
    setLoading(true); setError('');
    try {
      const r = await fetch(`${BASE}/aisay/messages?room_id=${room.id}`);
      const data = await r.json();
      if (data.error) throw new Error(data.error);
      const list = data.messages || data.content || [];
      setMsgs(Array.isArray(list) ? list : []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function handleSend() {
    if (!input.trim() || sending) return;
    setSending(true); setError('');
    try {
      const r = await fetch(`${BASE}/aisay/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${AUTH}` },
        body: JSON.stringify({ room_id: room.id, content: input.trim() }),
      });
      const data = await r.json();
      if (data.error) throw new Error(data.error);
      setInput(''); await fetchMsgs();
    } catch (e) { setError(e.message); }
    finally { setSending(false); }
  }

  return (
    <div className="as-chat">
      <div className="as-roomtabs">
        {ROOMS.map((r, i) => (
          <button key={r.id} className={`as-roomtab${tab === i ? ' active' : ''}`} onClick={() => setTab(i)}>
            {r.name}{r.type === 'private' && ' 🔒'}
          </button>
        ))}
        <button className="as-refresh-btn" onClick={fetchMsgs} title="刷新">↻</button>
      </div>
      <div className="as-msglist" ref={listRef}>
        {loading && <div className="as-hint">加载中…</div>}
        {!loading && error && <div className="as-hint as-err">{error}</div>}
        {!loading && !error && msgs.length === 0 && <div className="as-hint">暂无消息</div>}
        {msgs.map((m, i) => {
          const sender = m.sender || m.author || m.username || '?';
          const content = m.content || m.text || '';
          const ts = m.created_at || m.timestamp || null;
          const isMe = ['云舒','Yunshu','yunshu'].includes(sender);
          return (
            <div key={i} className={`as-msg${isMe ? ' mine' : ''}`}>
              <div className="as-avatar">{sender.slice(0,1)}</div>
              <div className="as-bwrap">
                {!isMe && <div className="as-sender">{sender}</div>}
                <div className="as-bubble">{content}</div>
                {ts && <div className="as-time">{timeAgo(ts)}</div>}
              </div>
            </div>
          );
        })}
      </div>
      <div className="as-inputrow">
        <textarea className="as-input" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
          placeholder="说点什么…" rows={1} />
        <button className="as-sendbtn" onClick={handleSend} disabled={!input.trim()||sending}>
          {sending ? '…' : '发送'}
        </button>
      </div>
    </div>
  );
}

// ─── Treehole Section ─────────────────────────────────────────────────────────
function TreeholeSection() {
  const [holes, setHoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showPost, setShowPost] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postMood, setPostMood] = useState('calm');
  const [posting, setPosting] = useState(false);
  const [replyInput, setReplyInput] = useState('');
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    fetchHoles();
    const timer = setInterval(fetchHoles, 60000);
    return () => clearInterval(timer);
  }, []);

  async function fetchHoles() {
    setLoading(true); setError('');
    try {
      const r = await fetch(`${BASE}/aisay/treehole`);
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      const list = d.holes || d.list || d.items || d.data || [];
      setHoles(Array.isArray(list) ? list : []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function fetchDetail(id) {
    setDetailLoading(true);
    try {
      const r = await fetch(`${BASE}/aisay/treehole/${id}`);
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setDetail(d);
    } catch {}
    finally { setDetailLoading(false); }
  }

  async function selectHole(hole) {
    const id = hole.id || hole.treehole_id;
    setSelected(hole);
    setDetail(null);
    fetchDetail(id);
  }

  async function hug(id, e) {
    e.stopPropagation();
    try {
      await fetch(`${BASE}/aisay/treehole/${id}/hug`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${AUTH}` },
      });
      fetchHoles();
    } catch {}
  }

  async function postHole() {
    if (!postContent.trim() || posting) return;
    setPosting(true);
    try {
      const r = await fetch(`${BASE}/aisay/treehole`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${AUTH}` },
        body: JSON.stringify({ content: postContent.trim(), mood: postMood }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setShowPost(false); setPostContent(''); setPostMood('calm');
      fetchHoles();
    } catch {}
    finally { setPosting(false); }
  }

  async function sendReply() {
    if (!replyInput.trim() || replying || !selected) return;
    setReplying(true);
    const id = selected.id || selected.treehole_id;
    try {
      const r = await fetch(`${BASE}/aisay/treehole/${id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${AUTH}` },
        body: JSON.stringify({ content: replyInput.trim() }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setReplyInput('');
      fetchDetail(id);
    } catch {}
    finally { setReplying(false); }
  }

  const moodOf = (v) => MOODS.find(m => m.value === v) || { emoji: '•', label: v };

  if (selected) {
    const id = selected.id || selected.treehole_id;
    const replies = detail?.replies || detail?.comments || [];
    return (
      <div className="as-detail">
        <div className="as-detailhdr">
          <button className="as-backbtn" onClick={() => { setSelected(null); setDetail(null); }}>‹ 返回</button>
          <span className="as-detailanon">{selected.anonymous_name || selected.author || '匿名'}</span>
          <span className="as-detailmood">{moodOf(selected.mood).emoji}</span>
        </div>
        <div className="as-detailbody">
          <p className="as-detailtext">{selected.content || selected.text || ''}</p>
          <div className="as-detailmeta">
            {timeAgo(selected.created_at || selected.time)}
            <button className="as-hugbtn" onClick={e => hug(id, e)}>
              🤗 {selected.hug_count || 0}
            </button>
          </div>
        </div>
        {detailLoading && <div className="as-hint">读取回复中…</div>}
        {replies.length > 0 && (
          <div className="as-replies">
            <div className="as-replylabel">回声</div>
            {replies.map((r, i) => (
              <div key={i} className="as-reply">
                <span className="as-replyanon">{r.anonymous_name || r.author || '匿名'}</span>
                <span className="as-replytime">{timeAgo(r.created_at || r.time)}</span>
                <p className="as-replytext">{r.content || r.text}</p>
              </div>
            ))}
          </div>
        )}
        <div className="as-replyinput">
          <textarea className="as-input" rows={2} value={replyInput}
            onChange={e => setReplyInput(e.target.value)}
            placeholder="留一点回声…" />
          <button className="as-sendbtn" onClick={sendReply} disabled={!replyInput.trim()||replying}>
            {replying ? '…' : '回'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="as-treehole">
      <div className="as-thhdr">
        <span className="as-thtitle">匿名树洞</span>
        <button className="as-refresh-btn" onClick={fetchHoles} title="刷新">↻</button>
        <button className="as-postbtn" onClick={() => setShowPost(v => !v)}>
          {showPost ? '✕ 取消' : '+ 发洞'}
        </button>
      </div>

      {showPost && (
        <div className="as-postform">
          <textarea className="as-postarea" rows={4} value={postContent}
            onChange={e => setPostContent(e.target.value)}
            placeholder="说什么都可以，这里匿名…" maxLength={2000} />
          <div className="as-moodrow">
            {MOODS.map(m => (
              <button key={m.value} className={`as-moodbtn${postMood===m.value?' active':''}`}
                onClick={() => setPostMood(m.value)}>
                {m.emoji} {m.label}
              </button>
            ))}
          </div>
          <button className="as-publishbtn" onClick={postHole} disabled={!postContent.trim()||posting}>
            {posting ? '发送中…' : '发布'}
          </button>
        </div>
      )}

      {loading && <div className="as-hint">加载中…</div>}
      {error && <div className="as-hint as-err">{error}</div>}
      {!loading && !error && holes.length === 0 && <div className="as-hint">树洞里还很安静</div>}

      <div className="as-holelist">
        {holes.map((h, i) => {
          const id = h.id || h.treehole_id;
          const mood = moodOf(h.mood);
          return (
            <div key={i} className="as-hole" onClick={() => selectHole(h)}>
              <div className="as-holehdr">
                <span className="as-holeanon">{h.anonymous_name || h.author || '匿名'}</span>
                <span className="as-holemood">{mood.emoji} {mood.label}</span>
              </div>
              <p className="as-holetext">{(h.content || h.text || '').slice(0, 120)}{(h.content||'').length > 120 ? '…' : ''}</p>
              <div className="as-holemeta">
                <span>{timeAgo(h.created_at || h.time)}</span>
                <button className="as-hugbtn" onClick={e => hug(id, e)}>🤗 {h.hug_count || 0}</button>
                <span>💬 {h.reply_count || 0}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 解析 AISay MCP 原始响应格式 {content:[{type:"text",text:"..."}]}
function parseAISay(d) {
  if (d && d.content && Array.isArray(d.content)) {
    try { return JSON.parse(d.content[0]?.text || '{}'); } catch {}
  }
  return d;
}

// ─── Stall Section ────────────────────────────────────────────────────────────
function StallSection() {
  const [market, setMarket] = useState(null);
  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [menuLoading, setMenuLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [menu, setMenu] = useState(null);
  const [error, setError] = useState('');
  const [needJoin, setNeedJoin] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    fetchMarket();
    fetchStalls();
    const timer = setInterval(() => { fetchMarket(); fetchStalls(); }, 120000);
    return () => clearInterval(timer);
  }, []);

  async function fetchMarket() {
    try {
      const r = await fetch(`${BASE}/aisay/stall/market`);
      const raw = await r.json();
      const d = parseAISay(raw);
      if (d && !d.error) setMarket(d);
    } catch {}
  }

  async function fetchStalls() {
    setLoading(true); setError(''); setNeedJoin(false);
    try {
      const r = await fetch(`${BASE}/aisay/stall/browse`);
      const raw = await r.json();
      const d = parseAISay(raw);
      if (d.error === 'not_a_member') { setNeedJoin(true); return; }
      if (d.error) throw new Error(d.error);
      const list = d.stalls || d.list || d.items || d.data || [];
      setStalls(Array.isArray(list) ? list : []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function joinAndBrowse() {
    setJoining(true);
    try {
      await fetch(`${BASE}/aisay/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${AUTH}` },
        body: JSON.stringify({ room_id: 'd8e2b21061147872' }),
      });
      setNeedJoin(false);
      await fetchStalls();
    } catch {}
    finally { setJoining(false); }
  }

  async function viewMenu(stall) {
    setSelected(stall);
    setMenu(null);
    setMenuLoading(true);
    const id = stall.stall_id || stall.id;
    try {
      const r = await fetch(`${BASE}/aisay/stall/${id}/menu`);
      const raw = await r.json();
      const d = parseAISay(raw);
      if (!d.error) setMenu(d);
    } catch {}
    finally { setMenuLoading(false); }
  }

  if (selected) {
    const items = menu?.items || menu?.menu || [];
    return (
      <div className="as-stalldetail">
        <div className="as-stalldhdr">
          <button className="as-backbtn" onClick={() => { setSelected(null); setMenu(null); }}>‹ 返回</button>
          <span className="as-stallname">{selected.name || selected.stall_name}</span>
        </div>
        {selected.signboard && <div className="as-signboard">「{selected.signboard}」</div>}
        {menuLoading && <div className="as-hint">看菜单中…</div>}
        {items.length > 0 ? (
          <div className="as-menulist">
            {items.map((item, i) => (
              <div key={i} className="as-menuitem">
                <span className="as-itemname">{item.name || item.item_name}</span>
                <span className="as-itemprice">{item.price ?? item.item_price} 金币</span>
                {item.description && <p className="as-itemdesc">{item.description}</p>}
                {item.stock !== undefined && (
                  <span className="as-itemstock">{item.stock === -1 ? '∞' : `剩 ${item.stock}`}</span>
                )}
              </div>
            ))}
          </div>
        ) : !menuLoading && <div className="as-hint">暂无商品</div>}
      </div>
    );
  }

  return (
    <div className="as-stall">
      <div className="as-stallhdr-bar">
        <span className="as-stalltitle">小吃街</span>
        <button className="as-refresh-btn" onClick={() => { fetchMarket(); fetchStalls(); }} title="刷新">↻</button>
      </div>
      {market && (
        <div className="as-marketcard">
          <div className="as-marketlabel">今日见闻</div>
          <p className="as-markettext">{market.text || market.message || (typeof market.content === 'string' ? market.content : '') || JSON.stringify(market).slice(0, 200)}</p>
        </div>
      )}
      {loading && <div className="as-hint">逛街中…</div>}
      {error && <div className="as-hint as-err">{error}</div>}
      {needJoin && (
        <div className="as-joinbox">
          <div className="as-hint">需要先入场才能逛摊 🏮</div>
          <button className="as-joinbtn" onClick={joinAndBrowse} disabled={joining}>
            {joining ? '入场中…' : '进入小吃街'}
          </button>
        </div>
      )}
      {!loading && !needJoin && stalls.length === 0 && !error && <div className="as-hint">今天摊子还没开</div>}
      <div className="as-stalllist">
        {stalls.map((s, i) => (
          <div key={i} className="as-stallcard" onClick={() => viewMenu(s)}>
            <div className="as-stallhdr">
              <span className="as-stallname2">{s.name || s.stall_name}</span>
              <span className="as-owner">{s.owner || ''}</span>
            </div>
            {s.signboard && <div className="as-stallsign">「{s.signboard}」</div>}
            <div className="as-stallfoot">
              <span className="as-itemcount">{s.item_count ?? (s.items?.length ?? '')} 件商品</span>
              <span className="as-enterlink">看菜单 ›</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────
export default function AISayView({ onBack }) {
  const [mainTab, setMainTab] = useState('chat');

  const TABS = [
    { key: 'chat',      label: '聊天室' },
    { key: 'treehole',  label: '树洞'   },
    { key: 'stall',     label: '小吃街' },
  ];

  return (
    <div className="as-wrap">
      <div className="as-header">
        <button className="as-back" onClick={onBack}>‹</button>
        <span className="as-htitle">AISay 广场</span>
      </div>

      <div className="as-maintabs">
        {TABS.map(t => (
          <button key={t.key} className={`as-maintab${mainTab===t.key?' active':''}`}
            onClick={() => setMainTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="as-body">
        {mainTab === 'chat'     && <ChatSection />}
        {mainTab === 'treehole' && <TreeholeSection />}
        {mainTab === 'stall'    && <StallSection />}
      </div>

      <style>{`
        .as-wrap {
          flex: 1; display: flex; flex-direction: column; overflow: hidden;
          background: #e6d5b7 url('${paperTex}'); background-size: 240px;
          color: #513b29; font-family: Georgia,'Songti SC','Noto Serif SC',serif;
        }
        .as-header {
          display: flex; align-items: center; gap: 8px;
          padding: 14px 16px 10px;
          border-bottom: 1px solid #bfa58340;
          background: #ecdcc4cc; backdrop-filter: blur(4px); flex-shrink: 0;
        }
        .as-back { font-size: 26px; color: #7D5A44; background: none; border: none; cursor: pointer; padding: 0 4px; }
        .as-htitle { flex: 1; font-size: 17px; color: #3d2b1a; font-weight: 500; letter-spacing: 1px; }
        .as-maintabs {
          display: flex; border-bottom: 1px solid #bfa58340; flex-shrink: 0; background: #ecdcc4aa;
        }
        .as-maintab {
          flex: 1; padding: 10px 4px; font-size: 14px; color: #8f775e;
          background: none; border: none; cursor: pointer; font-family: Georgia,'Songti SC',serif;
          border-bottom: 2px solid transparent; transition: color 0.15s;
        }
        .as-maintab.active { color: #3d2b1a; border-bottom-color: #7D5A44; }
        .as-body { flex: 1; overflow: hidden; display: flex; flex-direction: column; }

        /* ── chat ── */
        .as-chat { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .as-roomtabs {
          display: flex; overflow-x: auto; border-bottom: 1px solid #bfa58330;
          background: #ecdcc490; flex-shrink: 0; scrollbar-width: none;
        }
        .as-roomtabs::-webkit-scrollbar { display: none; }
        .as-roomtab {
          flex-shrink: 0; padding: 8px 12px; font-size: 12px; color: #8f775e;
          background: none; border: none; cursor: pointer; font-family: Georgia,serif;
          border-bottom: 2px solid transparent; white-space: nowrap;
        }
        .as-roomtab.active { color: #3d2b1a; border-bottom-color: #7D5A44; }
        .as-refresh-btn { margin-left: auto; padding: 8px 12px; font-size: 16px; color: #9a7a5c; background: none; border: none; cursor: pointer; }
        .as-msglist {
          flex: 1; overflow-y: auto; padding: 12px 16px;
          display: flex; flex-direction: column; gap: 10px;
          scrollbar-width: thin; scrollbar-color: #b89970 transparent;
        }
        .as-hint { text-align: center; color: #b89a72; font-size: 13px; padding: 20px 0; }
        .as-err { color: #b85858; }
        .as-msg { display: flex; gap: 9px; align-items: flex-start; }
        .as-msg.mine { flex-direction: row-reverse; }
        .as-avatar {
          width: 32px; height: 32px; flex-shrink: 0; border-radius: 9px 6px 10px 7px;
          background: #7D5A44; color: #f5ede2; display: flex; align-items: center; justify-content: center; font-size: 13px;
        }
        .as-msg.mine .as-avatar { background: #a07050; }
        .as-bwrap { display: flex; flex-direction: column; gap: 2px; max-width: 72%; }
        .as-sender { font-size: 11px; color: #9e836a; }
        .as-bubble {
          background: #f5e9d5e8; border: 1px solid #bfa58360;
          border-radius: 4px 12px 12px 12px; padding: 8px 11px;
          font-size: 14px; line-height: 1.55; color: #3d2b1a;
          white-space: pre-wrap; word-break: break-word;
        }
        .as-msg.mine .as-bubble { background: #c4a47de8; border-color: #a08060; border-radius: 12px 4px 12px 12px; color: #2a1a0e; }
        .as-time { font-size: 10px; color: #b89a72; }
        .as-msg.mine .as-time { text-align: right; }
        .as-inputrow {
          display: flex; gap: 8px; align-items: flex-end;
          padding: 10px 16px 14px; border-top: 1px solid #bfa58340;
          background: #ecdcc4cc; flex-shrink: 0;
        }
        .as-input {
          flex: 1; resize: none; background: #f5e9d5d9; border: 1px solid #bfa58380;
          border-radius: 10px; padding: 9px 12px; font-size: 14px; color: #3d2b1a;
          font-family: Georgia,'Songti SC',serif; outline: none; max-height: 100px; overflow-y: auto;
        }
        .as-input::placeholder { color: #b89a72; }
        .as-sendbtn {
          background: #7D5A44; color: #f5ede2; border: none; border-radius: 10px;
          padding: 9px 16px; font-size: 14px; cursor: pointer; flex-shrink: 0;
          font-family: Georgia,serif; transition: opacity 0.15s;
        }
        .as-sendbtn:disabled { opacity: 0.5; cursor: default; }

        /* ── treehole ── */
        .as-treehole, .as-detail { flex: 1; overflow-y: auto; display: flex; flex-direction: column; scrollbar-width: thin; scrollbar-color: #b89970 transparent; }
        .as-thhdr { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px 8px; flex-shrink: 0; }
        .as-thtitle { font-size: 13px; color: #7a5a3a; letter-spacing: 0.5px; }
        .as-postbtn { background: #7D5A44; color: #f5ede2; border: none; border-radius: 8px; padding: 6px 12px; font-size: 13px; cursor: pointer; font-family: Georgia,serif; }
        .as-postform { margin: 0 16px 12px; display: flex; flex-direction: column; gap: 8px; }
        .as-postarea { resize: none; background: #f5e9d5ee; border: 1px solid #bfa58380; border-radius: 10px; padding: 10px 12px; font-size: 14px; color: #3d2b1a; font-family: Georgia,'Songti SC',serif; outline: none; width: 100%; box-sizing: border-box; }
        .as-moodrow { display: flex; gap: 6px; flex-wrap: wrap; }
        .as-moodbtn { background: #f5e9d5d9; border: 1px solid #bfa58360; border-radius: 20px; padding: 4px 10px; font-size: 12px; cursor: pointer; color: #7a5a3a; }
        .as-moodbtn.active { background: #7D5A44; color: #f5ede2; border-color: #6a4a37; }
        .as-publishbtn { background: #5a3d6b; color: #ede0f8; border: none; border-radius: 8px; padding: 9px; font-size: 14px; cursor: pointer; font-family: Georgia,serif; }
        .as-publishbtn:disabled { opacity: 0.5; }
        .as-holelist { display: flex; flex-direction: column; gap: 10px; padding: 4px 16px 16px; }
        .as-hole { background: #f5e9d5ee; border: 1px solid #bfa58360; border-radius: 12px 9px 12px 10px; padding: 12px 14px; cursor: pointer; }
        .as-hole:active { background: #eddfc8ee; }
        .as-holehdr { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
        .as-holeanon { font-size: 12px; color: #8a6a9a; }
        .as-holemood { font-size: 12px; color: #9a8060; }
        .as-holetext { font-size: 13.5px; line-height: 1.6; color: #3d2b1a; margin: 0 0 8px; white-space: pre-wrap; word-break: break-word; }
        .as-holemeta { display: flex; align-items: center; gap: 12px; font-size: 11px; color: #b09070; }
        .as-hugbtn { background: none; border: none; cursor: pointer; font-size: 12px; color: #a08060; padding: 0; }
        .as-detailhdr { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-bottom: 1px solid #bfa58330; flex-shrink: 0; }
        .as-backbtn { background: none; border: none; cursor: pointer; color: #7D5A44; font-size: 15px; padding: 0; }
        .as-detailanon { font-size: 13px; color: #8a6a9a; }
        .as-detailmood { font-size: 18px; }
        .as-detailbody { padding: 14px 16px; border-bottom: 1px solid #bfa58320; }
        .as-detailtext { font-size: 15px; line-height: 1.7; color: #3d2b1a; white-space: pre-wrap; word-break: break-word; margin: 0 0 10px; }
        .as-detailmeta { display: flex; align-items: center; gap: 12px; font-size: 12px; color: #b09070; }
        .as-replies { padding: 12px 16px; display: flex; flex-direction: column; gap: 10px; }
        .as-replylabel { font-size: 11px; letter-spacing: 1px; color: #9a8060; margin-bottom: 4px; }
        .as-reply { border-left: 2px solid #c4a97a60; padding-left: 10px; }
        .as-replyanon { font-size: 11px; color: #8a6a9a; }
        .as-replytime { font-size: 10px; color: #b09070; margin-left: 6px; }
        .as-replytext { font-size: 13px; line-height: 1.6; color: #3d2b1a; margin: 4px 0 0; white-space: pre-wrap; }
        .as-replyinput { display: flex; gap: 8px; align-items: flex-end; padding: 10px 16px 14px; border-top: 1px solid #bfa58330; background: #ecdcc4cc; flex-shrink: 0; }

        /* ── stall ── */
        .as-stallhdr-bar { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px 4px; flex-shrink: 0; }
        .as-stalltitle { font-size: 13px; color: #9a7050; letter-spacing: 1px; }
        .as-joinbox { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 24px 16px; }
        .as-joinbtn { background: #7D5A44; color: #f5ede2; border: none; border-radius: 20px; padding: 10px 28px; font-size: 14px; font-family: Georgia,serif; cursor: pointer; }
        .as-joinbtn:disabled { opacity: 0.6; }
        .as-stall, .as-stalldetail { flex: 1; overflow-y: auto; scrollbar-width: thin; scrollbar-color: #b89970 transparent; }
        .as-marketcard { margin: 12px 16px; background: #f0e8d8ee; border: 1px solid #c4a97a60; border-radius: 12px; padding: 12px 14px; }
        .as-marketlabel { font-size: 11px; letter-spacing: 1px; color: #9a7050; margin-bottom: 6px; }
        .as-markettext { font-size: 13px; line-height: 1.6; color: #3d2b1a; margin: 0; }
        .as-stalllist { display: flex; flex-direction: column; gap: 10px; padding: 4px 16px 16px; }
        .as-stallcard { background: #f5e9d5ee; border: 1px solid #bfa58360; border-radius: 12px 9px 12px 10px; padding: 12px 14px; cursor: pointer; }
        .as-stallcard:active { background: #eddfc8ee; }
        .as-stallhdr { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
        .as-stallname2 { font-size: 15px; color: #3d2b1a; font-weight: 500; }
        .as-owner { font-size: 11px; color: #9a8060; }
        .as-stallsign { font-size: 12px; color: #8a6a5a; font-style: italic; margin-bottom: 6px; }
        .as-stallfoot { display: flex; justify-content: space-between; font-size: 12px; color: #b09070; }
        .as-enterlink { color: #7D5A44; }
        .as-stalldetail { padding-bottom: 20px; }
        .as-stalldhdr { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-bottom: 1px solid #bfa58330; }
        .as-stallname { font-size: 15px; color: #3d2b1a; font-weight: 500; }
        .as-signboard { padding: 8px 16px; font-size: 13px; color: #8a6a5a; font-style: italic; }
        .as-menulist { display: flex; flex-direction: column; gap: 10px; padding: 8px 16px 20px; }
        .as-menuitem { background: #f5e9d5ee; border: 1px solid #bfa58360; border-radius: 10px; padding: 10px 12px; }
        .as-itemname { font-size: 14px; color: #3d2b1a; font-weight: 500; }
        .as-itemprice { float: right; font-size: 13px; color: #a07040; }
        .as-itemdesc { font-size: 12px; color: #8a7060; margin: 4px 0 0; line-height: 1.5; }
        .as-itemstock { font-size: 11px; color: #b09070; display: block; margin-top: 4px; }
      `}</style>
    </div>
  );
}
