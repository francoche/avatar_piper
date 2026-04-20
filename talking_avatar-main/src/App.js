import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useTexture, Loader, Environment, PerspectiveCamera, OrbitControls } from '@react-three/drei';
import ReactAudioPlayer from 'react-audio-player';
import axios from 'axios';

import { AVATAR_CONFIG } from './avatar/config';
import Avatar from './avatar/Avatar';

const API_BACKEND = AVATAR_CONFIG.api.backend;
const AZURE_HOST = AVATAR_CONFIG.api.backend;

async function makeAIResponse(userText) {
  try {
    const chatRes = await axios.post(`${API_BACKEND}/chat`, { prompt: userText });
    const aiReply = chatRes.data.reply;
    const speechRes = await axios.post(`${AZURE_HOST}/talk`, { text: aiReply });
    return { ...speechRes, aiReply };
  } catch (err) {
    console.error("Error en makeAIResponse:", err);
    throw err;
  }
}

const STYLES = {
  area: { position: 'absolute', bottom: '10px', left: '10px', zIndex: 500 },
  text: { margin: '0px', width: '300px', padding: '5px', background: 'none', color: '#ffffff', fontSize: '1.2em', border: 'none' },
  speak: { padding: '10px', marginTop: '5px', display: 'block', color: '#FFFFFF', background: '#222222', border: 'None' },
  area2: { position: 'absolute', top: '5px', right: '15px', zIndex: 500 },
  label: { color: '#777777', fontSize: '0.8em' }
}

