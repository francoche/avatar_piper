const { default: ollama } = require('ollama');
const fs = require('fs');
const path = require('path');

// 1. Cargamos el JSON de la facultad una sola vez al iniciar
const rawData = fs.readFileSync(path.join(__dirname, 'facultad_db.json'), 'utf8');
const facultadInfo = JSON.parse(rawData);

async function askLlama(promptUsuario) {
    try {
        // 2. Construimos un "Prompt Maestro" que incluye el JSON y la pregunta
        const fullPrompt = `
            Eres el asistente virtual de la facultad. 
            Tu fuente de datos es el siguiente JSON:
            ${JSON.stringify(facultadInfo, null, 2)}

            Instrucciones:
            - Usa SOLO la información del JSON para responder.
            - Si la información no está , di que consulten en Bedelía.
            - Responde de forma concisa y amable.

            Pregunta del alumno: ${promptUsuario}
            Respuesta:
        `;

        // 3. Usamos .generate para una respuesta única y rápida
        const response = await ollama.generate({
            model: 'llama3.2:1b', 
            prompt: fullPrompt,
        });

        return response.response;

    } catch (err) {
        console.error('Error llamando a Ollama:', err);
        throw err;
    }
}

module.exports = { askLlama };