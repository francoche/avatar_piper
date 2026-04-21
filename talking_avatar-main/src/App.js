import React, { useEffect } from 'react';
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

  // Pipeline de IA
  useAIResponse(
    speak,
    text,
    (audioPath) => setAudioSource(audioPath),
    setAnimType,
    () => setSpeak(false)
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

    // recrear instancia limpia para evitar error 'network' en reuso
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => console.log('[VOICE] Escuchando...');

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      const cleanTranscript = transcript.trim().toLowerCase().replace(/\s+/g, ' ');
      console.log(`[VOICE] Parcial: "${cleanTranscript}"`);
      setText(cleanTranscript);

      if (transcriptTimeoutRef.current) {
        clearTimeout(transcriptTimeoutRef.current);
      }

      const words = cleanTranscript.split(' ').filter(w => w.length > 0);
      if (words.length < 3 || cleanTranscript.length < 10) {
        console.log('[VOICE] Texto muy corto, esperando más input...');
        transcriptTimeoutRef.current = setTimeout(() => {
          setIsListening(false);
        }, 1000);
        return;
      }

      console.log('[VOICE] Esperando confirmación de silencio...');
      setText(`🧠 Procesando lo que dijiste...`);

      transcriptTimeoutRef.current = setTimeout(() => {
        console.log(`[VOICE] Final enviado: "${cleanTranscript}"`);
        setText(cleanTranscript);
        setIsListening(false);
        setSpeak(true);
      }, 1000);
    };

    recognition.onerror = (event) => {
      console.error("Error de voz:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      console.log('[VOICE] Micrófono en pausa (onend).');
    };

    recognitionRef.onend = () => console.log('[VOICE] Microfono en pausa (onend)');
    recognition.current = recognition;

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
