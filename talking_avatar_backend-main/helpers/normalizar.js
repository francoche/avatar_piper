const typoMap = {
  'durasion': 'duracion',
  'licensiatura': 'licenciatura',
  'licensatura': 'licenciatura',
  'sitemas': 'sistemas',
  'sitema': 'sistema',
  'inscriscion': 'inscripcion',
  'inscrepcion': 'inscripcion',
  'alunado': 'alumnado',
  'fcite': 'fcyt',
  'facit': 'fcyt'
};

function normalizar(texto) {
  if (!texto) return '';
  const baseNorm = texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "") // remover puntuación
    .replace(/\s+/g, " ") // colapsar espacios
    .trim();

  // Reemplazar palabras mal escritas comunes de forma determinista
  const words = baseNorm.split(' ');
  const correctedWords = words.map(w => typoMap[w] || w);
  return correctedWords.join(' ');
}

module.exports = { normalizar };

