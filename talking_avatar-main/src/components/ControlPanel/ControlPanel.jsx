import React from 'react';
import { CONTROL_STYLES } from './styles';

/**
 * Componente de panel de control con botón de micrófono
 */
export function ControlPanel({
  avatarState,
  statusText,
  onMicClick,
})  {
  const isDisabled = avatarState !== 'idle';

  return (
    <div style={CONTROL_STYLES.area}>
      <div style={CONTROL_STYLES.statusText}>
        {avatarState === 'listening' && "🎤 Escuchando..."}
        {avatarState === 'thinking' && "🧠 Pensando..."}
        {avatarState === 'talking' && "🗣️ Respondiendo..."}
       
        {avatarState === 'idle' && statusText}
      </div>

      <button
        onClick={onMicClick}
        style={{
          ...CONTROL_STYLES.micButton,
          ...(isDisabled
            ? CONTROL_STYLES.micButtonDisabled
            : CONTROL_STYLES.micButtonEnabled),
        }}
        disabled={isDisabled}
      >
        {isDisabled ? '⏳' : '🎤'}
      </button>
    </div>
  );
}

export default ControlPanel;
