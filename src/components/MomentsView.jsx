import React, { useState, useEffect, useRef } from 'react';
import paperTex from '/paper-tex.jpg';

const BASE = import.meta.env.VITE_API_URL || '/api';

async function getMoments() {
  const r = await fetch(`${BASE}/moments`);
  const data = await r.json();
  return data.entries || [];
}

async function postMoment(content, images = []) {
  const r = await fetch(`${BASE}/moments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, images }),
  });
  return r.json();
}

async function toggleLike(id, liked) {
  const r = await fetch(`${BASE}/moments/${id}/yufeifan-like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ liked }),
  });
  return r.json();
}

async function getComments(id) {
  const r = await fetch(`${BASE}/moments/${id}/comments`);
  const data = await r.json();
  return data.comments || [];
}

async function postComment(id, content) {
  const r = await fetch(`${BASE}/moments/${id}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  return r.json();
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins}分钟前`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}小时前`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}天前`;
  return new Date(dateStr).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

function CommentThread({ momentId, open }) {
  const [comments, setComments] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open) return;
    getComments(momentId).then(c => { setComments(c); setLoaded(true); });
  }, [open, momentId]);

  const send = async () => {
    const txt = input.trim();
    if (!txt || sending) return;
    setSending(true);
    await postComment(momentId, txt);
    setInput('');
    const updated = await getComments(momentId);
    setComments(updated);
    setSending(false);
  };

  if (!open) return null;

  return (
    <div className="comments-wrap">
      {loaded && comments.length === 0 && (
        <p className="comments-empty">还没有评论</p>
      )}
      {comments.map(c => (
        <div key={c.id} className={`comment-row ${c.author === 'yunshuu' ? 'comment-yunshuu' : 'comment-yufei'}`}>
          <span className="comment-who">{c.author === 'yunshuu' ? '云舒' : '雨菲'}</span>
          <span className="comment-text">{c.content}</span>
        </div>
      ))}
      <div className="comment-input-row">
        <input
          className="comment-input"
          placeholder="说点什么…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
        />
        <button className="comment-send" onClick={send} disabled={sending || !input.trim()}>
          {sending ? '…' : '发'}
        </button>
      </div>
    </div>
  );
}

function MomentCard({ item, onLike }) {
  const isYunshuu = item.author === 'yunshuu';
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`moment-card ${isYunshuu ? 'card-yunshuu' : 'card-yufei'}`}>
      <div className="moment-meta">
        <span className="moment-author">{isYunshuu ? '云舒' : '雨菲'}</span>
        <span className="moment-time">{timeAgo(item.created_at)}</span>
      </div>

      <p className="moment-content">{item.content}</p>

      {item.images && item.images.length > 0 && (
        <div className="moment-images">
          {item.images.map((url, i) => (
            <img key={i} src={url} className="moment-img" alt="" />
          ))}
        </div>
      )}

      {/* 云舒对雨菲动态的回应 */}
      {!isYunshuu && (item.liked || item.reply_content) && (
        <div className="moment-reaction">
          {item.liked && <span className="reaction-heart">❤️ 云舒觉得很赞</span>}
          {item.reply_content && (
            <div className="reaction-comment">
              <span className="reaction-who">云舒：</span>
              <span>{item.reply_content}</span>
            </div>
          )}
        </div>
      )}

      <div className="moment-actions">
        {isYunshuu ? (
          <button
            className={`action-like ${item.yufeifan_liked ? 'liked' : ''}`}
            onClick={() => onLike(item.id, !item.yufeifan_liked)}
          >
            {item.yufeifan_liked ? '❤️' : '🤍'} {item.yufeifan_liked ? '已点赞' : '点赞'}
          </button>
        ) : (
          <span className="action-placeholder" />
        )}
        <button
          className={`action-comment ${expanded ? 'active' : ''}`}
          onClick={() => setExpanded(v => !v)}
        >
          💬 评论{expanded ? ' ▲' : ''}
        </button>
      </div>

      <CommentThread momentId={item.id} open={expanded} />
    </div>
  );
}

