import { useRef } from 'react';

export const useAudioPlayer = (setPlaying, setSpeak, setAudioSource, backendType, recognitionRef, avatarState) => {
  const audioPlayerRef = useRef(null);

  const playerEnded = () => {
    setAudioSource(null);
    setPlaying(false);
    setSpeak(false);

    // [CLARIFICACION] Reactivación automática del micrófono
    if (backendType === 'clarificacion' && recognitionRef.current) {
        console.log('[CLARIFICACION] Reactivando micrófono automáticamente...');
        setTimeout(() => {
            recognitionRef.current.start();
        }, 500); // Pequeño delay para evitar ecos del audio saliente
    }
  };

  const playerReady = () => {
    const randomPreSpeechDelay = Math.floor(Math.random() * (450 - 250 + 1)) + 250;
    
    setTimeout(() => {
      if (audioPlayerRef.current && audioPlayerRef.current.audioEl.current) {
          audioPlayerRef.current.audioEl.current.play().catch(e => console.error("Error reproduciendo audio:", e));
          setPlaying(true);
      }
    }, randomPreSpeechDelay);
  };

  return { audioPlayerRef, playerEnded, playerReady };
};
