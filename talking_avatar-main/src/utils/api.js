import axios from 'axios';
import { AVATAR_CONFIG } from '../avatar/config';

const API_BACKEND = AVATAR_CONFIG.api.backend;

export const makeAIResponse = async (userText) => {
  try {
    const chatRes = await axios.post(`${API_BACKEND}/chat`, { prompt: userText });
    const aiReply = chatRes.data.reply;
    const type = chatRes.data.type || 'default';
    
    const speechRes = await axios.post(`${API_BACKEND}/talk`, { text: aiReply });
    
    // Retornamos también el type que se perdía en la versión anterior
    return { 
      ...speechRes.data, 
      aiReply,
      type 
    };
  } catch (err) {
    console.error("Error en makeAIResponse:", err);
    throw err;
  }
};
