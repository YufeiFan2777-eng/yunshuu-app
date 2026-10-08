import React, { useState } from 'react';
import XinchaoView from './XinchaoView';
import XinchaoNianView from './XinchaoNianView';
import OmbreMemoryView from './OmbreMemoryView';
import DesireDetailView from './DesireDetailView';
import paperTex from '/paper-tex.jpg';

const ITEMS = [
  {
    key: 'xinchao',
    title: '身体状态',
    subtitle: '实时生理维度 · 每小时更新',
    icon: (
      <svg viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
        <circle cx="18" cy="18" r="13"/>
        <path d="M18 8 v4 M18 24 v4 M8 18 h4 M24 18 h4"/>
        <circle cx="18" cy="18" r="4" fill="currentColor" opacity=".25"/>
      </svg>
    ),
  },
  {
    key: 'xinchao-nian',
    title: '心潮',
    subtitle: '心潮念 · 意识流动',
    icon: (
      <svg viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
        <path d="M18 6 C10 6 6 12 6 18 C6 24 10 30 18 30 C26 30 30 24 30 18"/>
        <path d="M18 6 C22 10 26 14 30 18"/>
        <circle cx="18" cy="18" r="3" fill="currentColor" opacity=".3"/>
        <path d="M12 18 Q15 14 18 18 Q21 22 24 18" strokeWidth="1.2"/>
      </svg>
    ),
  },
  {
    key: 'desire',
    title: '欲望系统',
    subtitle: '驱动状态 · 念头池 · 决策层',
    icon: (
      <svg viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
        <path d="M18 8 Q22 6 26 10 Q30 14 26 18 Q22 22 18 28 Q14 22 10 18 Q6 14 10 10 Q14 6 18 8Z"/>
        <path d="M18 12 Q20 10 22 12 Q24 14 22 16 Q20 18 18 22 Q16 18 14 16 Q12 14 14 12 Q16 10 18 12Z" opacity=".35" fill="currentColor"/>
      </svg>
    ),
  },
  {
    key: 'memory',
    title: '记忆',
    subtitle: 'Ombre Brain · 长期记忆库',
    icon: (
      <svg viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
        <path d="M10 12 Q10 7 18 7 Q26 7 26 12 Q30 12 30 17 Q30 22 25 22 L11 22 Q6 22 6 17 Q6 12 10 12Z"/>
        <path d="M14 22 L14 29 M18 22 L18 29 M22 22 L22 29"/>
        <path d="M12 29 L24 29" strokeWidth="1.8"/>
      </svg>
    ),
  },
];

export default function HisView() {
  const [detail, setDetail] = useState(null);

  if (detail === 'xinchao') {
    return <XinchaoView onBack={() => setDetail(null)} />;
  }
  if (detail === 'xinchao-nian') {
    return <XinchaoNianView onBack={() => setDetail(null)} />;
  }
  if (detail === 'memory') {
    return <OmbreMemoryView onBack={() => setDetail(null)} />;
  }
  if (detail === 'desire') {
    return <DesireDetailView onBack={() => setDetail(null)} />;
  }


  return (
    <div className="his-wrap">
      <div className="his-page">
        <div className="his-header">
          <h2 className="his-title">His</h2>
          <div className="his-ornament">✦ 关于他的一切 ✦</div>
        </div>

        <div className="his-list">
          {ITEMS.map(item => (
            <button
              key={item.key}
              className="his-item"
              onClick={() => setDetail(item.key)}
            >
              <span className="his-item-icon">{item.icon}</span>
              <span className="his-item-body">
                <span className="his-item-title">{item.title}</span>
                <span className="his-item-sub">{item.subtitle}</span>
              </span>
              <span className="his-item-arrow">›</span>
            </button>
          ))}
        </div>
      </div>

      <style>{`
        .his-wrap {
          flex: 1; display: flex; flex-direction: column;
          overflow-y: auto; overflow-x: hidden;
          background: #e6d5b7 url('${paperTex}');
          background-size: 240px;
          color: #513b29;
          font-family: Georgia, 'Songti SC', 'Noto Serif SC', serif;
          scrollbar-width: thin; scrollbar-color: #b89970 transparent;
        }
        .his-page {
          max-width: 460px; margin: 0 auto; width: 100%;
          padding: 28px 16px 32px;
        }
        .his-header {
          text-align: center; margin-bottom: 28px;
        }
        .his-title {
          font: 400 clamp(28px,7vw,36px)/1.2 'Cormorant Garamond', Georgia, serif;
          letter-spacing: 2px; margin: 0 0 4px; color: #3d2b1a;
        }
        .his-ornament {
          font-size: 12px; letter-spacing: 1.5px; color: #b88578;
          display: flex; align-items: center; justify-content: center; gap: 10px;
        }
        .his-ornament::before, .his-ornament::after {
          content: ''; height: 1px; background: #a88c66; flex: 1; opacity: .6;
        }

        .his-list {
          display: flex; flex-direction: column; gap: 12px;
        }
        .his-item {
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
        .his-item::after {
          content: ''; position: absolute; inset: 3px;
          border: 1px solid #aa8a6428; border-radius: 11px 7px 10px 8px;
          pointer-events: none;
        }
        .his-item:active {
          background: #eddfc8d9;
          transform: scale(0.985);
        }
        .his-item-icon {
          width: 48px; height: 48px; flex-shrink: 0;
          background: #7D5A44;
          border-radius: 12px 9px 13px 10px;
          display: flex; align-items: center; justify-content: center;
          color: #f5ede2;
          box-shadow: 1px 2px 0 #5a3e2b50;
        }
        .his-item-body {
          flex: 1; display: flex; flex-direction: column; gap: 3px;
        }
        .his-item-title {
          font-size: 16px; color: #3d2b1a; font-weight: 500;
        }
        .his-item-sub {
          font-size: 12px; color: #8f775e;
        }
        .his-item-arrow {
          font-size: 22px; color: #b89a72; line-height: 1;
          margin-right: 2px;
        }
      `}</style>
    </div>
  );
}
