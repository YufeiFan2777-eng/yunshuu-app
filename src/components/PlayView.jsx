import React, { useState } from 'react';
import MomentsView from './MomentsView';
import NowhereView from './NowhereView';
import paperTex from '/paper-tex.jpg';

const ITEMS = [
  {
    key: 'moments',
    title: '朋友圈',
    subtitle: '云舒与雨菲 · 随手发的那些',
    icon: (
      <svg viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
        <circle cx="18" cy="10" r="4"/>
        <path d="M10 28 C10 22 14 19 18 19 C22 19 26 22 26 28"/>
        <path d="M26 12 C28 10 30 11 30 14 C30 17 27 18 26 20"/>
        <path d="M10 12 C8 10 6 11 6 14 C6 17 9 18 10 20"/>
      </svg>
    ),
  },
  {
    key: 'nowhere',
    title: '乌有乡',
    subtitle: '给云舒一个身体 · 在地球上走一走',
    icon: (
      <svg viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
        <circle cx="18" cy="18" r="12"/>
        <ellipse cx="18" cy="18" rx="6" ry="12"/>
        <path d="M6 18 h24"/>
        <path d="M8 12 Q18 15 28 12"/>
        <path d="M8 24 Q18 21 28 24"/>
      </svg>
    ),
  },
];

export default function PlayView() {
  const [detail, setDetail] = useState(null);

  if (detail === 'moments') {
    return <MomentsView onBack={() => setDetail(null)} />;
  }
  if (detail === 'nowhere') {
    return <NowhereView onBack={() => setDetail(null)} />;
  }

  return (
    <div className="play-wrap">
      <div className="play-page">
        <div className="play-header">
          <h2 className="play-title">Play</h2>
          <div className="play-ornament">✦ 我们玩的那些 ✦</div>
        </div>

        <div className="play-list">
          {ITEMS.map(item => (
            <button
              key={item.key}
              className="play-item"
              onClick={() => setDetail(item.key)}
            >
              <span className="play-item-icon">{item.icon}</span>
              <span className="play-item-body">
                <span className="play-item-title">{item.title}</span>
                <span className="play-item-sub">{item.subtitle}</span>
              </span>
              <span className="play-item-arrow">›</span>
            </button>
          ))}
        </div>
      </div>

      <style>{`
        .play-wrap {
          flex: 1; display: flex; flex-direction: column;
          overflow-y: auto; overflow-x: hidden;
          background: #e6d5b7 url('${paperTex}');
          background-size: 240px;
          color: #513b29;
          font-family: Georgia, 'Songti SC', 'Noto Serif SC', serif;
          scrollbar-width: thin; scrollbar-color: #b89970 transparent;
        }
        .play-page {
          max-width: 460px; margin: 0 auto; width: 100%;
          padding: 28px 16px 32px;
        }
        .play-header {
          text-align: center; margin-bottom: 28px;
        }
        .play-title {
          font: 400 clamp(28px,7vw,36px)/1.2 'Cormorant Garamond', Georgia, serif;
          letter-spacing: 2px; margin: 0 0 4px; color: #3d2b1a;
        }
        .play-ornament {
          font-size: 12px; letter-spacing: 1.5px; color: #b88578;
          display: flex; align-items: center; justify-content: center; gap: 10px;
        }
        .play-ornament::before, .play-ornament::after {
          content: ''; height: 1px; background: #a88c66; flex: 1; opacity: .6;
        }
        .play-list {
          display: flex; flex-direction: column; gap: 12px;
        }
        .play-item {
          display: flex; align-items: center; gap: 14px;
          background: #f5e9d5d9;
          border: 1px solid #bfa58380;
          box-shadow: 2px 3px 0 #d8c3a17a, 0 4px 10px #71533210;
          border-radius: 14px 10px 13px 11px;
          padding: 16px 14px;
          cursor: pointer; text-align: left;
          transition: background 0.15s, transform 0.12s;
          position: relative;
        }
        .play-item::after {
          content: ''; position: absolute; inset: 3px;
          border: 1px solid #aa8a6428; border-radius: 11px 7px 10px 8px;
          pointer-events: none;
        }
        .play-item:active {
          background: #eddfc8d9;
          transform: scale(0.985);
        }
        .play-item-icon {
          width: 48px; height: 48px; flex-shrink: 0;
          background: #7D5A44;
          border-radius: 12px 9px 13px 10px;
          display: flex; align-items: center; justify-content: center;
          color: #f5ede2;
          box-shadow: 1px 2px 0 #5a3e2b50;
        }
        .play-item-body {
          flex: 1; display: flex; flex-direction: column; gap: 3px;
        }
        .play-item-title {
          font-size: 16px; color: #3d2b1a; font-weight: 500;
        }
        .play-item-sub {
          font-size: 12px; color: #8f775e;
        }
        .play-item-arrow {
          font-size: 22px; color: #b89a72; line-height: 1;
          margin-right: 2px;
        }
      `}</style>
    </div>
  );
}
