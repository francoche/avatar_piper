# Análisis del Sistema: Avatar Interactivo (Frontend + Backend)

El sistema se compone de una arquitectura Cliente-Servidor (React + Node.js) diseñada para ofrecer una experiencia conversacional fluida con un Avatar 3D. El objetivo principal es procesar la voz del usuario, encontrar la respuesta más rápida y precisa, y animar al avatar mientras habla.

A continuación, se detalla el funcionamiento, la arquitectura de archivos y las rutas alternativas de respuesta.

---

## 1. Funcionamiento General del Sistema

El flujo de interacción del usuario sigue este ciclo:

1. **Captura de Voz (Frontend):** El usuario habla usando el micrófono. El frontend (`App.js`) utiliza la *Web Speech API* del navegador. Al detectar silencio consecutivo, corta la escucha automáticamente y envía la transcripción de texto al backend.
2. **Procesamiento de Respuesta (Backend - `/chat`):** El backend recibe el texto y lo procesa a través de un sistema de "Capas" o "Rutas" priorizadas (desde la más rápida/rígida hasta la más lenta/inteligente) para generar la mejor respuesta de texto posible.
3. **Conversión de Texto a Voz (Backend - `/talk`):** Una vez que se obtiene el texto de la respuesta, el frontend envía ese texto al endpoint de TTS (Text-to-Speech), donde un motor asíncrono (**Piper**) la convierte en un audio `.wav`.
4. **Reproducción y Animación (Frontend):** El frontend recibe la URL del audio generado, lo reproduce y cambia el estado del Avatar 3D a la animación correspondiente según la "intención" detectada durante el procesamiento (por ejemplo, si de backend llegó un tipo de intención `duda`, el avatar activa la animación `thinking`).

---

## 2. El Procesamiento de las Respuestas (Rutas Alternativas)

El "cerebro" del sistema se encuentra en el archivo **`routes/index.js`** del backend, que usa un patrón iterativo de caída por gravedad (**Fallback Pipeline**) para garantizar una respuesta veloz. El procesamiento pasa por estas capas:

*   ⚡ **Capa 0: Memoria Caché:** Si un usuario ya preguntó *exactamente* lo mismo antes, se devuelve la respuesta guardada en la caché temporal (Memoria de Node). Es la ruta más rápida.
*   🟢 **Capa 1: Búsqueda en FAQ (`helpers/faq.js`):** Compara la pregunta del usuario con una serie de palabras clave de "preguntas frecuentes universales". Responde automáticamente si hay coincidencia.
*   🟢 **Capa 2: Detección de Intención (`helpers/intencion.js`):** Escanea el texto buscando intenciones categóricas (ej. `'materia'`, `'tramite'`, `'ubicacion'`, `'contacto'`). 
*   🟢 **Capa 3: Parser de Datos (`helpers/parser.js` y `data/facultad_db.json`):** Si en la capa 2 la intención fue académica/institucional, en esta capa se busca en la base de datos `facultad_db.json` para dar el horario, oficina, correlatividad, etc.
*   🟢 **Capa 4: Respuestas Directas Hardcodeadas:** Para interacciones tontas/simples como una "opinión", el sistema evita buscar datos y simplemente se describe a sí mismo o usa comodines.
*   🔴 **Capa 5: Inteligencia Artificial Local (Ollama - Llama):** Si de lo anterior no sacó nada limpio, la intención fue `desconocido` y la frase del usuario tenía más de 80 caracteres (es algo muy elaborado), envía la consulta a **Ollama (`helpers/Ollama.js`)**. Le pone la estricta limitación al modelo Llama (de responder en menos de 8 palabras o decir "Bedelía" si no sabe) para que la respuesta no sobrecargue la generación de voz ni haga alucinar al modelo.
*   🔵 **Capa 6: Fallback Default (Salida de Emergencia):** Si todo lo anterior falla o era una frase indescifrable corta, elige al azar una expresión genérica como *"Consultalo en Bedelía"* para disimular un poco y seguir fluyendo.

---

## 3. Explicación de los Archivos Claves

### El Backend (`/talking_avatar_backend-main`)
*   **`app.js` & `routes/index.js`**: Los encargados de enrutar las peticiones web. `index.js` tiene la lógica principal del enrutado (`/chat` evalúa la intención de las capas que vimos arriba y `/talk` hace la petición al motor de síntesis de voz Piper).
*   **`helpers/intencion.js`**: Expone una función que clasifica las palabras dictadas en intenciones para luego enrutarlas al manejador de respuestas adecuado.
*   **`helpers/parser.js`**: Un archivo complementario que busca respuestas formateadas extrayéndolas desde el archivo fuente de datos (**`data/facultad_db.json`**).
*   **`helpers/Ollama.js`**: Interface de conexión contra un puerto local manejando Ollama, controlando temperatura y recorte semántico (Hard cap de contexto de LLM local).
*   **`helpers/tts.js`**: Genera el habla para el avatar 3D ejecutando comandos hijos `spawn` asíncronos en el ejecutable `/piper/piper.exe` del sistema. Devuelve la URL local del audio resultante.

### El Frontend (`/talking_avatar-main`)
*   **`src/App.js`**: Es la capa madre visual. Gobierna la máquina de estados del Avatar (`idle`, `listening`, `thinking`, `talking`). Mapea cada respuesta a las variaciones corporales del Avatar 3D (ej. _si la intención es dudar, usa el `.glb` de "Thinking"_). Activa el Speech Recognition y maneja Watchdogs (temporizadores) de reset de sesiones y latencia humana aparente mediante timeouts.
*   **Carpeta `src/avatar/` y Canvas**: Se encarga nativamente de inicializar el **React Three Fiber (WebGL)** que muestra el modelo glTF, los huesos, mallas (geometry) e implementa shaders y control de cámara.
