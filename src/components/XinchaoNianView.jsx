import React from 'react';
import paperTex from '/paper-tex.jpg';

export default function XinchaoNianView({ onBack }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      background: `#e6d5b7 url('${paperTex}')`,
      backgroundSize: '240px',
      overflow: 'hidden',
    }}>
      {/* 顶部返回栏 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px',
        paddingTop: 'max(10px, env(safe-area-inset-top))',
        background: 'rgba(230,213,183,0.92)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px dashed #bda587',
        flexShrink: 0,
        zIndex: 10,
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 22, color: '#7D5A44', lineHeight: 1, padding: '2px 6px',
          }}
        >‹</button>
        <span style={{
          fontFamily: "Cormorant Garamond, Georgia, serif",
          fontSize: 18, color: '#3d2b1a', letterSpacing: 1,
        }}>心潮</span>
      </div>

      {/* 心潮念 iframe */}
      <iframe
        src="https://xinchao.yunshuyf.com"
        style={{
          flex: 1, border: 'none', width: '100%',
          background: 'transparent',
        }}
        title="心潮念"
      />
    </div>
  );
}
