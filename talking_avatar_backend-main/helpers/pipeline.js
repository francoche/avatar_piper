const { buscarFAQ } = require('./faq');
const { detectarIntencion } = require('./intencion');
const {
  buscarMateria,
  buscarTramite,
  buscarBeca,
  buscarLugar,
  formatearRespuesta
} = require('./parser');
const { askLlama } = require('./Ollama');
const { normalizar } = require('./normalizar');
const { hasCache, getCache, setCache } = require('./cache');

async function procesarMensaje(prompt) {
  const startTotal = performance.now();
  const promptNormalizado = normalizar(prompt);

  // Wrapper interno para registrar resultados de forma limpia
  const enviarRespuesta = (replyData, capa, tiempoCapa, intencionDetectada = null) => {
    const finalData = typeof replyData === 'string' ? { reply: replyData, type: 'fallback' } : replyData;

    setCache(promptNormalizado, finalData);
    
    console.log(`[API] Intención: ${intencionDetectada || 'ninguna'}`);
    console.log(`[API] Capa: ${capa} (${tiempoCapa || 0}ms)`);
    console.log(`[API] Tiempo total: ${(performance.now() - startTotal).toFixed(0)}ms`);
    console.log(`[API] Respuesta final: "${finalData.reply}" (Type: ${finalData.type})`);
    
    return finalData;
  };

  // ⚡ Cache
  if (hasCache(promptNormalizado)) {
    const tiempoCache = (performance.now() - startTotal).toFixed(0);
    const cachedData = getCache(promptNormalizado);
    console.log(`[API] Intención: cacheada`);
    console.log(`[API] Capa: Memoria Cache (${tiempoCache}ms)`);
    console.log(`[API] Tiempo total: ${tiempoCache}ms`);
    console.log(`[API] Respuesta final: "${cachedData.reply}" (Type: ${cachedData.type})`);
    return cachedData;
  }

  // 🟢 CAPA 1: FAQ
  const startFAQ = performance.now();
  const faq = buscarFAQ(prompt);
  if (faq) {
    const tiempo = (performance.now() - startFAQ).toFixed(0);
    return enviarRespuesta({ reply: faq, type: 'faq' }, 'FAQ', tiempo, 'faq');
  }

  // 🟢 CAPA 2: INTENCION
  const intencion = detectarIntencion(prompt);

  // 🟢 CAPA 3: PARSER JSON
  const startParser = performance.now();
  if (intencion === 'ubicacion' || intencion === 'contacto') {
    const lugar = buscarLugar(prompt);
    if (lugar) {
      const tiempo = (performance.now() - startParser).toFixed(0);
      return enviarRespuesta(formatearRespuesta(lugar), 'Parser', tiempo, intencion);
    }
  } else if (intencion === 'materia') {
    const materia = buscarMateria(prompt);
    if (materia) {
      const tiempo = (performance.now() - startParser).toFixed(0);
      return enviarRespuesta(formatearRespuesta(materia), 'Parser', tiempo, intencion);
    }
  } else if (intencion === 'tramite' || intencion === 'inscripcion') {
    const tramite = buscarTramite(prompt);
    if (tramite) {
      const tiempo = (performance.now() - startParser).toFixed(0);
      return enviarRespuesta(formatearRespuesta(tramite), 'Parser', tiempo, 'tramite');
    }
  } else if (intencion === 'becas') {
    const beca = buscarBeca(prompt);
    if (beca) {
      const tiempo = (performance.now() - startParser).toFixed(0);
      return enviarRespuesta(formatearRespuesta(beca), 'Parser', tiempo, intencion);
    }
  }

  // 🟢 CAPA 4: RESPUESTA DIRECTA
  if (intencion === 'opinion') {
    const reply = 'Soy un asistente informativo de la facultad.';
    return enviarRespuesta({ reply, type: 'opinion' }, 'Directa', null, intencion);
  }

  // 🔴 CAPA 5: IA CONTROLADA
  if (intencion === 'desconocido' && prompt.length > 50) {
    const startOllama = performance.now();
    try {
      const reply = await askLlama(prompt);
      const tiempo = (performance.now() - startOllama).toFixed(0);
      return enviarRespuesta({ reply, type: 'ia' }, 'IA', tiempo, intencion);
    } catch (e) {
      console.log(`[API] Fallo en la IA: ${e.message}. Cayendo a fallback seguro.`);
    }
  }

  // 🔵 FALLBACK INTELIGENTE
  const fallbackTemplates = [
    "No tengo esa información. Podés consultar en Alumnado.",
    "Esa información no está disponible. Te recomiendo consultar en Alumnado.",
    "No puedo ayudarte con eso justo ahora. Podés acercarte a Alumnado."
  ];
  const reply = fallbackTemplates[Math.floor(Math.random() * fallbackTemplates.length)];
  return enviarRespuesta({ reply, type: 'fallback' }, 'Fallback', null, intencion);
}

module.exports = { procesarMensaje };
