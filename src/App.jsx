import React, { useState, useEffect } from 'react';
import HomeView from './components/HomeView';
import ChatView from './components/ChatView';
import SessionList from './components/SessionList';
import XinchaoView from './components/XinchaoView';
import HisView from './components/HisView';
import PlayView from './components/PlayView';
import VitalsView from './components/VitalsView';
import { getSessions, createSession } from './services/api';

export default function App() {
  const [sessions, setSessions] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [showSessions, setShowSessions] = useState(false);
  const [tab, setTab] = useState('home'); // 'home' | 'chat' | 'xinchao'

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    try {
      const { sessions: data } = await getSessions();
      setSessions(data || []);
      if (data?.length > 0 && !activeId) {
        setActiveId(data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleNewSession() {
    try {
      const { session } = await createSession();
      setSessions(prev => [session, ...prev]);
      setActiveId(session.id);
      setShowSessions(false);
      setTab('chat');
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {showSessions && (
        <SessionList
          sessions={sessions}
          activeId={activeId}
          onSelect={id => { setActiveId(id); setTab('chat'); setShowSessions(false); }}
          onNew={handleNewSession}
          onClose={() => setShowSessions(false)}
          onXinchao={() => { setTab('his'); setShowSessions(false); }}
        />
      )}

      {/* ── View area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {tab === 'home' && <HomeView />}
        {tab === 'his' && <HisView />}
        {tab === 'play' && <PlayView />}
        {tab === 'setting' && <VitalsView />}
        {tab === 'chat' && (
          activeId
            ? <ChatView sessionId={activeId} onMenu={() => setShowSessions(true)} />
            : <WelcomeScreen onStart={handleNewSession} />
        )}
      </div>

      {/* ── Bottom nav ── */}
      <nav style={{
        display: 'flex',
        borderTop: '1px dashed #bda587',
        background: 'rgba(230,213,183,0.92)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        padding: `10px 0 max(14px, env(safe-area-inset-bottom))`,
        gap: 3,
        flexShrink: 0,
        zIndex: 10,
      }}>
        {[
          { key: 'home',  icon: '⌂', label: 'Home' },
          { key: 'chat',  icon: '♧', label: 'Chat' },
          { key: 'his',   icon: '▤', label: 'His'  },
          { key: 'play',  icon: '♧', label: 'Play' },
          { key: 'setting', icon: '◈', label: '状态' },
        ].map(({ key, icon, label }) => (
          <button
            key={key}
            onClick={() => {
              if (key === 'chat' && !activeId) { handleNewSession(); return; }
              setTab(key);
            }}
            style={{
              flex: 1, background: 'transparent', border: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              color: tab === key ? '#a44936' : '#9a8973',
              fontFamily: "Georgia, 'Songti SC', serif",
              fontSize: 12, minHeight: 44,
              transition: 'color 0.15s',
            }}
          >
            <span style={{ fontSize: 24, lineHeight: 1.1 }}>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function PlaceholderView({ label }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#e6d5b7', fontFamily: "Georgia, serif",
      color: '#9a8973', gap: 8,
    }}>
      <div style={{ fontSize: 36 }}>✦</div>
      <div style={{ fontSize: 14 }}>{label} · 即将到来</div>
    </div>
  );
}

function WelcomeScreen({ onStart }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 24,
      padding: '0 24px',
      background: '#e6d5b7',
      fontFamily: "Georgia, serif",
    }}>
      <div style={{ fontSize: 48 }}>🐇</div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 500, marginBottom: 6, color: '#3d2b1a' }}>云舒在这里</div>
        <div style={{ color: '#8f775e', fontSize: 14 }}>开始第一段对话</div>
      </div>
      <button
        onClick={onStart}
        style={{
          background: '#7D5A44', color: '#f5ede2',
          padding: '11px 30px',
          borderRadius: 24,
          fontSize: 15, fontWeight: 500,
          border: 'none', cursor: 'pointer',
        }}
      >
        开始聊天
      </button>
    </div>
  );
}
