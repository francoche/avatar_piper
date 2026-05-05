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
const ctxResolver = require('./contextResolver');

async function procesarMensaje(prompt) {
  const startTotal = performance.now();
  const promptNormalizado = normalizar(prompt);

  // Wrapper interno para registrar resultados de forma limpia
  const enviarRespuesta = (replyData, capa, tiempoCapa, intencionDetectada = null, bypassCache = false) => {
    const finalData = typeof replyData === 'string' ? { reply: replyData, type: 'fallback' } : replyData;

    if (!bypassCache) {
      setCache(promptNormalizado, finalData);
    } else {
      console.log('[API] Bypass Cache activado');
    }

    console.log(`[API] Intención: ${intencionDetectada || 'ninguna'}`);
    console.log(`[API] Capa: ${capa} (${tiempoCapa || 0}ms)`);
    console.log(`[API] Tiempo total: ${(performance.now() - startTotal).toFixed(0)}ms`);
    console.log(`[API] Respuesta final: "${finalData.reply}" (Type: ${finalData.type})`);

    return finalData;
  };

  // 🟢 CAPA 0: REANUDACIÓN Y CLARIFICACIÓN
  const contexto = ctxResolver.getContexto();
  if (contexto) {
    if (ctxResolver.contextoExpirado()) {
      console.log('[CTX] Contexto expirado');
      ctxResolver.limpiarContexto();
    } else {
      console.log('[CTX] Intentando resolver ambigüedad...');
      const ctxTemp = { ...contexto };
      const resolucion = ctxResolver.resolverAmbiguedad(promptNormalizado);

      if (resolucion.accion === 'cancelada') {
        ctxResolver.limpiarContexto();
        return enviarRespuesta({ reply: "Entendido.", type: "fallback" }, 'Aclaracion', 0, ctxTemp.intencion, true);
      }

      if (resolucion.accion === 'resuelta') {
        ctxResolver.limpiarContexto();
        console.log('[CTX] Resolución exitosa');
        return enviarRespuesta(formatearRespuesta(resolucion.opcion), 'Clarificacion', 0, ctxTemp.tipoEntidad, true);
      }

      if (resolucion.accion === 'repreguntar') {
        if (contexto.reintentos === 0) {
          contexto.reintentos = 1;
          return enviarRespuesta({ reply: "Necesito que me digas cuál opción querés.", type: "clarificacion" }, 'Aclaracion-Repregunta', 0, ctxTemp.intencion, true);
        } else {
          console.log('[CTX] Resolución fallida');
          ctxResolver.limpiarContexto();
          // Cae a flujo normal -> IA
        }
      }
    }
  }

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
  let intencion = detectarIntencion(prompt);

  // 🟢 CAPA 3: PARSER JSON
  const startParser = performance.now();
  let parserFailReason = null;
  let resParser = null;
  let parserIntencionStr = intencion;

  if (intencion === 'ubicacion' || intencion === 'contacto') {
    resParser = buscarLugar(prompt);
    if (!resParser.ganadora && resParser.multiples.length === 0) parserFailReason = 'lugar_no_encontrado';
  } else if (intencion === 'materia') {
    resParser = buscarMateria(prompt);
    if (!resParser.ganadora && resParser.multiples.length === 0) parserFailReason = 'materia_no_encontrada';
  } else if (intencion === 'tramite' || intencion === 'inscripcion') {
    resParser = buscarTramite(prompt);
    if (!resParser.ganadora && resParser.multiples.length === 0) parserFailReason = 'tramite_sin_match';
    parserIntencionStr = 'tramite'; // Normalizar intencion string
  } else if (intencion === 'becas') {
    resParser = buscarBeca(prompt);
    if (!resParser.ganadora && resParser.multiples.length === 0) parserFailReason = 'beca_no_encontrada';
  } else if (intencion === 'desconocido') {
    console.log('[PIPELINE] Intentando bypass semántico...');
    const resPrueba = buscarMateria(prompt);

    if (resPrueba.ganadora || resPrueba.multiples.length > 0) {
      console.log('[PIPELINE] Bypass exitoso -> materia detectada');
      resParser = resPrueba;
      parserIntencionStr = 'materia';
      intencion = 'materia';
    } else {
      console.log('[PIPELINE] Bypass sin resultados');
      parserFailReason = 'desconocido_absoluto';
    }
  }

  // Evaluar Resultados del Parser (si se corrió alguno)
  if (resParser) {
    const tiempo = (performance.now() - startParser).toFixed(0);

    if (resParser.ganadora) {
      if (resParser.confidence >= 0) { // log solo para nosotros
        console.log(`[CTX] Confidence: ${resParser.confidence.toFixed(2)}`);
      }
      return enviarRespuesta(formatearRespuesta(resParser.ganadora), 'Parser', tiempo, parserIntencionStr);
    }

    if (resParser.multiples.length > 0) {
      console.log(`[CTX] Ambigüedad detectada`);
      console.log(`[CTX] Confidence: ${resParser.confidence.toFixed(2)}`);
      const nombres = resParser.multiples.map(m => m.nombre);
      const strOpciones = ctxResolver.formatearOpciones(nombres);

      ctxResolver.crearContexto('ambig_entidad', parserIntencionStr, intencion, resParser.multiples, prompt);

      const replyClarif = { reply: `Tengo información de varias opciones. ¿Te referís a ${strOpciones}?`, type: 'clarificacion' };
      return enviarRespuesta(replyClarif, 'Contexto', tiempo, parserIntencionStr, true);
    }

    console.log(`[API] Parser sin resultado: ${parserFailReason}`);
  }

  // 🟢 CAPA 4: RESPUESTA DIRECTA
  if (intencion === 'opinion') {
    const reply = 'Soy un asistente informativo de la facultad.';
    return enviarRespuesta({ reply, type: 'opinion' }, 'Directa', null, intencion);
  }

  // 🔴 CAPA 5: IA CONTROLADA (Recuperación y Desconocido)
  if (intencion === 'desconocido' || parserFailReason) {
    console.log(`[API] Derivando a IA contextual...`);
    const startOllama = performance.now();
    try {
      const contexto = {
        intencion,
        fallo: parserFailReason
      };

      const reply = await askLlama(prompt, contexto);

      if (!reply || reply.trim() === '') {
        throw new Error('IA devolvio respuesta vacia');
      }

      const tiempo = (performance.now() - startOllama).toFixed(0);
      console.log(`[API] IA usada como recuperación`);
      return enviarRespuesta({ reply, type: 'ia' }, 'IA', tiempo, intencion, true); // BYPASS CACHE
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
