import { useState, useMemo, useCallback } from 'react';

export function useAvatarState() {
  // 1. Estados independientes requeridos por tu App.jsx
  const [isListening, setIsListening] = useState(false);
  const [speak, setSpeak] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [animType, setAnimType] = useState('idle');  // ✅ Minúscula para coincidir con config.js
  const [text, setText] = useState('');

  // 2. Estado Derivado Inteligente 
  // En lugar de cambiar un string manualmente, React calcula en qué estado 
  // está el avatar leyendo tus booleanos en tiempo real.
  const avatarState = useMemo(() => {
    if (isListening) return 'listening';
    
    // Si 'speak' es true pero aún no 'playing', significa que la IA está pensando/generando
    if (speak && !playing) return 'thinking';
    
    // Si está reproduciendo audio, devuelve la animación normalizada
    if (playing) return (animType || 'idle').toLowerCase();
    
    // Si no pasa nada de lo anterior, está en reposo
    return 'idle'; 
  }, [isListening, speak, playing, animType]);

  // 3. Función de reinicio de sesión (Watchdog)
  const resetSession = useCallback(() => {
    setIsListening(false);
    setSpeak(false);
    setPlaying(false);
    setAnimType('idle'); 
    setText('');
    console.log('[STATE] Sesión reiniciada por inactividad.');
  }, []);

  // 4. Retornamos exactamente lo que destrutura tu App.jsx
  return {
    avatarState,
    isListening,
    setIsListening,
    speak,
    setSpeak,
    playing,
    setPlaying,
    animType,
    setAnimType,
    text,
    setText,
    resetSession,
  };
}