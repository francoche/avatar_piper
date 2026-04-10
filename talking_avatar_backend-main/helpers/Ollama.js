const { default: ollama } = require('ollama');

async function askLlama(promptUsuario) {
  const prompt = `
Responde en máximo 8 palabras.
Si no sabes: "Bedelía".

Pregunta: ${promptUsuario}
Respuesta:
`;

  const response = await ollama.generate({
    model: 'llama3.2:1b',
    prompt,
    options: {
      num_predict: 10,
      temperature: 0.1,
      num_ctx: 256
    }
  });

  let respuestaFinal = response.response.trim();
  
  // Hard cap para acelerar TTS y evitar alucinaciones largas
  if (respuestaFinal.length > 120) {
      respuestaFinal = respuestaFinal.substring(0, 117).trim() + "...";
  }

  return respuestaFinal;
}

module.exports = { askLlama };