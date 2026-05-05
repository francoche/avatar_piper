const { default: ollama } = require('ollama');

async function askLlama(promptUsuario, contexto = {}) {
  let guionContexto = '';
  
  if (contexto.fallo) {
    guionContexto = `El usuario tiene una intención de "${contexto.intencion}", pero nuestro sistema falló al buscar esa información (${contexto.fallo}). Decile amablemente que consulte en Alumnado sobre eso.`;
  }

  const prompt = `
Contexto: Sos un asistente universitario.
Reglas: 
1. Responde en máximo 2 frases, muy corto (menos de 120 caracteres si es posible).
2. No inventes datos académicos, materias ni fechas.
3. Si no sabes la respuesta o es muy específica, derivá amablemente a la oficina de "Alumnado".
4. Mantené un tono humano y servicial.
${guionContexto}

Pregunta del usuario: ${promptUsuario}
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