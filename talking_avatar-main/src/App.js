import React, { useEffect, useCallback } from 'react';
import ReactAudioPlayer from 'react-audio-player';

// Hooks
import { useAvatarState } from './hooks/useAvatarState';
import { useAudioRecognition } from './hooks/useAudioRecognition';
import { useAIResponse } from './hooks/useAIResponse';
import { useAudioPlayer } from './hooks/useAudioPlayer';

// Componentes
import ControlPanel from './components/ControlPanel/ControlPanel';
import Canvas3D from './components/Canvas3D/Canvas3D';

// Constantes
import { SESSION_TIMEOUT } from './utils/constants';

/**
 * Componente principal de la aplicación
 * Orquesta toda la lógica del avatar interactivo
 */
function App() {
  // Estados del avatar
  const {
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
  } = useAvatarState();

  // Reconocimiento de voz
  const { recognitionRef, startListening } = useAudioRecognition(
    setText,
    (isReady) => {
      if (isReady) {
        setIsListening(false);
        setSpeak(true);
      } else {
        setIsListening(false);
      }
    },
    isListening
  );

  // Estado del audio
  const [audioSource, setAudioSource] = React.useState(null);

  // Callbacks memoizados para evitar re-ejecuciones innecesarias
  const handleAudioReady = useCallback((audioPath) => {
    setAudioSource(audioPath);
    setSpeak(false); // ✅ Resetear speak para evitar duplicados
  }, [setSpeak]);

  const handleError = useCallback(() => {
    setSpeak(false);
  }, [setSpeak]);

  // Pipeline de IA
  useAIResponse(
    speak,
    text,
    handleAudioReady,
    setAnimType,
    handleError
  );

  // Reproductor de audio
  const { audioPlayer, playerEnded, playerReady } = useAudioPlayer(
    audioSource,
    () => setPlaying(true),
    () => {
      setAudioSource(null);
      setPlaying(false);
      setSpeak(false);
    }
  );

  // Watchdog de sesión (inactividad)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (avatarState === 'idle' && text !== '') {
        resetSession();
      }
    }, SESSION_TIMEOUT);

    return () => clearTimeout(timer);
  }, [avatarState, text, resetSession]);

  // Manejador de clic en micrófono
  const handleMicClick = () => {
    if (avatarState !== 'idle') return;

    setText("");
    setIsListening(true);
   
  };

  return (
    <div className="full">
      {/* Panel de control con botón de micrófono */}
      <ControlPanel
        avatarState={avatarState}
        statusText={text}
        onMicClick={handleMicClick}
      />

      {/* Reproductor de audio */}
      <ReactAudioPlayer
        src={audioSource}
        ref={audioPlayer}
        onEnded={playerEnded}
        onCanPlayThrough={playerReady}
      />

      {/* Canvas 3D con avatar */}
      <Canvas3D avatarState={avatarState} />
    </div>
  );
}

export default App;
