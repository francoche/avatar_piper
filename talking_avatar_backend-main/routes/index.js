var express = require('express');
var router = express.Router();
const { procesarMensaje } = require('../helpers/pipeline');
const { textToSpeech } = require('../helpers/tts');

// Test básico
router.get('/', (req, res) => {
  res.json({ msg: 'Backend funcionando 🚀' });
});

// Endpoint para chat
router.post('/chat', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt || prompt.trim() === '') {
    return res.status(400).json({ reply: 'Por favor, decime algo para que pueda ayudarte.', type: 'fallback' });
  }

  try {
    const result = await procesarMensaje(prompt);
    return res.json(result);
  } catch (err) {
    console.error('Error Crítico en /chat:', err);
    return res.status(500).json({ reply: 'Hubo un error interno. Acercate a Alumnado para consultar.', type: 'fallback' });
  }
});

// Endpoint para convertir texto a audio con Piper
router.post('/talk', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Falta el texto para hablar' });

  try {
    const result = await textToSpeech(text);
    res.json(result);
  } catch (err) {
    console.error('Error en /talk (Piper TTS):', err);
    res.status(500).json({ error: 'Error al generar el audio con Piper.' });
  }
});

module.exports = router;
