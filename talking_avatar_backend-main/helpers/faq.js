const faq = [
  {
    keywords: ['costo', 'precio', 'vale'],
    respuesta: [
      'El ingreso a la facultad es total y absolutamente gratuito.',
      'No tiene ningún costo, es una universidad pública y gratuita.',
      'Estudiar acá es gratis, no tenés que pagar inscripción ni cuotas.'
    ]
  },
  {
    keywords: ['distancia', 'virtual'],
    respuesta: [
      'Las carreras se cursan de manera presencial.',
      'De momento, la modalidad de cursado es 100% presencial.',
      'Todas las materias se dictan presencialmente en el campus.'
    ]
  },
  {
    keywords: ['inscribo', 'inscripcion'],
    respuesta: [
      'Para anotarte, tenés que hacerlo a través del sistema SIU Guaraní.',
      'Podés inscribirte directamente ingresando en tu cuenta de SIU Guaraní.',
      'La inscripción a materias se hace de forma online por el SIU Guaraní.'
    ]
  },
  {
    keywords: ['varias carreras', 'cuantas carreras'],
    respuesta: [
      'Podés cursar tantas carreras como quieras, ¡no hay límite!',
      'Tenés la libertad de inscribirte en múltiples carreras a la vez.',
      'No hay restricciones de cantidad, podés anotarte en varias carreras.'
    ]
  },
  {
    keywords: ['regularidad'],
    respuesta: [
      'La condición de alumno regular dura por dos años y 6 turnos de exámenes.',
      'Para mantener la regularidad, recuerda que caduca a los dos años o 6 turnos de final.',
      'Tu regularidad en una materia dura dos años académicos incluyendo seis turnos.'
    ]
  },
  {
    keywords: ['becas'],
    respuesta: [
      'Contamos con varias opciones de ayuda: becas Progresar, UADER y programas como Manuel Belgrano.',
      'Te podés anotar a la Beca Progresar, a la Manuel Belgrano, o las propias de la Universidad (UADER).',
      'Sí, existen distintas opciones económicas como las becas Manuel Belgrano o Progresar.'
    ]
  },
  {
    keywords: ['horario bedelia'],
    respuesta: [
      'El equipo de Bedelía atiende siempre de lunes a viernes, de 9 a 20 horas.',
      'Podés acercarte a Bedelía durante la semana, en el horario de 9 a 20 hs.',
      'La oficina de Bedelía está abierta de 9 a 20 horas (lunes a viernes).'
    ]
  },
  {
    keywords: ['opinas', 'opinion'],
    respuesta: [
      'Soy un asistente informativo de la facultad, mi objetivo es ayudarte con tus dudas académicas.',
      'La verdad es que no tengo opiniones personales, estoy acá para responder dudas de la facu.',
      'Como soy una inteligencia artificial orientada a la universidad, no doy opiniones.'
    ]
  },
  {
    keywords: ['hola', 'buenas'],
    respuesta: [
      '¡Hola! ¿En qué puedo ayudarte?',
      '¡Buenas! ¿Qué necesitás saber?',
    ]
  },
  {
    keywords: ['gracias'],
    respuesta: [
      '¡De nada!',
      'Para eso estoy 😊',
    ]
  }
];

const { normalizar } = require('./normalizar');

function buscarFAQ(pregunta) {
  const p = normalizar(pregunta);

  for (const item of faq) {
    if (item.keywords.some(k => p.includes(k))) {
      // Elegir respuesta aleatoria del array para humanizar
      const elegida = item.respuesta[Math.floor(Math.random() * item.respuesta.length)];
      console.log('[MEJORA] Respuestas más naturales implementadas (FAQ dinámica)');
      return elegida;
    }
  }

  return null;
}

module.exports = { buscarFAQ };