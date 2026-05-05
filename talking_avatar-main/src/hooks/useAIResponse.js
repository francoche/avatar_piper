import { useEffect } from 'react';
import { makeAIResponse } from '../utils/api';
import { animationMap } from '../utils/animationMap';
import { AVATAR_CONFIG } from '../avatar/config';

const AZURE_HOST = AVATAR_CONFIG.api.backend;

export const useAIResponse = (speak, text, setAudioSource, setAnimType, setSpeak, setBackendType) => {
  useEffect(() => {
    if (speak === false) return;

    console.log('[AVATAR] Estado: thinking');
    console.log('[UX] Simulando procesamiento natural');

    const procesarReq = async () => {
      await new Promise(res => setTimeout(res, 300));
      makeAIResponse(text)
        .then(response => {
          let { filename, type } = response;
          const fullPath = AZURE_HOST + filename;
          setAudioSource(fullPath);
          
          const backendType = type || 'default';
          if (setBackendType) setBackendType(backendType.toLowerCase()); // Guardamos el type para lógica de clarificación

          const selAnim = animationMap[backendType.toLowerCase()] || animationMap.default;
          setAnimType(selAnim);
          console.log(`[AVATAR] Animación seleccionada: ${selAnim} (Intención: ${backendType})`);
        })
        .catch(err => {
          console.error("Error al procesar:", err);
          setSpeak(false);
        });
    };
    
    procesarReq();
  }, [speak, text, setAudioSource, setAnimType, setSpeak, setBackendType]);
};
