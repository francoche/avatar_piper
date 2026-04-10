// helpers/parser.js

const fs = require('fs');
const path = require('path');

// [MEJORA] Estructura modular para escalar información sin afectar rendimiento
const data = {
  materias: JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'materias.json'), 'utf8')),
  tramites: JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'tramites.json'), 'utf8')),
  facultad: JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'ubicaciones.json'), 'utf8'))
};

const { normalizar } = require('./normalizar');

// 🔹 Mapa de alias para materias
const aliasMaterias = {
  "prog 1": "PROG1",
  "progra": "PROG1",
  "programacion 1": "PROG1",
  "programacion uno": "PROG1",
  "datos": "BD1",
  "bases": "BD1",
  "base de datos": "BD1"
};

// 🔹 Buscar materia
function buscarMateria(pregunta) {
  const p = normalizar(pregunta);

  // Intentar buscar por alias directo
  let idMateriaDetectada = null;
  for (const alias in aliasMaterias) {
    if (p.includes(alias)) {
      idMateriaDetectada = aliasMaterias[alias];
      break;
    }
  }

  return data.materias.find(m => {
    if (idMateriaDetectada && m.id === idMateriaDetectada) return true;
    
    const nombre = normalizar(m.nombre);
    return p.includes(nombre) || p.includes(m.id.toLowerCase());
  });
}

// 🔹 Armar respuesta de materia
function responderMateria(materia) {
  const templates = [
    `${materia.nombre} se dicta los días ${materia.dia} de ${materia.horario} en el ${materia.aula}.`,
    `Para ${materia.nombre}, las clases son el ${materia.dia} (${materia.horario}). Vas a cursar en el ${materia.aula}.`,
    `Tengo anotado que cursás ${materia.nombre} el ${materia.dia} de ${materia.horario}, en el espacio ${materia.aula}.`
  ];
  console.log('[MEJORA] Respuestas más naturales implementadas (Parser Dinámico)');
  return templates[Math.floor(Math.random() * templates.length)];
}

// 🔹 Buscar trámite
function buscarTramite(pregunta) {
  const p = normalizar(pregunta);

  return data.tramites.find(t =>
    p.includes(normalizar(t.nombre))
  );
}

function responderTramite(t) {
  const templates = [
    `Sobre ${t.nombre}: ${t.procedimiento}`,
    `Te cuento cómo es para ${t.nombre}. El paso a paso es: ${t.procedimiento}`,
    `Para hacer el trámite de ${t.nombre}, tenés que hacer esto: ${t.procedimiento}`
  ];
  console.log('[MEJORA] Respuestas más naturales implementadas (Parser Dinámico)');
  return templates[Math.floor(Math.random() * templates.length)];
}

// 🔹 Info general facultad
function responderFacultad(pregunta) {
  const p = normalizar(pregunta);

  if (p.includes('direccion') || p.includes('ubicacion')) {
    const r = [
      `La facultad está en ${data.facultad.ubicación}.`,
      `Tenés que acercarte a ${data.facultad.ubicación}.`,
      `Nuestra dirección exacta es ${data.facultad.ubicación}.`
    ];
    console.log('[MEJORA] Respuestas más naturales implementadas (Parser Dinámico)');
    return r[Math.floor(Math.random() * r.length)];
  }

  if (p.includes('telefono')) {
    return `${data.facultad.contacto.telefono}. ¡Llamanos cuando quieras!`;
  }

  if (p.includes('email') || p.includes('correo')) {
    return `Podés enviarnos un mail a ${data.facultad.contacto.email}.`;
  }

  return null;
}

module.exports = {
  buscarMateria,
  responderMateria,
  buscarTramite,
  responderTramite,
  responderFacultad
};