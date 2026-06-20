import React, { useEffect, useCallback, useState, useRef } from 'react';
import ReactAudioPlayer from 'react-audio-player';
import './App.css';

// Hooks
import { useAvatarState } from './hooks/useAvatarState';
import { useAIResponse } from './hooks/useAIResponse';
import { useAudioPlayer } from './hooks/useAudioPlayer';

// Componentes
import Canvas3D from './components/Canvas3D/Canvas3D';
import TouchUI from './components/TouchUI/TouchUI';

const SESSION_TIMEOUT_MS = 90000; // 90 segundos

const globalBackgroundStyle = {
  backgroundColor: '#0f172a',
  backgroundImage: "url('/images/fondoUader.png')",
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  backgroundAttachment: 'fixed'
};

function App() {
  const {
    avatarState,
    isListening,
    setIsListening,
    speak,
    setSpeak,
    setPlaying,
    text,
    setText,
    hasStarted,
    setHasStarted
  } = useAvatarState();

  const [sessionId, setSessionId] = useState('');
  const [audioSource, setAudioSource] = useState(null);
  const [hasError, setHasError] = useState(false);
  const [isIntro, setIsIntro] = useState(false);
  const [gestureCategory, setGestureCategory] = useState(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [currentReplyText, setCurrentReplyText] = useState("");

  const timeoutRef = useRef(null);

  const resetInactivityTimeout = useCallback((forceReset = false) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    if (forceReset) {
      console.log('[WATCHDOG] Inactividad detectada, reiniciando UI.');
      setSessionId(Math.random().toString(36).substring(2, 9));
      setText('');
      setSpeak(false);
      setPlaying(false);
      setAudioSource(null);
      setIsListening(false);
      setHasError(false);
      setIsIntro(false);
      return;
    }

    timeoutRef.current = setTimeout(() => {
      resetInactivityTimeout(true);
    }, SESSION_TIMEOUT_MS);
  }, [setText, setSpeak, setPlaying, setIsListening]);

  // Manejar el montaje inicial
  useEffect(() => {
    if (hasInteracted && !hasStarted) {
      setSessionId(Math.random().toString(36).substring(2, 9));
      setHasStarted(true);
      setIsIntro(true);
      setText('initgreeting');
      setSpeak(true);
    }
  }, [hasInteracted, hasStarted, setHasStarted, setText, setSpeak]);

  useEffect(() => {
    resetInactivityTimeout();
    return () => clearTimeout(timeoutRef.current);
  }, [avatarState, resetInactivityTimeout]);

  const handleAudioReady = useCallback((audioPath, category, replyText) => {
    setAudioSource(audioPath);
    setGestureCategory(category);
    setCurrentReplyText(replyText || "");
    setSpeak(false);
  }, [setSpeak]);

  const handleError = useCallback((err) => {
    console.error('[AVATAR] Error en flujo de respuesta o audio:', err);
    setAudioSource(null);
    setGestureCategory('fallback');
    setPlaying(false);
    setSpeak(false);
    setIsListening(false);
    setHasError(true);
  }, [setPlaying, setSpeak, setIsListening]);

  useAIResponse(
    speak,
    text,
    sessionId,
    handleAudioReady,
    handleError
  );

  const { audioPlayer, playerEnded, playerReady, analyserRef } = useAudioPlayer(
    audioSource,
    () => {
      setPlaying(true);
      resetInactivityTimeout();
    },
    () => {
      setAudioSource(null);
      setPlaying(false);
      setSpeak(false);
      if (isIntro) setIsIntro(false);
      resetInactivityTimeout();
    }
  );

  const handleAskQuestion = (qId) => {
    // Interrumpir intro o cualquier otra interacción previa
    setIsIntro(false);
    setAudioSource(null);
    setPlaying(false);
    if (audioPlayer.current && audioPlayer.current.audioEl.current) {
      audioPlayer.current.audioEl.current.pause();
    }
    setHasError(false);
    
    // 1. Estado: listening (800ms)
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      // 2. Estado: thinking (hasta que backend responda)
      setText(qId);
      setSpeak(true);
    }, 800);
  };

  const handleClearError = () => {
    setHasError(false);
    resetInactivityTimeout();
  };

  if (!hasInteracted) {
    return (
      <div className="start-screen" style={globalBackgroundStyle} onClick={() => setHasInteracted(true)}>
        <div className="start-container">
          <h1 className="start-title">CITO</h1>
          <p className="start-subtitle">Avatar Interactivo</p>
          <button className="start-button">Tocar para comenzar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="full" style={globalBackgroundStyle} onTouchStart={() => resetInactivityTimeout(false)} onMouseMove={() => resetInactivityTimeout(false)} onClick={() => resetInactivityTimeout(false)}>
      
      {/* DEBUG TEMPORAL - Ocultar en producción */}
      <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.8)', color: '#0f0', padding: '10px', zIndex: 9999, fontFamily: 'monospace', fontSize: '14px', borderRadius: '5px' }}>
        DEBUG AVATAR_STATE: {avatarState}
      </div>

      <TouchUI 
        key={sessionId} 
        avatarState={avatarState} 
        onAskQuestion={handleAskQuestion} 
        onResetTimeout={() => resetInactivityTimeout(false)}
        hasError={hasError}
        onClearError={handleClearError}
        isIntro={isIntro}
        currentReplyText={currentReplyText}
      />

      <ReactAudioPlayer
        src={audioSource}
        ref={audioPlayer}
        onEnded={playerEnded}
        onCanPlayThrough={playerReady}
        onError={handleError}
        crossOrigin="anonymous"
      />

      <Canvas3D avatarState={avatarState} analyserRef={analyserRef} gestureCategory={gestureCategory} />
    </div>
  );
}

export default App;
