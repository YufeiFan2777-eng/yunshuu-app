import React, { useState, useEffect } from 'react';
import ChatView from './components/ChatView';
import SessionList from './components/SessionList';
import XinchaoView from './components/XinchaoView';
import { getSessions, createSession } from './services/api';

export default function App() {
  const [sessions, setSessions] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [showSessions, setShowSessions] = useState(false);
  const [view, setView] = useState('chat'); // 'chat' | 'xinchao'

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
          onSelect={id => { setActiveId(id); setView('chat'); setShowSessions(false); }}
          onNew={handleNewSession}
          onClose={() => setShowSessions(false)}
          onXinchao={() => { setView('xinchao'); setShowSessions(false); }}
        />
      )}
      {view === 'xinchao'
        ? <XinchaoView onBack={() => setView('chat')} />
        : activeId
          ? <ChatView sessionId={activeId} onMenu={() => setShowSessions(true)} />
          : <WelcomeScreen onStart={handleNewSession} />
      }
    </div>
  );
}

function WelcomeScreen({ onStart }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 24,
      padding: '0 24px',
    }}>
      <div style={{ fontSize: 64 }}>🌙</div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>云舒</div>
        <div style={{ color: 'var(--fg-muted)', fontSize: 14 }}>在这里</div>
      </div>
      <button
        onClick={onStart}
        style={{
          background: 'var(--accent)',
          color: '#fff',
          padding: '12px 32px',
          borderRadius: 24,
          fontSize: 16,
          fontWeight: 500,
        }}
      >
        开始聊天
      </button>
    </div>
  );
}