function Bg() {
  const texture = useTexture('/images/bg.webp');
  return (
    <mesh position={[0, 1.0, -2]} scale={[5, 5, 1]}>
      <planeGeometry />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}

function App() {
  const audioPlayer = useRef();

  const [speak, setSpeak] = useState(false);
  const [text, setText] = useState("");
  const [audioSource, setAudioSource] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [animType, setAnimType] = useState('talking');
  const [hasGreeted, setHasGreeted] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const recognitionRef = useRef(null);
  const sessionTimeoutRef = useRef(null);
  const transcriptTimeoutRef = useRef(null); // Ref para el timeout de voz

  // [MEJORA] Mapeo de intención a animación más natural
  const animationMap = {
    saludo: "saludo",
    ubicacion: "ubicacion",
    info: "info",
    error: "error",
    duda: "thinking",
    afirmacion: "laughing",
    default: "talking"
  };

  // 🧠 ESTADOS DEL AVATAR (Máquina de Estados)
  let avatarState = 'idle';
  if (!hasGreeted) avatarState = 'saludo';
  else if (isListening) avatarState = 'idle'; // Redirigido a idle por requerimiento
  else if (speak && !playing) avatarState = 'thinking';
  else if (playing) avatarState = animType;

  // Log de transición de estados
  useEffect(() => {
    console.log(`[AVATAR] Estado: ${avatarState}`);
  }, [avatarState]);

  // Manejo del saludo inicial para que ocurra solo una vez
  useEffect(() => {
    if (!hasGreeted) {
      const t = setTimeout(() => {
        setHasGreeted(true);
      }, 3500); // 3.5 segundos para la animación del saludo
      return () => clearTimeout(t);
    }
  }, [hasGreeted]);

  // Watchdog de Sesión Activa
  const resetSession = () => {
    console.log('[SESSION] Reiniciando sesión por inactividad');
    setText('');
    setAudioSource(null);
    setSpeak(false);
    setPlaying(false);
    setAnimType('talking');
    setIsListening(false);
  };

  useEffect(() => {
    if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current);

    // Si no está interactuando pero hay texto en pantalla (ya contestó), iniciamos countdown
    if (avatarState === 'idle' && text !== '') {
      sessionTimeoutRef.current = setTimeout(() => {
        resetSession();
      }, 15000);
    }
  }, [avatarState, text]);

  const handleMicClick = () => {
    if (avatarState !== 'idle') return; // Bloqueo Interfaz Inteligente

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
    try {
      recognition.start();
    } catch (e) {
      console.error('[VOICE] No se pudo iniciar:', e);
      setIsListening(false);
    }
  };

  // Pipeline LLM + Servidor Local
  useEffect(() => {
    if (speak === false) return;

    // [MEJORA] Disimular latencia del backend (UX PRO)
    console.log('[AVATAR] Estado: thinking');
    console.log('[UX] Simulando procesamiento natural');

    const procesarReq = async () => {
      // Pequeño delay artificial para asentar el inicio del "pensamiento"
      await new Promise(res => setTimeout(res, 300));
      makeAIResponse(text)
        .then(response => {
          let { filename } = response.data;
          const fullPath = AZURE_HOST + filename;
          setAudioSource(fullPath);

          // [MEJORA] Coherencia animaciones (Mapping custom)
          const backendType = response.data.type || response.aiType || 'default';
          const selAnim = animationMap[backendType.toLowerCase()] || animationMap.default;
          setAnimType(selAnim);
          console.log(`[AVATAR] Animación seleccionada: ${selAnim}`);
        })
        .catch(err => {
          console.error("Error al procesar:", err);
          setSpeak(false);

          setErrorMsg("No pude conectarme al servidor. Intentá de nuevo.");
          setTimeout(() => setErrorMsg(null), 4000);
        });
    };

    procesarReq();
  }, [speak, text]);

  function playerEnded(e) {
    setAudioSource(null);
    setPlaying(false);
    setSpeak(false);
  }

  function playerReady(e) {
    // TAREA 5: Variación Temporal Humana
    // Retraso artificial del TTS para emular el arranque de voz 
    const randomPreSpeechDelay = Math.floor(Math.random() * (450 - 250 + 1)) + 250;

    setTimeout(() => {
      if (audioPlayer.current && audioPlayer.current.audioEl.current) {
        audioPlayer.current.audioEl.current.play();
        setPlaying(true);
      }
    }, randomPreSpeechDelay);
  }

  return (
    <>
      <div className="full">
        <div style={STYLES.area}>
          <div style={{ color: 'white', marginBottom: '10px', fontSize: '1.2em', minHeight: '1.5em' }}>
            {avatarState === 'listening' && "🎤 Escuchando..."}
            {avatarState === 'thinking' && "🧠 Pensando..."}
            {avatarState === 'talking' && "🗣️ Respondiendo..."}
            {avatarState === 'idle' && text}
          </div>

          {errorMsg && (
            <div style={{
              background: 'rgba(200, 50, 50, 0.85)',
              color: '#fff',
              padding: '8px 14px',
              borderRadius: '8px',
              marginBottom: '10px',
              fontSize: '0.95em'
            }}>
              {errorMsg}
            </div>
          )}

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

        <ReactAudioPlayer
          src={audioSource}
          ref={audioPlayer}
          onEnded={playerEnded}
          onCanPlayThrough={playerReady}
        />

        <Canvas dpr={2} onCreated={(ctx) => { ctx.gl.physicallyCorrectLights = true; }}>
          <PerspectiveCamera makeDefault fov={40} position={[0, 1.2, 4]} />
          <OrbitControls target={[0, 1.0, 0]} />
          <Suspense fallback={null}>
            <Environment background={false} files="/images/photo_studio_loft_hall_1k.hdr" />
          </Suspense>
          <Suspense fallback={null}>
            <Bg />
          </Suspense>
          <Suspense fallback={null}>
            <Avatar avatarState={avatarState} />
          </Suspense>
        </Canvas>
        <Loader dataInterpolation={(p) => `Loading...`} />
      </div>

      <div style={{
        position: 'absolute',
        top: '15px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        textAlign: 'center',
        color: '#ffffff',
        textShadow: '0 2px 8px rgba(0,0,0,0.7)'
      }}>
        <div style={{ fontSize: '1.4em', fontWeight: 'bold', letterSpacing: '2px' }}>Cyto</div>
        <div style={{ fontSize: '0.75em', opacity: 0.7, marginTop: '2px' }}>Asistente Virtual - LITEM</div>
      </div>
    </>
  );
}

export default App;
