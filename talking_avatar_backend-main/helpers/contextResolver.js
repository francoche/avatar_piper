const { normalizar } = require('./normalizar');

const STOPWORDS = new Set(['de', 'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'que', 'en', 'para', 'por', 'con', 'sin', 'del', 'al', 'y', 'o', 'a', 'sobre', 'este', 'esta', 'esa', 'ese']);

let contextoPendiente = null;

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function crearContexto(tipo, intencion, tipoEntidad, opciones, promptOriginal) {
  contextoPendiente = {
    tipo,
    intencion,
    tipoEntidad,
    opciones,
    promptOriginal,
    reintentos: 0,
    timestamp: Date.now()
  };
  console.log(`[CTX] Contexto creado`);
}

function getContexto() {
  return contextoPendiente;
}

function limpiarContexto() {
  if (contextoPendiente) {
    contextoPendiente = null;
    console.log(`[CTX] Contexto limpiado`);
  }
}

function contextoExpirado() {
  if (!contextoPendiente) return true;
  return (Date.now() - contextoPendiente.timestamp) > 60000;
}

function formatearOpciones(nombres) {
  if (nombres.length === 0) return '';
  if (nombres.length === 1) return nombres[0];
  if (nombres.length === 2) return `${nombres[0]} o ${nombres[1]}`;
  const ultim = nombres.pop();
  return `${nombres.join(', ')} o ${ultim}`;
}

function resolverAmbiguedad(promptTexto) {
  if (!contextoPendiente) return { accion: 'cancelada' };
  
  if (!promptTexto || promptTexto.trim() === '') {
     return { accion: 'repreguntar' };
  }

  const norm = normalizar(promptTexto);
  
  if (/\b(no|ninguna|ninguno|olvidalo|dejalo|ya fue|cancela)\b/i.test(norm)) {
     return { accion: 'cancelada' };
  }

  const opciones = contextoPendiente.opciones;
  
  const regexUno = /\b(uno|1|primero|primera|nro 1|numero 1|opcion 1)\b/;
  const regexDos = /\b(dos|2|segunda|segundo|nro 2|numero 2|opcion 2)\b/;
  const regexTres = /\b(tres|3|tercera|tercero|nro 3|numero 3|opcion 3)\b/;
  const regexCuatro = /\b(cuatro|4|cuarta|cuarto|nro 4|numero 4|opcion 4)\b/;

  if (regexUno.test(norm) && opciones.length >= 1) return { accion: 'resuelta', opcion: opciones[0] };
  if (regexDos.test(norm) && opciones.length >= 2) return { accion: 'resuelta', opcion: opciones[1] };
  if (regexTres.test(norm) && opciones.length >= 3) return { accion: 'resuelta', opcion: opciones[2] };
  if (regexCuatro.test(norm) && opciones.length >= 4) return { accion: 'resuelta', opcion: opciones[3] };

  let mejorOpcion = null;
  let maxScore = 0;

  const tokens = norm.split(' ').filter(t => (t.length >= 3 || t === 'ia') && !STOPWORDS.has(t));

  for (const opc of opciones) {
    let scoreActual = 0;
    const opcNorm = normalizar(opc.nombre || '');
    
    for (const token of tokens) {
      const regSegura = new RegExp(`\\b${escapeRegex(token)}\\b`, 'i');
      if (regSegura.test(opcNorm)) {
         scoreActual += 1;
      }
    }

    if (scoreActual > 0 && scoreActual > maxScore) {
      maxScore = scoreActual;
      mejorOpcion = opc;
    }
  }

  if (mejorOpcion) {
    return { accion: 'resuelta', opcion: mejorOpcion };
  }

  return { accion: 'repreguntar' }; 
}

module.exports = {
  crearContexto,
  getContexto,
  limpiarContexto,
  contextoExpirado,
  resolverAmbiguedad,
  formatearOpciones
};
