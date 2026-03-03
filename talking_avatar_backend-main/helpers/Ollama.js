const { default: ollama } = require('ollama'); // <--- ¡Importación corregida!

// Define una variable para mantener la historia de la conversación
const conversationHistory = [];

async function askLlama(prompt) {
    try {
        // 1. Agrega el nuevo mensaje del usuario al historial
        conversationHistory.push({ role: 'user', content: prompt });
        
        // 2. Llama a ollama.chat con TODO el historial
        const response = await ollama.chat({
            model: 'llama3.2:3b',
            messages: conversationHistory, // <--- Se pasa todo el array
        });

        // 3. Obtiene la respuesta del asistente
        const assistantResponse = response.message.content;
        
        // 4. Agrega la respuesta del asistente al historial
        conversationHistory.push({ role: 'assistant', content: assistantResponse });

        return assistantResponse;
    } catch (err) {
        console.error('Error llamando a Ollama:', err);
        // Si hay un error, considera revertir el último mensaje del usuario para limpiar el estado
        conversationHistory.pop(); 
        throw err;
    }
}

// Para que el ejemplo funcione como un módulo de Node.js
module.exports = { askLlama, conversationHistory };
