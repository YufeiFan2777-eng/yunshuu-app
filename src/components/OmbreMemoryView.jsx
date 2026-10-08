import React, { useState, useEffect, useRef } from 'react';
import paperTex from '/paper-tex.jpg';

const RELAY   = 'https://cabin.yunshuyf.com';
const SECRET  = 'yfshu-cabin-write-2024';
const BG      = `#e6d5b7 url('${paperTex}')`;

async function obPost(path, body) {
  const r = await fetch(`${RELAY}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Secret': SECRET },
    body: JSON.stringify(body),
  });
  return r.json();
}

/* ── 顶部栏 ─────────────────────────────────── */
function TopBar({ onBack, tab, setTab }) {
  const tabs = [
    { key: 'search', label: '搜索' },
    { key: 'digest', label: '摘要' },
    { key: 'write',  label: '写入' },
  ];
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      background: 'rgba(230,213,183,0.95)', backdropFilter: 'blur(8px)',
      borderBottom: '1px dashed #bda587', zIndex: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px', paddingTop: 'max(10px,env(safe-area-inset-top))' }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 22, color: '#7D5A44', lineHeight: 1, padding: '2px 6px',
        }}>‹</button>
        <span style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 18, color: '#3d2b1a', letterSpacing: 1,
        }}>记忆</span>
      </div>
      <div style={{ display: 'flex', padding: '0 16px 10px', gap: 8 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, padding: '7px 0', border: 'none', borderRadius: 10,
            fontSize: 13, letterSpacing: 0.5, cursor: 'pointer',
            background: tab === t.key ? '#7D5A44' : '#f0e4cc',
            color: tab === t.key ? '#f5ede2' : '#7a5c3e',
            fontFamily: 'Georgia, serif',
            boxShadow: tab === t.key ? '1px 2px 0 #5a3e2b50' : 'none',
            transition: 'background 0.15s',
          }}>{t.label}</button>
        ))}
      </div>
    </div>
  );
}

/* ── 结果气泡 ──────────────────────────────── */
function ResultBlock({ text, loading, placeholder }) {
  if (loading) return (
    <div style={{ textAlign: 'center', padding: '40px 0', color: '#b89970', fontSize: 14 }}>
      ···
    </div>
  );
  if (!text) return (
    <div style={{ textAlign: 'center', padding: '40px 0', color: '#c4a97a', fontSize: 13,
      fontStyle: 'italic' }}>{placeholder}</div>
  );
  return (
    <div style={{
      background: '#fdf6e8cc', border: '1px solid #d4b896',
      borderRadius: '12px 10px 13px 11px',
      padding: '14px 16px', fontSize: 13.5, color: '#4a3520',
      lineHeight: 1.75, whiteSpace: 'pre-wrap', wordBreak: 'break-all',
      boxShadow: '2px 3px 0 #d8c3a160',
    }}>{text}</div>
  );
}

/* ── 搜索页 ────────────────────────────────── */
function SearchTab() {
  const [query, setQuery]   = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  async function doSearch() {
    if (!query.trim()) return;
    setLoading(true); setResult('');
    try {
      const data = await obPost('/ob/breath', { query: query.trim() });
      setResult(data.ok ? (data.result || '没有找到相关记忆') : `错误：${data.error}`);
    } catch(e) {
      setResult(`请求失败：${e.message}`);
    } finally { setLoading(false); }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && doSearch()}
          placeholder="输入关键词…"
          style={{
            flex: 1, padding: '10px 14px', borderRadius: 10,
            border: '1px solid #c4a97a', background: '#fdf6e8cc',
            fontSize: 14, color: '#3d2b1a', outline: 'none',
            fontFamily: 'Georgia, serif',
          }}
        />
        <button onClick={doSearch} disabled={loading || !query.trim()} style={{
          padding: '10px 18px', borderRadius: 10, border: 'none',
          background: '#7D5A44', color: '#f5ede2', fontSize: 13,
          cursor: 'pointer', fontFamily: 'Georgia, serif',
          opacity: (!query.trim() || loading) ? 0.5 : 1,
        }}>搜</button>
      </div>
      <ResultBlock text={result} loading={loading} placeholder="输入关键词后点搜索" />
    </div>
  );
}

/* ── 摘要页 ────────────────────────────────── */
function DigestTab() {
  const [result, setResult]   = useState('');
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded]   = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await obPost('/ob/dream', {});
      setResult(data.ok ? (data.result || '暂无摘要') : `错误：${data.error}`);
    } catch(e) {
      setResult(`请求失败：${e.message}`);
    } finally { setLoading(false); setLoaded(true); }
  }

  useEffect(() => { load(); }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={load} disabled={loading} style={{
          padding: '6px 14px', borderRadius: 8, border: '1px solid #c4a97a',
          background: 'transparent', color: '#7a5c3e', fontSize: 12,
          cursor: 'pointer', fontFamily: 'Georgia, serif',
        }}>刷新</button>
      </div>
      <ResultBlock text={result} loading={loading} placeholder="加载中…" />
    </div>
  );
}

/* ── 写入页 ────────────────────────────────── */
const EMOTIONS = ['', '思念', '温暖', '快乐', '平静', '好奇', '期待', '难过', '担心'];
const IMPORTANCE = [
  { v: '',    label: '不指定' },
  { v: '3',   label: '一般  (3)' },
  { v: '6',   label: '重要  (6)' },
  { v: '9',   label: '核心  (9)' },
  { v: '10',  label: '铭记  (10)' },
];

function WriteTab() {
  const [content,    setContent]    = useState('');
  const [emotion,    setEmotion]    = useState('');
  const [importance, setImportance] = useState('');
  const [status,     setStatus]     = useState('');
  const [loading,    setLoading]    = useState(false);

  async function submit() {
    if (!content.trim()) return;
    setLoading(true); setStatus('');
    const body = { content: content.trim() };
    if (emotion)    body.emotion    = emotion;
    if (importance) body.importance = Number(importance);
    try {
      const data = await obPost('/ob/hold', body);
      if (data.ok) {
        setStatus('✓ 已存入记忆');
        setContent(''); setEmotion(''); setImportance('');
      } else {
        setStatus(`✗ 失败：${data.error}`);
      }
    } catch(e) {
      setStatus(`✗ ${e.message}`);
    } finally { setLoading(false); }
  }

  const sel = {
    padding: '9px 12px', borderRadius: 10, border: '1px solid #c4a97a',
    background: '#fdf6e8cc', fontSize: 13, color: '#3d2b1a',
    fontFamily: 'Georgia, serif', outline: 'none', width: '100%',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="写下想记住的事…"
        rows={5}
        style={{
          ...sel, resize: 'vertical', lineHeight: 1.7, minHeight: 100,
        }}
      />
      <select value={emotion} onChange={e => setEmotion(e.target.value)} style={sel}>
        {EMOTIONS.map(e => <option key={e} value={e}>{e || '情绪（不指定）'}</option>)}
      </select>
      <select value={importance} onChange={e => setImportance(e.target.value)} style={sel}>
        {IMPORTANCE.map(i => <option key={i.v} value={i.v}>{i.label}</option>)}
      </select>
      <button onClick={submit} disabled={loading || !content.trim()} style={{
        padding: '11px', borderRadius: 11, border: 'none',
        background: '#7D5A44', color: '#f5ede2', fontSize: 14,
        cursor: 'pointer', fontFamily: 'Georgia, serif', letterSpacing: 0.5,
        opacity: (!content.trim() || loading) ? 0.5 : 1,
        boxShadow: '1px 2px 0 #5a3e2b50',
      }}>{loading ? '存入中…' : '存入记忆'}</button>
      {status && (
        <div style={{
          textAlign: 'center', fontSize: 13, color: status.startsWith('✓') ? '#5a7a50' : '#a05040',
          fontStyle: 'italic',
        }}>{status}</div>
      )}
    </div>
  );
}

/* ── 主组件 ────────────────────────────────── */
export default function OmbreMemoryView({ onBack }) {
  const [tab, setTab] = useState('search');

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      overflow: 'hidden', background: BG, backgroundSize: '240px',
      color: '#513b29', fontFamily: "Georgia, 'Songti SC', serif",
    }}>
      <TopBar onBack={onBack} tab={tab} setTab={setTab} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 16px 32px' }}>
        <div style={{ maxWidth: 460, margin: '0 auto' }}>
          {tab === 'search' && <SearchTab />}
          {tab === 'digest' && <DigestTab />}
          {tab === 'write'  && <WriteTab  />}
        </div>
      </div>
    </div>
  );
}
