const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../../data');
const kbPath = path.join(dataDir, 'knowledge_base.json');

// Cargar base de conocimiento
let knowledgeBase = [];

try {
  if (fs.existsSync(kbPath)) {
    const rawData = fs.readFileSync(kbPath, 'utf8');
    knowledgeBase = JSON.parse(rawData);
    console.log('[PIPELINE] Base de conocimiento cargada con éxito. Total preguntas:', knowledgeBase.length);
  } else {
    console.warn('[PIPELINE] ADVERTENCIA: knowledge_base.json no existe. El sistema iniciará en modo seguro vacío.');
  }
} catch (e) {
  console.error('[PIPELINE] ERROR CRÍTICO al parsear knowledge_base.json. Verifica la sintaxis JSON. Detalle:', e.message);
  // knowledgeBase se mantiene como [] para evitar crashear el servidor
}

// Variables de entorno o fallbacks estáticos para robustez
const FALLBACK_ERROR_JSON = "Disculpame, estoy teniendo problemas técnicos para leer mi base de datos. Por favor, avísale a un administrador.";
const FALLBACK_NOT_FOUND = "Disculpame, no encontré una respuesta válida para esa consulta en mi base de conocimiento táctil.";
const FALLBACK_EMPTY_ANSWERS = "Parece que hay un problema con esa pregunta. Faltan las respuestas asociadas en mi sistema.";

async function procesarMensaje(prompt, sessionId = 'default-session') {
  const startTotal = performance.now();
  let responseText = '';
  let responseType = 'default';
  let relatedQuestions = [];
  let category = '';

  // Fallback si el JSON estaba roto o no cargó
  if (knowledgeBase.length === 0) {
    responseText = FALLBACK_ERROR_JSON;
    responseType = 'error_sintaxis_json';
  } else {
    // 1. Buscar en la base de conocimiento por ID o por texto exacto de la pregunta
    const entry = knowledgeBase.find(q => q.id === prompt || q.question === prompt);

    if (entry) {
      // 2. Verificar si tiene respuestas válidas
      if (entry.answers && Array.isArray(entry.answers) && entry.answers.length > 0) {
        // Seleccionar aleatoria
        responseText = entry.answers[Math.floor(Math.random() * entry.answers.length)];
        responseType = entry.id;
        
        // Adjuntar preguntas relacionadas si existen (pueden usarse en el frontend futuro)
        if (entry.related_questions && Array.isArray(entry.related_questions)) {
           relatedQuestions = entry.related_questions;
        }
        category = entry.category || '';
      } else {
        // Encontramos la pregunta pero no tiene respuestas (error de data entry)
        responseText = FALLBACK_EMPTY_ANSWERS;
        responseType = 'error_respuestas_vacias';
      }
    } else {
      // 3. Manejo de saludos iniciales o comandos hardcodeados del sistema
      if (prompt === 'initgreeting' || prompt === 'hola' || prompt === 'buenas' || prompt === '__init_greeting__') {
         const saludoEntry = knowledgeBase.find(q => q.id === 'cito_1');
         if (saludoEntry && saludoEntry.answers && saludoEntry.answers.length > 0) {
           responseText = saludoEntry.answers[Math.floor(Math.random() * saludoEntry.answers.length)];
           responseType = 'presentacion_inicial';
           relatedQuestions = saludoEntry.related_questions || [];
           category = saludoEntry.category || '';
         } else {
           responseText = "Hola, soy CITO, tu asistente virtual institucional.";
           responseType = 'presentacion_inicial';
         }
      } else {
         // 4. Último fallback: no se encontró ID ni pregunta ni saludo
         responseText = FALLBACK_NOT_FOUND;
         responseType = 'fallback';
      }
    }
  }

  const tiempoCapa = (performance.now() - startTotal).toFixed(0);
  
  console.log(`[API] prompt: "${prompt}"`);
  console.log(`[API] Intención matched: ${responseType}`);
  console.log(`[API] Tiempo total: ${tiempoCapa}ms`);
  console.log(`[API] Respuesta final: "${responseText}" (Type: ${responseType})`);

  return {
    reply: responseText,
    type: responseType,
    related: relatedQuestions, // Agregado para robustez y futura interfaz
    category: category
  };
}

module.exports = { procesarMensaje };
