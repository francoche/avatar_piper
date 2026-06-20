const fs = require('fs');
const path = require('path');

async function main() {
  console.log('=== CITO - GENERADOR DE BASE DE CONOCIMIENTO OFFLINE ===');
  
  const rootDir = path.join(__dirname, '../..');
  const contextoPath = path.join(rootDir, 'contexto/contexto.md');
  const fallbackContextoPath = path.join(rootDir, 'contexto.txt');
  
  let contextoContent = '';
  if (fs.existsSync(contextoPath)) {
    contextoContent = fs.readFileSync(contextoPath, 'utf8');
    console.log(`[INFO] Leyendo contexto desde: ${contextoPath}`);
  } else if (fs.existsSync(fallbackContextoPath)) {
    contextoContent = fs.readFileSync(fallbackContextoPath, 'utf8');
    console.log(`[INFO] Leyendo contexto desde: ${fallbackContextoPath}`);
  } else {
    console.error('[ERROR] No se encontró el archivo de contexto.md ni contexto.txt.');
    process.exit(1);
  }

  console.log(`[INFO] Tamaño del contexto: ${contextoContent.length} caracteres.`);
  
  try {
    const { default: ollama } = require('ollama');
    console.log('[INFO] Intentando conectar con Ollama local...');
    
    // 1. Generar FAQ
    console.log('[LLM] Generando faq.json...');
    const faqPrompt = `
Sos un analizador de información institucional y académica de UADER FCyT.
Basándote EXCLUSIVAMENTE en el siguiente contexto:
===
${contextoContent.substring(0, 8000)} // Limitar contexto para evitar overflows
===

Generá un archivo JSON estructurado exactamente como este formato:
[
  {
    "keywords": ["palabra1", "palabra2"],
    "respuesta": ["variante respuesta 1", "variante respuesta 2", "variante respuesta 3"]
  }
]
Incluí entre 3 y 5 preguntas frecuentes típicas (por ejemplo: duración de analista, duración de licenciatura, costo de la carrera, curso de ingreso) y sus respuestas con 3 variantes cada una. No agregues explicaciones, respondé ÚNICAMENTE con el bloque JSON.
`;

    const faqResponse = await ollama.generate({
      model: 'llama3.2:1b',
      prompt: faqPrompt,
      options: { temperature: 0.1 }
    });

    let faqClean = cleanJsonResponse(faqResponse.response);
    console.log('[INFO] FAQ generado exitosamente.');
    
    // 2. Generar Intents
    console.log('[LLM] Generando intents.json...');
    const intentsPrompt = `
Basándote en el mismo contexto, generá un archivo JSON que mapee intenciones del usuario a palabras clave y variaciones de consultas:
{
  "duracion_analista": {
    "keywords": ["duracion analista", "tiempo analista"],
    "variations": ["cuanto dura analista", "duracion de analista"]
  }
}
Generá al menos 4 intenciones relevantes: duracion_analista, duracion_licenciatura, materias_analista, salida_laboral.
Respondé ÚNICAMENTE con el bloque JSON limpio.
`;
    
    const intentsResponse = await ollama.generate({
      model: 'llama3.2:1b',
      prompt: intentsPrompt,
      options: { temperature: 0.1 }
    });
    let intentsClean = cleanJsonResponse(intentsResponse.response);
    console.log('[INFO] Intents generado exitosamente.');

    // Escribir los archivos generados
    const dataDir = path.join(rootDir, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(path.join(dataDir, 'faq_generated.json'), faqClean, 'utf8');
    fs.writeFileSync(path.join(dataDir, 'intents_generated.json'), intentsClean, 'utf8');
    
    console.log('[OK] Los archivos de conocimiento generados por la IA se han guardado como `faq_generated.json` e `intents_generated.json` en /data/.');
    console.log('[OK] Podés renombrarlos a `faq.json` e `intents.json` para usarlos en producción.');

  } catch (err) {
    console.warn('\n[ADVERTENCIA] No se pudo generar la base de conocimiento usando Ollama.');
    console.warn(`Detalle del error: ${err.message}`);
    console.warn('Verificá que Ollama esté instalado y ejecutándose localmente, y que poseas el modelo "llama3.2:1b".');
    console.warn('El sistema seguirá utilizando los archivos pre-generados estables ubicados en /data/.');
  }
}

function cleanJsonResponse(rawText) {
  let text = rawText.trim();
  // Remover markdown block de código si existe
  if (text.startsWith('```json')) {
    text = text.substring(7);
  } else if (text.startsWith('```')) {
    text = text.substring(3);
  }
  if (text.endsWith('```')) {
    text = text.substring(0, text.length - 3);
  }
  return text.trim();
}

main();
