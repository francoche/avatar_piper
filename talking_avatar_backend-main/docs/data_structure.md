# Base de Conocimiento del Avatar (Data Structure)

Este documento detalla cómo mantener, estructurar y editar el "cerebro" del Avatar. La base de datos no es SQL/NoSQL clásica; está compuesta íntegramente por archivos `JSON` de alta velocidad cargados en la memoria RAM una sola vez, garantizando respuestas por debajo de 5ms.

## Arquitectura de Directorios

Todos los conocimientos estructurados viven dentro de `helpers/data/`.  
Archivos actuales:
- `materias.json`: Información curricular.
- `tramites.json`: Trámites administrativos y procesos de inscripción.
- `becas.json`: Todo lo referido a ayuda económica y becas de investigación pura.
- `lugares.json`: Unificación de todas las ubicaciones de la facultad (Sedes) y los Contactos organizacionales (Alumnado, Secretarías).

## Estructura de Entidades (The JSON Schema)

Cada objeto dentro del arreglo de un archivo debe seguir imperativamente este formato para que el Parser Funcione:

```json
{
  "id": "PROG1",
  "tipo": "materia",
  "nombre": "Fundamentos de Programación",
  "keywords": ["prog 1", "programacion 1", "fundamentos"],
  "respuesta": {
    "corta": "Fundamentos de Programación es una materia anual de primer año.",
    "larga": "Detalles adicionales opcionales..."
  }
}
```

### Explicación de Campos

- **`id`**: Identificador único en mayúsculas (ej: `MATDISC`, `RECUPERAR_CLAVE`). Práctico para debuggear.
- **`tipo`**: Obligatorio. Debe corresponder con el archivo o la intención (`materia`, `tramite`, `beca`, `ubicacion`, `contacto`). *Este campo se envía directo al frontend para accionar animaciones o estados en pantalla.*
- **`nombre`**: Título oficial amigable de la entidad.
- **`keywords`**: Arreglo de strings. **CLAVE**: Deben estar siempre en _minúsculas_ y _sin tildes_. El parser cruza la frase del usuario (ya normalizada) con estas palabras usando `.includes()`.
- **`respuesta.corta`**: El texto sintetizado que el TTS y la API devolverán para hablar. No hacer respuestas excesivamente largas.
- **`respuesta.larga`**: Campo estructural de soporte si el Frontend algún día muta a tener componentes de texto (como modales de lectura).

## ¿Cómo añadir un conocimiento nuevo?

Si se inaugura una carrera o surge un trámite nuevo (ej: "Sexto Turno"):
1. Abrí el archivo correspondiente (ej: `tramites.json`).
2. Agregá el bloque JSON al final del arreglo actual (cuidando las comas de separación).
3. Asegurate de darle al menos 3 a 5 sinónimos en el array `keywords` para que las variaciones naturales de habla de los usuarios activen el parser sin rebotar en la IA.
4. Reiniciá el backend (`npm start`). El nuevo conocimiento estará online inmediatamente.

> [!TIP]
> **Performance**: Debido a la carga de una sola vez (`JSON.parse` at startup), no te preocupes si los archivos alcanzan los miles de registros. Las búsquedas `O(N)` sobre Data estructurada en memoria RAM suceden en sub-milisegundos en V8.
