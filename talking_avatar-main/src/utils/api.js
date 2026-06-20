import axios from 'axios';
import { API_BACKEND, AZURE_HOST } from './constants';

/**
 * Realiza una solicitud al backend para obtener una respuesta de IA
 * y genera audio mediante TTS
 * @param {string} userText - Texto del usuario
 * @returns {Promise} Respuesta con audio y tipo
 */
export async function makeAIResponse(userText, sessionId) {
  try {
    const chatRes = await axios.post(`${API_BACKEND}/chat`, { prompt: userText, sessionId });
    const { reply, type, related, category } = chatRes.data;
    const speechRes = await axios.post(`${AZURE_HOST}/talk`, { text: reply });
    return { ...speechRes, aiReply: reply, type, related, category };
  } catch (err) {
    console.error("Error en makeAIResponse:", err);
    throw err;
  }
}
