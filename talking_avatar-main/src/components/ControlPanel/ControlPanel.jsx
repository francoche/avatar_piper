import React from 'react';

const STYLES = {
  area: { position: 'absolute', bottom: '10px', left: '10px', zIndex: 500 },
  text: { margin: '0px', width: '300px', padding: '5px', background: 'none', color: '#ffffff', fontSize: '1.2em', border: 'none' },
  speak: { padding: '10px', marginTop: '5px', display: 'block', color: '#FFFFFF', background: '#222222', border: 'None' },
  area2: { position: 'absolute', top: '5px', right: '15px', zIndex: 500 },
  label: { color: '#777777', fontSize: '0.8em' }
};

export const ControlPanel = ({ avatarState, text, handleMicClick }) => {
  return (
    <div style={STYLES.area}>
      <div style={{ color: 'white', marginBottom: '10px', fontSize: '1.2em', minHeight: '1.5em' }}>
        {avatarState === 'listening' && "🎤 Escuchando..."}
        {avatarState === 'thinking' && "🧠 Pensando..."}
        {avatarState === 'talking' && "🗣️ Respondiendo..."}
        {avatarState === 'idle' && text}
      </div>

      <button
        onClick={handleMicClick}
        style={{
          ...STYLES.speak,
          backgroundColor: avatarState !== 'idle' ? '#555555' : '#222222',
          borderRadius: '50%',
          width: '60px',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5em',
          cursor: avatarState !== 'idle' ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.3s ease'
        }}
        disabled={avatarState !== 'idle'}
      >
        {avatarState !== 'idle' ? '⏳' : '🎤'}
      </button>
    </div>
  );
};