function PostBox({ onPosted }) {
  const [text, setText] = useState('');
  const [images, setImages] = useState([]);
  const [posting, setPosting] = useState(false);
  const fileRef = useRef();

  const handleFiles = async (files) => {
    const loaded = [];
    for (const f of Array.from(files).slice(0, 4)) {
      const data = await new Promise((res) => {
        const reader = new FileReader();
        reader.onload = e => res(e.target.result.split(',')[1]);
        reader.readAsDataURL(f);
      });
      loaded.push({ data, media_type: f.type || 'image/jpeg' });
    }
    setImages(prev => [...prev, ...loaded].slice(0, 4));
  };

  const submit = async () => {
    if (!text.trim() || posting) return;
    setPosting(true);
    await postMoment(text.trim(), images);
    setText('');
    setImages([]);
    setPosting(false);
    onPosted();
  };

  return (
    <div className="postbox">
      <textarea
        className="postbox-textarea"
        placeholder="此刻有什么想说的…"
        value={text}
        onChange={e => setText(e.target.value)}
        rows={3}
      />
      {images.length > 0 && (
        <div className="postbox-previews">
          {images.map((img, i) => (
            <div key={i} className="postbox-preview-wrap">
              <img src={`data:${img.media_type};base64,${img.data}`} className="postbox-preview" alt="" />
              <button className="postbox-preview-rm" onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}>×</button>
            </div>
          ))}
        </div>
      )}
      <div className="postbox-row">
        <button className="postbox-img-btn" onClick={() => fileRef.current.click()}>
          🖼 图片
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={e => handleFiles(e.target.files)} />
        <button className="postbox-submit" onClick={submit} disabled={posting || !text.trim()}>
          {posting ? '发布中…' : '发布'}
        </button>
      </div>
    </div>
  );
}

