import { useEffect } from 'react';
import { makeAIResponse } from '../utils/api';

export function useAIResponse(speak, text, sessionId, onAudioReady, onError) {
  useEffect(() => {
    if (speak === false) return;

    console.log('[AVATAR] Estado: thinking');

    const procesarReq = async () => {
      try {
        const responsePromise = makeAIResponse(text, sessionId);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout de respuesta del servidor')), 15000) // Timeout extendido para TTS largo
        );

        const response = await Promise.race([responsePromise, timeoutPromise]);
        let { filename } = response.data;
        // Construct full path using same host as original
        const fullPath = 'http://localhost:5000' + filename; 
        onAudioReady(fullPath, response.category);
      } catch (err) {
        console.error("[AVATAR] Error o Timeout detectado:", err.message);
        onError(err);
      }
    };

    procesarReq();
  }, [speak, text, sessionId, onAudioReady, onError]);
}
