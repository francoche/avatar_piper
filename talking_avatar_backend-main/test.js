// Importa la función desde tu módulo
const { askLlama } = require('helpers\Ollama.js'); 

async function ejecutarPrueba() {
  console.log("Iniciando prueba de backend con Ollama...");
  
  const promptInicial = "¿Cuál es el color del cielo en un día despejado?";

  try {
    console.log(`\n-> Pregunta: ${promptInicial}`);
    
    // Llama directamente a la función de tu backend
    const respuesta = await askLlama(promptInicial); 
    
    console.log("---");
    console.log(`<- Respuesta de Llama3: ${respuesta}`);
    console.log("---");
    console.log("✅ Prueba exitosa. La integración de Ollama funciona.");
    
  } catch (error) {
    console.error("\n❌ Prueba fallida. Hay un error en la integración.");
    // El error detallado ya se muestra en la función askLlama.
    // console.error(error); 
  }
}

// Ejecuta la función principal de prueba
ejecutarPrueba();