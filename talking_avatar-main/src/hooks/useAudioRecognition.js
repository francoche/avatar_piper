import { useEffect, useRef } from 'react';
import {
  AUDIO_RECOGNITION_CONFIG,
  TRANSCRIPT_MIN_WORDS,
  TRANSCRIPT_MIN_LENGTH,
  TRANSCRIPT_CONFIRMATION_DELAY,
  SHORT_INPUT_DELAY,
} from '../utils/constants';

export function useAudioRecognition(onTranscript, onTranscriptReady, isListening) {
  const recognitionRef = useRef(null);
  const transcriptTimeoutRef = useRef(null);

  // 1. REFERENCIA DE CALLBACKS (Evita Stale Closures y re-renders infinitos)
  const callbacks = useRef({ onTranscript, onTranscriptReady });
  useEffect(() => {
    callbacks.current = { onTranscript, onTranscriptReady };
  }, [onTranscript, onTranscriptReady]);

  // 2. INICIALIZACIÓN ÚNICA DEL MICRÓFONO
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('[VOICE] Tu navegador no soporta SpeechRecognition.');
      return;
    }

    const recognition = new SpeechRecognition();
    Object.assign(recognition, AUDIO_RECOGNITION_CONFIG);
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      console.log('[VOICE] Escuchando...');
    };

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }

      const cleanTranscript = transcript.trim().toLowerCase().replace(/\s+/g, ' ');
      console.log(`[VOICE] Parcial: "${cleanTranscript}"`);

      // Limpiamos el timeout anterior si el usuario sigue hablando
      if (transcriptTimeoutRef.current) {
        clearTimeout(transcriptTimeoutRef.current);
      }

      callbacks.current.onTranscript(cleanTranscript);

      // Filtro de calidad
      const words = cleanTranscript.split(' ').filter(w => w.length > 0);
      if (words.length < TRANSCRIPT_MIN_WORDS || cleanTranscript.length < TRANSCRIPT_MIN_LENGTH) {
        console.log('[VOICE] Texto muy corto, esperando más input...');
        // Sugerencia: Puedes mover este 1000 a constants.js (ej: SHORT_INPUT_DELAY)
        transcriptTimeoutRef.current = setTimeout(() => {
          callbacks.current.onTranscriptReady(false);
        }, SHORT_INPUT_DELAY); 
        return;
      }

      console.log('[VOICE] Esperando confirmación de silencio...');
      callbacks.current.onTranscript(`🧠 Procesando lo que dijiste...`);

      transcriptTimeoutRef.current = setTimeout(() => {
        console.log(`[VOICE] Final enviado: "${cleanTranscript}"`);
        callbacks.current.onTranscript(cleanTranscript);
        callbacks.current.onTranscriptReady(true);
      }, TRANSCRIPT_CONFIRMATION_DELAY);
    };

    recognition.onerror = (event) => {
      // Ignoramos el error "no-speech", es el comportamiento normal de la API cuando hay silencio
      if (event.error !== 'no-speech') {
        console.error("[VOICE] Error de voz:", event.error);
      }
      callbacks.current.onTranscriptReady(false);
    };

    recognition.onend = () => {
      console.log('[VOICE] Micrófono en pausa (onend).');
      // La API de Web Speech se apaga sola tras unos segundos de silencio.
      // Si nuestro estado padre dice que deberíamos seguir escuchando, lo reiniciamos.
      if (callbacks.current.isListeningInternal) {
         try { recognition.start(); } catch(e) {}
      }
    };

    // LIMPIEZA CRÍTICA: Apagar el mic al desmontar el componente
    return () => {
      if (transcriptTimeoutRef.current) clearTimeout(transcriptTimeoutRef.current);
      recognition.abort();
    };
  }, []); // <-- Array vacío: el motor se instancia UNA SOLA VEZ.

  // 3. REACTIVIDAD: El hook obedece al estado 'isListening'
  useEffect(() => {
    // Guardamos el estado para que el evento onend sepa si debe reiniciarse
    callbacks.current.isListeningInternal = isListening; 
    
    if (!recognitionRef.current) return;

    if (isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        // Previene el crasheo clásico "recognition has already started"
        console.warn('[VOICE] El reconocimiento ya estaba iniciado.');
      }
    } else {
      recognitionRef.current.stop();
      if (transcriptTimeoutRef.current) {
        clearTimeout(transcriptTimeoutRef.current);
      }
    }
  }, [isListening]);

  // Ya no necesitas exportar startListening, el mic se activa solo al cambiar isListening a true
  return { recognitionRef }; 
}