const { default: ollama } = require('ollama');

async function askLlama(promptUsuario) {
  const prompt = `
Responde en máximo 8 palabras.
Si no sabes recomendá consultar en "Alumnado".

Pregunta: ${promptUsuario}
Respuesta:
`;

  const response = await ollama.generate({
    model: 'llama3.2:1b',
    prompt,
    options: {
      num_predict: 20,
      temperature: 0.1,
      num_ctx: 128
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