import { useState, useMemo, useCallback } from 'react';

export function useAvatarState() {
  const [isListening, setIsListening] = useState(false);
  const [speak, setSpeak] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [text, setText] = useState('');
  const [hasStarted, setHasStarted] = useState(false);

  const avatarState = useMemo(() => {
    if (!hasStarted) return 'idle';
    if (isListening) return 'listening';
    if (speak && !playing) return 'thinking';
    if (playing) return 'talking';
    return 'idle'; 
  }, [hasStarted, isListening, speak, playing]);

  const resetSession = useCallback(() => {
    setIsListening(false);
    setSpeak(false);
    setPlaying(false);
    setText('');
    setHasStarted(false);
  }, []);

  return {
    avatarState,
    isListening,
    setIsListening,
    speak,
    setSpeak,
    playing,
    setPlaying,
    text,
    setText,
    hasStarted,
    setHasStarted,
    resetSession,
  };
}