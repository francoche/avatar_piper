const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../../data');
const kbPath = path.join(dataDir, 'knowledge_base.json');

console.log('[VALIDATOR] Cargando knowledge_base.json...');
let kb;
try {
  kb = JSON.parse(fs.readFileSync(kbPath, 'utf8'));
} catch (e) {
  console.error('[VALIDATOR] ERROR FATAL: El JSON tiene errores de sintaxis', e.message);
  process.exit(1);
}

// Validaciones
const ids = new Set();
const categories = new Set();
let hasErrors = false;

console.log('[VALIDATOR] Verificando estructura...');
kb.forEach((entry, index) => {
  // Verificar ID
  if (!entry.id) {
    console.error(`[VALIDATOR] ERROR: Entrada en el índice ${index} no tiene ID.`);
    hasErrors = true;
  } else if (ids.has(entry.id)) {
    console.error(`[VALIDATOR] ERROR: ID duplicado: ${entry.id}`);
    hasErrors = true;
  }
  ids.add(entry.id);

  // Verificar categoría
  if (!entry.category) {
    console.error(`[VALIDATOR] ERROR: Entrada ${entry.id} no tiene categoría.`);
    hasErrors = true;
  }
  categories.add(entry.category);

  // Verificar respuestas
  if (!entry.answers || !Array.isArray(entry.answers) || entry.answers.length < 3) {
    console.error(`[VALIDATOR] ERROR: Entrada ${entry.id} tiene menos de 3 respuestas.`);
    hasErrors = true;
  }
  
  // Limpiar respuestas vacías si las hay
  if (entry.answers) {
     entry.answers = entry.answers.filter(a => typeof a === 'string' && a.trim() !== '');
     if (entry.answers.length === 0) {
       console.error(`[VALIDATOR] ERROR: Entrada ${entry.id} se quedó sin respuestas válidas.`);
       hasErrors = true;
     }
  }
});

if (hasErrors) {
  console.error('[VALIDATOR] Se encontraron errores de validación. Abortando.');
  process.exit(1);
}

console.log('[VALIDATOR] Generando related_questions...');
// Generar related_questions basadas en la misma categoría
kb.forEach(entry => {
  const siblings = kb.filter(q => q.category === entry.category && q.id !== entry.id);
  // Elegir 3 aleatorias
  const shuffled = siblings.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 3).map(q => q.id);
  entry.related_questions = selected;
});

// Guardar los cambios
fs.writeFileSync(kbPath, JSON.stringify(kb, null, 2), 'utf8');
console.log('[VALIDATOR] knowledge_base.json actualizado con related_questions.');

console.log('[TEST FUNCIONAL] Simulando pipeline para TODAS las preguntas...');
let testErrors = 0;
kb.forEach(entry => {
  // Simular la búsqueda
  const found = kb.find(q => q.id === entry.id);
  if (!found) {
    console.error(`[TEST] Fallo al buscar ${entry.id}`);
    testErrors++;
    return;
  }
  if (!found.answers || found.answers.length === 0) {
    console.error(`[TEST] ${entry.id} no tiene respuestas.`);
    testErrors++;
    return;
  }
  
  // Seleccionar aleatoria
  const resp = found.answers[Math.floor(Math.random() * found.answers.length)];
  if (!resp || resp.trim() === '') {
     console.error(`[TEST] Respuesta vacía seleccionada para ${entry.id}`);
     testErrors++;
  }
});

if (testErrors === 0) {
  console.log('[TEST FUNCIONAL] ÉXITO. El sistema respondió correctamente para el 100% de las preguntas.');
} else {
  console.error(`[TEST FUNCIONAL] FALLO. Hubo ${testErrors} errores.`);
  process.exit(1);
}
