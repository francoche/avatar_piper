const fs = require('fs');
const path = require('path');
const { normalizar } = require('./normalizar');

const data = {
  materias: JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'materias.json'), 'utf8')),
  tramites: JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'tramites.json'), 'utf8')),
  becas: JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'becas.json'), 'utf8')),
  lugares: JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'lugares.json'), 'utf8'))
};

// Motor unificado de búsqueda
function buscarEntidad(pregunta, coleccion) {
  const p = normalizar(pregunta);
  for (const item of coleccion) {
    if (item.keywords && item.keywords.some(k => p.includes(k))) {
      return item;
    }
    if (item.nombre && p.includes(normalizar(item.nombre))) {
      return item;
    }
  }
  return null;
}

function formatearRespuesta(entidad) {
  if (!entidad) return null;
  return {
    reply: entidad.respuesta.corta,
    type: entidad.tipo
  };
}

function buscarMateria(pregunta) {
  return buscarEntidad(pregunta, data.materias);
}

function buscarTramite(pregunta) {
  return buscarEntidad(pregunta, data.tramites);
}

function buscarBeca(pregunta) {
  return buscarEntidad(pregunta, data.becas);
}

function buscarLugar(pregunta) {
  return buscarEntidad(pregunta, data.lugares);
}

module.exports = {
  buscarMateria,
  buscarTramite,
  buscarBeca,
  buscarLugar,
  formatearRespuesta
};