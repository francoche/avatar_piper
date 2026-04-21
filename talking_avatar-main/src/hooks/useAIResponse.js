import { useEffect } from 'react';
import { makeAIResponse } from '../utils/api';
import { getAnimationForType } from '../utils/animationMap';
import { AZURE_HOST, AI_RESPONSE_DELAY } from '../utils/constants';

/**
 * Hook que maneja el pipeline de IA (LLM + Backend + TTS)
 * @param {boolean} speak - Si debe procesarse una solicitud
 * @param {string} text - Texto a procesar
 * @param {function} onAudioReady - Callback cuando hay audio disponible
 * @param {function} onAnimationType - Callback para actualizar tipo de animación
 * @param {function} onError - Callback para errores
 */
export function useAIResponse(speak, text, onAudioReady, onAnimationType, onError) {
  useEffect(() => {
    if (speak === false) return;

    console.log('[AVATAR] Estado: thinking');
    console.log('[UX] Simulando procesamiento natural');

    const procesarReq = async () => {
      try {
        // Pequeño delay artificial para UX más natural
        await new Promise(res => setTimeout(res, AI_RESPONSE_DELAY));

        const response = await makeAIResponse(text);
        let { filename } = response.data;
        const fullPath = AZURE_HOST + filename;
        onAudioReady(fullPath);

        // Coherencia animaciones (Mapping custom)
        const backendType = response.data.type || response.aiType || 'default';
        const selectedAnim = getAnimationForType(backendType).toLowerCase();  // ✅ Normalizar
        onAnimationType(selectedAnim);
        console.log(`[AVATAR] Animación seleccionada: ${selectedAnim}`);
      } catch (err) {
        console.error("Error al procesar:", err);
        onError();
      }
    };

    procesarReq();
  }, [speak, text, onAudioReady, onAnimationType, onError]);
}
