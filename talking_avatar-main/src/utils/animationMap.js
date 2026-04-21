// Mapeo de intención a animación más natural
export const ANIMATION_MAP = {
  idle: "idle",
  saludo: "saludo",
  ubicacion: "ubicacion",
  info: "info",
  error: "error",
  duda: "thinking",
  afirmacion: "laughing",
  default: "talking"
};

/**
 * Obtiene la animación correspondiente a un tipo de respuesta
 * @param {string} responseType - Tipo de respuesta del backend
 * @returns {string} Animación a usar
 */
export const getAnimationForType = (responseType) => {
  const type = (responseType || 'default').toLowerCase();
  return ANIMATION_MAP[type] || ANIMATION_MAP.default;
};
