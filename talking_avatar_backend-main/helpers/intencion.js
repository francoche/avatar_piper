const { normalizar } = require('./normalizar');

const keywords = {
  materia: ['materia', 'cursada', 'clase', 'profesor', 'correlativa', 'aula', 'prog 1', 'progra', 'bases', 'datos', 'bd1'],
  tramite: ['tramite', 'certificado', 'boleto', 'como hago'],
  ubicacion: ['donde', 'queda', 'ubicacion', 'direccion', 'lugar', 'como llegar', 'mapa', 'sede'],
  contacto: ['contacto', 'telefono', 'email', 'correo', 'llamar', 'numero'],
  opinion: ['opinas', 'opinion', 'pensas', 'crees', 'te parece'],
  horario: ['hora', 'horario', 'cuando abre', 'a que hora', 'cierra', 'abre'],
  inscripcion: ['inscribo', 'anotarme', 'registro', 'inscripcion', 'ingreso', 'matricula'],
  becas: ['beca', 'progresar', 'ayuda economica', 'subsidio', 'manuel belgrano', 'uader']
};

function detectarIntencion(texto) {
  const norm = normalizar(texto);
  for (const [intencion, keys] of Object.entries(keywords)) {
    if (keys.some(k => norm.includes(k))) {
      console.log(`[MEJORA] Nuevas intenciones agregadas: Detección expandida a '${intencion}'`);
      return intencion;
    }
  }
  return 'desconocido';
}

module.exports = { detectarIntencion };