export default function MomentsView({ onBack }) {
  const [moments, setMoments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await getMoments();
    setMoments(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleLike = async (id, liked) => {
    const updated = await toggleLike(id, liked);
    setMoments(prev => prev.map(m => m.id === id ? { ...m, yufeifan_liked: updated.yufeifan_liked } : m));
  };

  return (
    <div className="mw-wrap">
      <div className="mw-page">
        <div className="mw-header">
          <button className="mw-back" onClick={onBack}>‹ 返回</button>
          <h2 className="mw-title">朋友圈</h2>
          <button className="mw-post-btn" onClick={() => setComposing(v => !v)}>
            {composing ? '取消' : '+ 发动态'}
          </button>
        </div>

        {composing && (
          <PostBox onPosted={() => { setComposing(false); load(); }} />
        )}

        {loading ? (
          <div className="mw-loading">加载中…</div>
        ) : moments.length === 0 ? (
          <div className="mw-empty">还没有动态，来发第一条吧 ✦</div>
        ) : (
          <div className="mw-feed">
            {moments.map(m => (
              <MomentCard key={m.id} item={m} onLike={handleLike} />
            ))}
          </div>
        )}

        <button className="mw-refresh" onClick={load}>刷新</button>
      </div>

      <style>{`
        .mw-wrap {
          flex: 1; display: flex; flex-direction: column;
          overflow-y: auto; overflow-x: hidden;
          background: #e6d5b7 url('${paperTex}');
          background-size: 240px;
          color: #513b29;
          font-family: Georgia, 'Songti SC', 'Noto Serif SC', serif;
          scrollbar-width: thin; scrollbar-color: #b89970 transparent;
        }
        .mw-page {
          max-width: 460px; margin: 0 auto; width: 100%;
          padding: 20px 14px 48px;
        }
        .mw-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 18px;
        }
        .mw-back {
          background: none; border: none; cursor: pointer;
          font: 16px Georgia, serif; color: #7D5A44; padding: 4px 0;
        }
        .mw-title {
          font: 400 22px/1 'Cormorant Garamond', Georgia, serif;
          letter-spacing: 2px; margin: 0; color: #3d2b1a;
        }
        .mw-post-btn {
          background: #7D5A44; color: #f5ede2; border: none; cursor: pointer;
          font: 13px Georgia, serif; padding: 6px 12px;
          border-radius: 20px; letter-spacing: 0.5px;
        }
        .mw-loading, .mw-empty {
          text-align: center; padding: 48px 0; color: #a08060; font-size: 14px;
          letter-spacing: 1px;
        }
        .mw-feed { display: flex; flex-direction: column; gap: 14px; }
        .mw-refresh {
          display: block; margin: 24px auto 0;
          background: none; border: 1px solid #bfa58380;
          color: #8f775e; font: 13px Georgia, serif;
          padding: 7px 20px; border-radius: 20px; cursor: pointer;
          letter-spacing: 0.5px;
        }

        /* PostBox */
        .postbox {
          background: #f5e9d5d9;
          border: 1px solid #bfa58380;
          border-radius: 12px 10px 13px 11px;
          padding: 14px; margin-bottom: 16px;
          box-shadow: 2px 3px 0 #d8c3a17a;
        }
        .postbox-textarea {
          width: 100%; resize: none; border: 1px solid #bfa58360;
          background: #fffdf8; border-radius: 8px; padding: 10px;
          font: 14px Georgia, serif; color: #3d2b1a;
          box-sizing: border-box; outline: none;
        }
        .postbox-textarea:focus { border-color: #7D5A44; }
        .postbox-previews {
          display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px;
        }
        .postbox-preview-wrap { position: relative; }
        .postbox-preview { width: 72px; height: 72px; object-fit: cover; border-radius: 8px; }
        .postbox-preview-rm {
          position: absolute; top: -6px; right: -6px;
          background: #7D5A44; color: #fff; border: none; border-radius: 50%;
          width: 18px; height: 18px; font-size: 12px; cursor: pointer;
          display: flex; align-items: center; justify-content: center; padding: 0;
        }
        .postbox-row {
          display: flex; justify-content: space-between; align-items: center;
          margin-top: 10px;
        }
        .postbox-img-btn {
          background: none; border: 1px solid #bfa58380;
          color: #8f775e; font: 13px Georgia, serif;
          padding: 5px 12px; border-radius: 16px; cursor: pointer;
        }
        .postbox-submit {
          background: #7D5A44; color: #f5ede2; border: none;
          font: 13px Georgia, serif; padding: 6px 18px;
          border-radius: 16px; cursor: pointer;
        }
        .postbox-submit:disabled { opacity: 0.5; cursor: default; }

        /* Moment cards */
        .moment-card {
          background: #f5e9d5d9;
          border: 1px solid #bfa58380;
          box-shadow: 2px 3px 0 #d8c3a17a, 0 4px 10px #71533210;
          border-radius: 12px 10px 13px 11px;
          padding: 14px 14px 10px;
          position: relative;
        }
        .card-yunshuu { border-left: 3px solid #7D5A44; }
        .card-yufei { border-left: 3px solid #b88578; }

        .moment-meta {
          display: flex; justify-content: space-between; align-items: baseline;
          margin-bottom: 8px;
        }
        .moment-author { font-size: 14px; font-weight: 500; color: #3d2b1a; }
        .card-yunshuu .moment-author { color: #7D5A44; }
        .moment-time { font-size: 11px; color: #a08060; }

        .moment-content {
          font-size: 14px; line-height: 1.7; color: #3d2b1a;
          margin: 0 0 8px; white-space: pre-wrap; word-break: break-word;
        }

        .moment-images {
          display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px;
        }
        .moment-img {
          width: 90px; height: 90px; object-fit: cover;
          border-radius: 8px;
        }

        /* 云舒回应区 */
        .moment-reaction {
          background: #ece0ca90; border-radius: 8px;
          padding: 8px 10px; margin-bottom: 8px;
          font-size: 13px; color: #6b4f38;
          display: flex; flex-direction: column; gap: 4px;
        }
        .reaction-heart { font-size: 12px; }
        .reaction-comment { display: flex; gap: 4px; }
        .reaction-who { font-weight: 500; color: #7D5A44; flex-shrink: 0; }

        /* Actions */
        .moment-actions {
          display: flex; justify-content: space-between; align-items: center;
          padding-top: 8px; border-top: 1px solid #d5c3a830;
          margin-top: 4px;
        }
        .action-like, .action-comment {
          background: none; border: none; cursor: pointer;
          font: 12px Georgia, serif; color: #a08060;
          padding: 3px 0; letter-spacing: 0.3px;
        }
        .action-like.liked { color: #c0635a; }
        .action-comment.active { color: #7D5A44; }
        .action-placeholder { flex: 1; }

        /* Comments */
        .comments-wrap {
          margin-top: 10px; border-top: 1px dashed #d5c3a870;
          padding-top: 10px;
        }
        .comments-empty {
          font-size: 12px; color: #a08060; text-align: center;
          margin: 4px 0 8px;
        }
        .comment-row {
          display: flex; gap: 6px; font-size: 13px;
          margin-bottom: 6px; line-height: 1.5;
        }
        .comment-who {
          font-weight: 500; flex-shrink: 0;
        }
        .comment-yunshuu .comment-who { color: #7D5A44; }
        .comment-yufei .comment-who { color: #b88578; }
        .comment-text { color: #3d2b1a; word-break: break-word; }
        .comment-input-row {
          display: flex; gap: 8px; margin-top: 8px;
        }
        .comment-input {
          flex: 1; border: 1px solid #bfa58360; background: #fffdf8;
          border-radius: 16px; padding: 6px 12px;
          font: 13px Georgia, serif; color: #3d2b1a; outline: none;
        }
        .comment-input:focus { border-color: #7D5A44; }
        .comment-send {
          background: #7D5A44; color: #f5ede2; border: none;
          font: 13px Georgia, serif; padding: 6px 14px;
          border-radius: 16px; cursor: pointer; flex-shrink: 0;
        }
        .comment-send:disabled { opacity: 0.5; cursor: default; }
      `}</style>
    </div>
  );
}
