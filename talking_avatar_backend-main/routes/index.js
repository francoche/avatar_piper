var express = require('express');
var router = express.Router();
const { askLlama } = require('../helpers/Ollama');
const { textToSpeech } = require('../helpers/tts');

const { buscarFAQ } = require('../helpers/faq');

const {
  buscarMateria,
  responderMateria,
  buscarTramite,
  responderTramite,
  responderFacultad
} = require('../helpers/parser');

// Test básico
router.get('/', (req, res) => {
  res.json({ msg: 'Backend funcionando 🚀' });
});

// Cache en memoria para preguntas
const cacheMemoria = new Map();

// Endpoint para Ollama (IA)
router.post('/chat', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Falta el prompt' });

  const { normalizar } = require('../helpers/normalizar');
  const startTotal = performance.now();
  const promptNormalizado = normalizar(prompt);

  // Wrapper para responder y loguear final
  const enviarRespuesta = (reply) => {
    cacheMemoria.set(promptNormalizado, reply);
    console.log(`[API] Tiempo total: ${(performance.now() - startTotal).toFixed(0)}ms`);
    console.log(`[API] Respuesta final: "${reply}"`);
    return res.json({ reply });
  };

  try {
    // Caché
    if (cacheMemoria.has(promptNormalizado)) {
      const tiempoCache = (performance.now() - startTotal).toFixed(0);
      console.log(`[API] ⚡ Respuesta desde Memoria Cache (${tiempoCache}ms)`);
      const reply = cacheMemoria.get(promptNormalizado);
      console.log(`[API] Respuesta final: "${reply}"`);
      return res.json({ reply });
    }

    // 🟢 CAPA 1: FAQ
    const startFAQ = performance.now();
    const faq = buscarFAQ(prompt);
    if (faq) {
      console.log(`[API] Intención detectada: general_faq`);
      console.log(`[API] Capa usada: FAQ (${(performance.now() - startFAQ).toFixed(0)}ms)`);
      return enviarRespuesta(faq);
    }

    // 🟢 CAPA 2: DETECCIÓN DE INTENCIÓN
    const { detectarIntencion } = require('../helpers/intencion');
    const intencion = detectarIntencion(prompt);
    console.log(`[API] Intención detectada: ${intencion}`);

    // 🟢 CAPA 3: PARSER JSON
    if (intencion === 'ubicacion' || intencion === 'contacto') {
      const startParser = performance.now();
      const facu = responderFacultad(prompt);
      if (facu) {
        console.log(`[API] Capa usada: Parser (${(performance.now() - startParser).toFixed(0)}ms)`);
        return enviarRespuesta(facu);
      }
    } else if (intencion === 'materia') {
      const startParser = performance.now();
      const materia = buscarMateria(prompt);
      if (materia) {
        const respMateria = responderMateria(materia);
        console.log(`[API] Capa usada: Parser (${(performance.now() - startParser).toFixed(0)}ms)`);
        return enviarRespuesta(respMateria);
      }
    } else if (intencion === 'tramite') {
      const startParser = performance.now();
      const tramite = buscarTramite(prompt);
      if (tramite) {
        const respTramite = responderTramite(tramite);
        console.log(`[API] Capa usada: Parser (${(performance.now() - startParser).toFixed(0)}ms)`);
        return enviarRespuesta(respTramite);
      }
    }

    // 🟢 CAPA 4: RESPUESTA DIRECTA
    if (intencion === 'opinion') {
      console.log(`[API] Capa usada: Directa`);
      const reply = 'Soy un asistente informativo de la facultad.';
      return enviarRespuesta(reply);
    }

    // 🔴 CAPA 5: IA CONTROLADA
    if (
      intencion === 'desconocido' &&
      prompt.length > 80
    ) {
      console.log('[API] Capa usada: IA');

      const startOllama = performance.now();
      const reply = await askLlama(prompt);

      console.log(`[API] Tiempo Ollama: ${(performance.now() - startOllama).toFixed(0)}ms`);
      return enviarRespuesta(reply);
    }

    // 🔵 FALLBACK INTELIGENTE
    console.log('[API] Capa usada: Fallback inteligente');

    const fallbackTemplates = [
      "No tengo esa información. Podés consultar en Bedelía.",
      "Esa información no está disponible. Te recomiendo Bedelía.",
      "No puedo ayudarte con eso justo ahora. Consultalo en Bedelía."
    ];
    const reply = fallbackTemplates[Math.floor(Math.random() * fallbackTemplates.length)];
    console.log('[MEJORA] Respuestas más naturales implementadas');

    return enviarRespuesta(reply);

  } catch (err) {
    console.error('Error en /chat:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// Endpoint para convertir texto a audio con Piper
router.post('/talk', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Falta el texto para hablar' });

  try {
    // textToSpeech ahora usa Piper.exe localmente
    const result = await textToSpeech(text);

    // Result ahora solo contiene { filename } (y ya no blendData si lo quitaste)
    res.json(result);

  } catch (err) {
    // CAMBIO AQUÍ: Ahora el log dirá Piper TTS para no confundirte
    console.error('Error en /talk (Piper TTS):', err);
    res.status(500).json({ error: 'Error al generar el audio con Piper.' });
  }
});

module.exports = router;
