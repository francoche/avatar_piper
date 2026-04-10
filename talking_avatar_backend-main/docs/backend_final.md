# Arquitectura Final del Backend del Avatar Interactivo

Este documento consolida la arquitectura y las optimizaciones definitivas aplicadas al backend (Node.js + Express) para garantizar un altísimo rendimiento en hardware sumamente limitado (Intel i3, 8GB RAM, sin GPU). El sistema ha quedado estructuralmente completo y preparado para la interacción fluida con el futuro frontend.

---

## 1. Arquitectura de 5 Capas Dinámicas

El endpoint unificado `/chat` implementa un embudo determinista estricto ('Waterfall Validation') antes de delegar cualquier recurso al modelo onnx (TTS) o binario pesado (Ollama):

1. **Caché en Memoria (0ms):** Intercepción absoluta donde texto repetido (o normalizado idéntico) devuelve instantáneamente el archivo en RAM salvando procesos. Esto abarca las llamadas a I/O, el NLU, y el LLM.
2. **FAQ Directa (~1ms):** Respuestas prefabricadas, ahora dotadas de humanización (plantillas aleatorias para generar simpatía).
3. **Detección Determinista (~1-2ms):** Un micro-NLU local intercepta el *topic* (materia, tramite, ubicacion, etc.) cortando ambigüedades.
4. **Parser JSON (~2ms):** Búsqueda estructural ultra-rápida por alias para escupir respuestas armadas.
5. **IA Controlada (Ollama) + Hard Cap (Fallback Rígido):** Si nada de lo estructurado sirve y el prompt califica (>80 caracteres), recién allí la IA genera.

### ⚡ Limitación de Respuesta (Hard Cap)
Para blindar el CPU y estabilizar la experiencia, las respuestas asíncronas de Ollama se *truncatean* rígidamente a `120 caracteres`. Esto previene desvaríos del modelo y restringe el overhead masivo en renderización de Text-to-Speech final.

---

## 2. Flujo Completo del Sistema
1. El usuario envía `POST /chat`.
2. Una centralización de la **Normalización** entra en juego eliminando tildes, carácteres especiales, pasajes a minúsculas y comprimiendo strings.
3. Se decide el string de respuesta ideal (sea del bot determinista o del bot generativo Ollama).
4. El sistema ejecuta `POST /talk` bajo la lógica TTS reescrita.
5. El sistema entrega el path de audio `.wav` generado aleatoriamente.
   - **Mejora Crítica:** `tts.js` revisa una tabla `Map()` nativa guardando tracks pasados y previniendo que una frase procesada sufra el spawn de `piper.exe` más de una vez.

---

## 3. Optimizaciones Críticas Aplicadas

- **Aislamiento del Lazo de Eventos (Event Loop):** `piper.exe` es invocado sincrónicamente a nivel shell, pero manejado puramente mediante streams asíncronos y Promesas anilladas, sin consumir el Event Loop mientras dura la inferencia local.
- **Normalización DRY (Don’t Repeat Yourself):** Unificación de algoritmos de sanitización de texto.
- **Limpieza de Dependencias:** El proyecto pasó de ser una app renderizada via *Pug* a una API REST pura, purgada de bloatwares como `cookie-parser` o SDKs obsoletos.
- **Micro-Logs:** El sistema ahora traza el milisegundo exacto de cruce con la estampa de finalización: `[API] Respuesta final: "..."`.

---

## 4. Métricas de Rendimiento Acordadas
- **Renderizado Estático (FAQ/Parsers):** `1 – 8 ms`.
- **Renderizado Caché (Pregunta repetida):** `< 1 ms`.
- **Renderizado TTS (Primera vez):** `~1.8 - 2.5 seg` (Dependiente puramente de `piper.exe` y la RAM disponible, encapsulado out-of-loop).
- **Renderizado TTS (Cache hit):** `0 ms` inmediato.
- **Ollama Generation:** Limitado por el cap y cortado si el usuario inserta algo genérico.

---

## 5. Limitaciones Conocidas del Sistema
1. **Piper Cold-Start:** Al instanciar de cero, el arranque del modelo `.onnx` toma ~`500ms`. Al basarnos en `spawn` dinámico, ganamos total estabilidad y seguridad en RAM, pero pagamos esa estricta cuota por cada frase nueva generada.
2. **Respuestas Cerradas:** La decisión de capar en 120 caracteres inhabilita explicaciones magistrales profundas, en gran honor de un flujo conversacional rápido e interactivo de pregunta/respuesta idóneo para un avatar informativo frontal.
