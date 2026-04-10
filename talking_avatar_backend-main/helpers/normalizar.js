function normalizar(texto) {
  if (!texto) return '';
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "") // remover puntuación
    .replace(/\s+/g, " ") // colapsar espacios
    .trim();
}

module.exports = { normalizar };
