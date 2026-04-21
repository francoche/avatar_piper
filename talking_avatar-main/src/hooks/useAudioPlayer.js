import { useRef } from 'react';
import { PRE_SPEECH_DELAY_MIN, PRE_SPEECH_DELAY_MAX } from '../utils/constants';

/**
 * Hook que maneja la reproducción de audio
 * @param {string} audioSource - URL del audio a reproducir
 * @param {function} onPlayStart - Callback cuando inicia la reproducción
 * @param {function} onPlayEnd - Callback cuando termina la reproducción
 * @returns {object} Ref del reproductor y funciones de control
 */
export function useAudioPlayer(audioSource, onPlayStart, onPlayEnd) {
  const audioPlayer = useRef();

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
        audioPlayer.current.audioEl.current.play();
        onPlayStart();
      }
    }, randomPreSpeechDelay);
  };

  return { audioPlayer, playerEnded, playerReady };
}
