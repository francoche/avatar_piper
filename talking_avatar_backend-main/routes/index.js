var express = require('express');
var router = express.Router();
const { askLlama } = require('../helpers/Ollama');
const { textToSpeech } = require('../helpers/tts');

// Test básico
router.get('/', (req, res) => {
  res.json({ msg: 'Backend funcionando 🚀' });
});

// Endpoint para Ollama (IA)
router.post('/chat', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Falta el prompt' });

  try {
    const reply = await askLlama(prompt);
    res.json({ reply });
  } catch (err) {
    console.error('Error en /chat (Ollama):', err);
    res.status(500).json({ error: 'Error en Ollama' });
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
