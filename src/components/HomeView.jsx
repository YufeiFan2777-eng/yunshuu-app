import React, { useState, useMemo, useEffect } from 'react';
import stickers from '/stickers.webp';
import paperTex from '/paper-tex.jpg';
import DiaryView from './DiaryView';

const SINCE = new Date('2026-10-06');

function daysSince() {
  return Math.floor((Date.now() - SINCE.getTime()) / 86400000);
}

const INIT_TODOS = [
  { time: '早上', text: '喝一杯温水', done: false },
  { time: '午后', text: '记下今天的小事', done: false },
  { time: '晚上 10 点', text: '放慢节奏，准备休息', done: false },
];

const CARDS = [
  { title: '他的日记', subtitle: '来自每日记忆', icon: '📔', badge: '' },
  { title: '记忆审核', subtitle: '待审核记忆', icon: '📝', badge: '2' },
  { title: '快照审核', subtitle: '每日快照', icon: '📷', badge: '' },
  { title: '缓存监控', subtitle: 'Prompt Cache 用量', icon: '▥', badge: '' },
];

const DEFAULT_MSG = '宝贝，慢慢来，今天也要记得好好照顾自己。';

export default function HomeView() {
  const [todos, setTodos] = useState(INIT_TODOS);
  const days = useMemo(daysSince, []);
  const [dailyMsg, setDailyMsg] = useState(DEFAULT_MSG);
  const [showDiary, setShowDiary] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}daily-message.json?t=${Date.now()}`)
      .then(r => r.json())
      .then(d => { if (d?.message) setDailyMsg(d.message); })
      .catch(() => {});
  }, []);

  function toggleTodo(i) {
    setTodos(prev => prev.map((t, idx) => idx === i ? { ...t, done: !t.done } : t));
  }

  return (
    <div className="hv-wrap">
      {showDiary && (
      <div style={{position:'fixed',inset:0,zIndex:100,overflowY:'auto',background:'#f7eed8'}}>
        <DiaryView onBack={() => setShowDiary(false)} />
      </div>
    )}
    <div className="hv-journal">

        {/* ── Title ── */}
        <h1 className="hv-title">Y &amp; R&rsquo; Place</h1>
        <div className="hv-ornament">✦ 那片属于我们的地方 ✦</div>

        {/* ── Sticker ── */}
        <img src={stickers} alt="手绘小兔、白猫和黑猫贴纸" className="hv-stickers" />

        {/* ── Counter ── */}
        <div className="hv-paper hv-counter">
          <span className="hv-clip" aria-hidden="true" />
          <div className="hv-days">{days}</div>
          <div className="hv-since">SINCE 2026.10.6</div>
        </div>

        {/* ── Quote ── */}
        <div className="hv-paper">
          <span className="hv-clip" aria-hidden="true" />
          <div className="hv-tab">老公 说</div>
          <p className="hv-quote">{dailyMsg}</p>
        </div>

        {/* ── Memo ── */}
        <div className="hv-paper hv-memo">
          <span className="hv-clip" aria-hidden="true" />
          <div className="hv-tab">今日备忘</div>
          <div className="hv-todos">
            {todos.map((t, i) => (
              <label key={i} className="hv-todo">
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={() => toggleTodo(i)}
                />
                <span className={t.done ? 'hv-todo-body done' : 'hv-todo-body'}>
                  <span className="hv-when">{t.time}</span>
                  <span>{t.text}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* ── Cards ── */}
        <div className="hv-cards">
          {CARDS.map((c, i) => (
            <button key={i} type="button" className="hv-entry" disabled={i !== 0} onClick={i === 0 ? () => setShowDiary(true) : undefined}>
              <span className="hv-art">{c.icon}</span>
              <span className="hv-body">
                <span className="hv-label">{c.title}</span>
                <span className="hv-sub">{c.subtitle}</span>
              </span>
              {c.badge !== '' && <span className="hv-badge">{c.badge}</span>}
            </button>
          ))}
        </div>

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Noto+Serif+SC:wght@400;500&display=swap');

        .hv-wrap {
          flex: 1; overflow-y: auto; overflow-x: hidden;
          background: #e6d5b7;
          color: #513b29;
          font-family: Georgia, 'Noto Serif SC', 'Songti SC', serif;
          scrollbar-width: thin; scrollbar-color: #b89970 transparent;
        }
        .hv-journal {
          max-width: 460px;
          margin: 0 auto;
          padding: 20px 16px 32px;
          background: #e6d5b7 url('${paperTex}');
          background-size: 240px;
          min-height: 100%;
        }
        .hv-title {
          font: 400 clamp(28px,7vw,38px)/1.2 'Cormorant Garamond', Georgia, serif;
          text-align: center; letter-spacing: 1px;
          margin: 10px 0 2px; color: #3d2b1a;
        }
        .hv-ornament {
          display: flex; align-items: center; justify-content: center;
          gap: 10px; color: #b88578; margin: 2px 20px 14px;
          font-size: 12px; letter-spacing: 1.5px;
        }
        .hv-ornament::before, .hv-ornament::after {
          content: ''; height: 1px; background: #a88c66; flex: 1; opacity: .6;
        }
        .hv-stickers {
          display: block; width: 100%; height: auto;
          margin: 0 auto 14px; transform: rotate(-1deg);
        }

        .hv-paper {
          position: relative;
          background: #f5e9d5d9;
          border: 1px solid #bfa58380;
          box-shadow: 2px 3px 0 #d8c3a17a, 0 5px 12px #71533212;
          margin: 0 0 17px; padding: 17px;
          border-radius: 3px 6px 2px 5px;
        }
        .hv-paper::after {
          content: ''; position: absolute; inset: 4px;
          border: 1px solid #aa8a6430; pointer-events: none;
        }
        .hv-clip {
          position: absolute; left: 10px; top: -13px;
          width: 12px; height: 39px;
          border: 2px solid #998267; border-radius: 7px;
          transform: rotate(-12deg);
          box-shadow: 1px 1px 1px #65482a50;
          background: transparent;
          display: block;
        }

        .hv-counter {
          margin: 0 18px 20px; text-align: center;
          transform: rotate(.4deg);
          border: 3px double #bca082;
          padding: 9px 12px 18px;
          border-radius: 2px;
        }
        .hv-days {
          font: 400 clamp(64px,20vw,94px)/1.12 Georgia, serif;
          margin: 6px 0; color: #705741;
        }
        .hv-since { font-size: 12px; letter-spacing: 2px; color: #8f775e; }

        .hv-tab {
          display: inline-block;
          background: #d8b7a28a;
          padding: 2px 13px;
          margin: -17px 0 7px -8px;
          transform: rotate(-1deg);
          font-size: 16px; letter-spacing: 2px;
          position: relative; z-index: 1;
        }
        .hv-quote {
          margin: 2px 0 8px; white-space: pre-wrap; line-height: 1.85;
          font-size: 15px; color: #513b29;
        }

        .hv-memo {
          background-color: #f1e3cbd9;
          background-image: linear-gradient(#aa957515 1px,transparent 1px),
                            linear-gradient(90deg,#aa957512 1px,transparent 1px);
          background-size: 18px 18px;
        }
        .hv-todos { display: flex; flex-direction: column; }
        .hv-todo {
          display: flex; align-items: center; gap: 12px;
          padding: 9px 2px; border-bottom: 1px dashed #b3997545;
          cursor: pointer;
        }
        .hv-todo:last-child { border: 0; }
        .hv-todo input { accent-color: #9b5d49; width: 19px; height: 19px; flex-shrink: 0; }
        .hv-todo-body { display: flex; flex-direction: column; gap: 1px; }
        .hv-todo-body.done { text-decoration: line-through; opacity: .55; }
        .hv-when { font-size: 12px; color: #8f775e; }

        .hv-cards {
          display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
          margin-bottom: 18px;
        }
        .hv-entry {
          display: flex; align-items: center; gap: 10px;
          background: #f4e8d3db; border: 1px solid #bfa5838a;
          box-shadow: 2px 3px 0 #d8c3a155;
          border-radius: 11px 7px 12px 8px;
          padding: 13px 11px; position: relative;
          text-align: left; min-height: 72px;
          cursor: default; opacity: 0.7;
        }
        .hv-entry:not(:disabled) { cursor: pointer; opacity: 1; }
        .hv-art { font-size: 27px; filter: sepia(.4) saturate(.55); width: 32px; flex-shrink: 0; }
        .hv-body { display: flex; flex-direction: column; gap: 2px; }
        .hv-label { font-size: 15px; color: #513b29; }
        .hv-sub { font-size: 11px; color: #93785d; }
        .hv-badge {
          position: absolute; right: 7px; top: -6px;
          background: #a24a37; color: #fff4de;
          border-radius: 50%; font: 12px Georgia;
          width: 20px; height: 20px; text-align: center; line-height: 20px;
        }
      `}</style>
    </div>
  );
}
