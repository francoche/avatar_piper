import React, { useState, useEffect, useRef } from 'react';
import { Loader } from '@react-three/drei';
import ReactAudioPlayer from 'react-audio-player';

import { Canvas3D } from './components/Canvas3D/Canvas3D';
import { ControlPanel } from './components/ControlPanel/ControlPanel';

import { useAvatarState } from './hooks/useAvatarState';
import { useAudioRecognition } from './hooks/useAudioRecognition';
import { useAIResponse } from './hooks/useAIResponse';
import { useAudioPlayer } from './hooks/useAudioPlayer';

function App() {
  const [speak, setSpeak] = useState(false);
  const [text, setText] = useState(""); 
  const [audioSource, setAudioSource] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [animType, setAnimType] = useState('talking');
  const [hasGreeted, setHasGreeted] = useState(false);
  const [backendType, setBackendType] = useState('default'); // Nuevo estado para clarificaciones

  const sessionTimeoutRef = useRef(null);

  // Hook 1: Máquina de Estados
  const avatarState = useAvatarState(isListening, speak, playing, animType, hasGreeted);

  // Hook 2: STT y reconocimiento de voz
  const recognitionRef = useAudioRecognition(isListening, setIsListening, setText, setSpeak);

  // Hook 3: Petición a Backend (LLM + TTS)
  useAIResponse(speak, text, setAudioSource, setAnimType, setSpeak, setBackendType);

  // Hook 4: Reproducción de audio y sincro (Incluye reactivación por clarificación)
  const { audioPlayerRef, playerEnded, playerReady } = useAudioPlayer(
    setPlaying, setSpeak, setAudioSource, backendType, recognitionRef, avatarState
  );

  // Saludo inicial único
  useEffect(() => {
    if (!hasGreeted) {
      const t = setTimeout(() => {
        setHasGreeted(true);
      }, 3500); 
      return () => clearTimeout(t);
    }
  }, [hasGreeted]);

  // Watchdog de Sesión Activa
  useEffect(() => {
    if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current);
    
    if (avatarState === 'idle' && text !== '') {
       sessionTimeoutRef.current = setTimeout(() => {
          console.log('[SESSION] Reiniciando sesión por inactividad');
          setText('');
          setAudioSource(null);
          setSpeak(false);
          setPlaying(false);
          setAnimType('talking');
          setIsListening(false);
       }, 30000); // 30s de inactividad
    }
  }, [avatarState, text]);

  const handleMicClick = () => {
    if (avatarState !== 'idle') return; 

    setText("");
    setIsListening(true);
    if (recognitionRef.current) {
        recognitionRef.current.start();
    }
  };

  return (
    <div className="full" style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <ControlPanel 
        avatarState={avatarState} 
        text={text} 
        handleMicClick={handleMicClick} 
      />

      <ReactAudioPlayer
        src={audioSource}
        ref={audioPlayerRef}
        onEnded={playerEnded}
        onCanPlayThrough={playerReady}
      />

      <Canvas3D avatarState={avatarState} />
      
      <Loader dataInterpolation={(p) => `Loading...`} />
    </div>
  );
}

export default App;
