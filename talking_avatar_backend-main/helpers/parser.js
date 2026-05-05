const fs = require('fs');
const path = require('path');
const { normalizar } = require('./normalizar');

const data = {
  materias: JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'materias.json'), 'utf8')),
  tramites: JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'tramites.json'), 'utf8')),
  becas: JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'becas.json'), 'utf8')),
  lugares: JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'lugares.json'), 'utf8'))
};

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Motor unificado de búsqueda con Scoring
function buscarEntidadScored(pregunta, coleccion) {
  const p = normalizar(pregunta);
  const pTokens = p.split(' ').filter(t => t.length >= 3 || t === 'ia');
  
  let resultados = [];

  for (const item of coleccion) {
    let score = 0;
    
    // Alias / Keywords exactos (+8) y parciales (+2)
    if (item.keywords) {
       let partialKwMatch = 0;
       for (const kw of item.keywords) {
         const kwNorm = normalizar(kw);
         if (new RegExp(`\\b${escapeRegex(kwNorm)}\\b`, 'i').test(p)) {
             score += 8;
         } else {
             for (const t of pTokens) {
                 if (new RegExp(`\\b${escapeRegex(t)}\\b`, 'i').test(kwNorm)) {
                     partialKwMatch = 2; // Solo asigna 2, no acumula por cada kw
                 }
             }
         }
       }
       score += partialKwMatch;
    }
    
    // Nombre exacto (+5) y Token parcial (+2)
    if (item.nombre) {
       let partialNameMatch = 0;
       const nNorm = normalizar(item.nombre);
       if (new RegExp(`\\b${escapeRegex(nNorm)}\\b`, 'i').test(p)) {
           score += 5;
       }
       for (const t of pTokens) {
         if (new RegExp(`\\b${escapeRegex(t)}\\b`, 'i').test(nNorm)) {
             partialNameMatch = 2;
         }
       }
       score += partialNameMatch;
    }
    
    if (score > 0) {
      resultados.push({ entidad: item, score });
    }
  }

  resultados.sort((a, b) => b.score - a.score);
  
  if (resultados.length === 0) return { ganadora: null, multiples: [], confidence: 0 };
  
  const topScore = resultados[0].score;
  const totalScore = resultados.reduce((sum, r) => sum + r.score, 0);
  const confidence = topScore / totalScore;

  if (resultados.length === 1) {
      return { ganadora: resultados[0].entidad, multiples: [], confidence };
  }
  
  // Heurística de Victoria Dominante
  if (resultados[0].score > resultados[1].score + 3) {
      return { ganadora: resultados[0].entidad, multiples: [], confidence };
  } else {
      // Empate técnico -> Ambigüedad
      const topOpciones = resultados.slice(0, 4).map(r => r.entidad);
      return { ganadora: null, multiples: topOpciones, confidence };
  }
}

function formatearRespuesta(entidad) {
  if (!entidad) return null;
  return {
    reply: entidad.respuesta.corta,
    type: entidad.tipo
  };
}

function buscarMateria(pregunta) {
  return buscarEntidadScored(pregunta, data.materias);
}

function buscarTramite(pregunta) {
  return buscarEntidadScored(pregunta, data.tramites);
}

function buscarBeca(pregunta) {
  return buscarEntidadScored(pregunta, data.becas);
}

function buscarLugar(pregunta) {
  return buscarEntidadScored(pregunta, data.lugares);
}

module.exports = {
  buscarMateria,
  buscarTramite,
  buscarBeca,
  buscarLugar,
  formatearRespuesta
};