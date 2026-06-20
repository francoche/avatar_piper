import { useRef } from 'react';
import { PRE_SPEECH_DELAY_MIN, PRE_SPEECH_DELAY_MAX } from '../utils/constants';

/**
 * Hook que maneja la reproducción de audio y el análisis de espectro (LipSync)
 * @param {string} audioSource - URL del audio a reproducir
 * @param {function} onPlayStart - Callback cuando inicia la reproducción
 * @param {function} onPlayEnd - Callback cuando termina la reproducción
 * @returns {object} Ref del reproductor y funciones de control
 */
export function useAudioPlayer(audioSource, onPlayStart, onPlayEnd) {
  const audioPlayer = useRef();
  const analyserRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceConnectedRef = useRef(false);

  const playerEnded = (e) => {
    onPlayEnd();
  };

  const playerReady = (e) => {
    // Retraso artificial del TTS para emular el arranque natural de voz
    const randomPreSpeechDelay = Math.floor(
      Math.random() * (PRE_SPEECH_DELAY_MAX - PRE_SPEECH_DELAY_MIN + 1)
    ) + PRE_SPEECH_DELAY_MIN;

    setTimeout(() => {
      if (audioPlayer.current?.audioEl?.current) {
        const audioElement = audioPlayer.current.audioEl.current;

        // Inicializar AudioContext y Analyser de manera diferida
        if (!audioContextRef.current) {
          try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            audioContextRef.current = new AudioContextClass();
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 64; // Bajo fftSize para mejor rendimiento y respuesta rápida
          } catch (err) {
            console.error('[AUDIO] Error al crear AudioContext:', err);
          }
        }

        // Conectar el elemento de audio al analizador una sola vez
        if (audioContextRef.current && analyserRef.current && !sourceConnectedRef.current) {
          try {
            const source = audioContextRef.current.createMediaElementSource(audioElement);
            source.connect(analyserRef.current);
            analyserRef.current.connect(audioContextRef.current.destination);
            sourceConnectedRef.current = true;
            console.log('[AUDIO] AnalyserNode conectado al elemento de audio.');
          } catch (err) {
            console.warn('[AUDIO] Error al conectar el media element source:', err);
          }
        }

        // Asegurar que el contexto no esté suspendido por el navegador
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume();
        }

        audioElement.play().catch(err => {
          console.warn('[AUDIO] Falló el inicio de reproducción:', err);
        });
        
        onPlayStart();
      }
    }, randomPreSpeechDelay);
  };

  return { audioPlayer, playerEnded, playerReady, analyserRef };
}
