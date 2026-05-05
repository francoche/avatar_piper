# Arquitectura del Backend: Avatar Conversacional Académico

## 1. Objetivo general del sistema
El backend del Avatar sirve como el motor lógico e integrador de una interfaz conversacional tridimensional e interactiva orientada al entorno universitario. Su propósito fundamental es recibir transcripciones de voz (STT), interpretar la intención del alumno en milisegundos, despachar información institucional validada y alimentar un sistema de clonación de voz local (TTS). Está diseñado específicamente para funcionar bajo los recursos restringidos de un kiosco local o tótem estático.

## 2. Filosofía de diseño del backend
La arquitectura abraza un paradigma **Deterministic-First** (Determinismo Primario) acompañado de una estrategia **AI-as-a-Fallback** (IA como Recuperador).
Frente a la tendencia contemporánea de delegar el enrutamiento y la inferencia completa de los chatbots a los grandes modelos de lenguaje (LLMs), este proyecto opta por un flujo basado en reglas duras escalonadas. El motivo es triple:
1. Asegurar trazabilidad 100% auditable (crítico para instituciones educativas).
2. Mantener latencias por debajo de 5 milisegundos para respuestas hardcodeadas, protegiendo la sincronicidad facial del FrontEnd (Lipsync).
3. Reducir la alucinación a cero durante los happy-paths conversacionales institucionales.

## 3. Explicación completa del pipeline por capas
El ciclo de vida de un mensaje se gestiona estricta y secuencialmente en `pipeline.js`, atravesando Capas Defensivas. Solo cuando una capa renuncia (retorna `null`), se permite descender a la siguiente:

- **Capa 0 (Contexto y Reanudación)**: Intercepta re-ingresos o respuestas a clarificaciones (memoria a corto plazo).
- **Capa Memoria (Caché)**: Respuesta instantánea si el *prompt* ya resolvió previamente con éxito.
- **Capa 1 (FAQ)**: Búsquedas ultrarrápidas para consultas quemadas o directas institucionales.
- **Capa 2 (Intención)**: Etiquetado macro (`materia`, `tramite`) para direccionar los JSONs.
- **Capa 3 (Parser JSON Scored)**: Búsqueda granular y matemática dentro de la taxonomía local de Facultades.
- **Capa 4 (Directa)**: Respuestas estáticas a opiniones o small talk previsto.
- **Capa 5 (LLM Local)**: Ollama actúa evaluando el mensaje original para cubrir "hoyos" semánticos con un contexto derivado de las capas superiores.
- **Capa Fallback**: Último bastión de rescate pasivo ("Consultá en alumnado").

## 4. Rol exacto de cada helper
La arquitectura es monolítica, puramente Node.js/Express, segmentada en helpers de un solo propósito funcional:
- **`pipeline.js`**: Core orquestador. Determina el descenso piramidal de las peticiones.
- **`cache.js`**: Memoria en RAM global para atajos definitivos, librando a capas complejas del recálculo.
- **`intencion.js`**: Rejilla gruesa de clasificación inicial basada en tokens clave.
- **`parser.js`**: Motor avanzado de coincidencia, puntaje y selección fina de entidades y ambigüedades.
- **`contextResolver.js`**: Máquina de Estado que aísla de memoria interaccional las preguntas y aclaraciones, controlando TTLs y cancelaciones.
- **`Ollama.js`**: Capa de aislamiento que formatea y restringe localmente llamadas limitadas y puntuales hacia el LLaMA.
- **`normalizar.js`**: Escudo unificador que limpia el input quitando acentos, normalizando puntuaciones y capitalizando el caos del STT.

## 5. Detección de Intención
Gobernada por diccionarios simplificados, su responsabilidad es exclusivamente inyectar una etiqueta pre-calculada como pasaporte hacia motores más complejos. Utiliza `.includes()` sobre el array de familias de palabras. Esto garantiza que no procesemos el árbol enorme de `materias.json` si el usuario estaba hablando de `becas`.

## 6. Lógica del motor Parser y Scoring
Es el brazo resolutor de la aplicación. En contraposición a la búsqueda de subcadenas puras, fragmenta la idea del alumno en un proceso matemático de 3 fases:
1. **+8 Puntos (Keywords Dominantes)**: Ocurrencia de la palabra clave con delimitadores `\b`, asumiendo intención certera.
2. **+5 Puntos (Title Match)**: La transcripción incluyó el nombre exacto de la materia sin variaciones.
3. **+2 Puntos (Partial Soft-Match)**: Cruce interno de tokens mínimos de más de 2 caracteres como estrategia flexible a variaciones fonéticas ("programacion 2" y "Avanzada").

Su comportamiento arrojará una `"Victoria Dominante"` inmediata si la brecha entre el puesto N°1 y N°2 supera los 3 puntos (Delta 3). 

## 7. Manejo de la Ambigüedad
Ante cruces cerrados donde el Scoring determine distancias de empate (Ej. *"Quiero hablar de Programación"* impactando a *"Prog 1"* y *"Prog 2"* por igual), el Bot **frena el pipeline de despachos y bloquea** a Llama.  
En esta encrucijada, extrae un sub-top 4 del array, genera una cadena idiomática unificada (*"¿Te referís a A o B?"*) e instruye a que el origen pase al Helper de Contexto.

## 8. Memoria Efímera de Contexto (`contextResolver.js`)
Dado que el Avatar no posee base de datos vinculada a perfiles, pero un ser humano tenderá a responder confusiones diciendo la palabra "esa", construimos un estado local sobre `let contextoPendiente = null()`.
Este espacio es altamente controlado, tiene TTL estricto de expiración a 60 segundos y retiene temporalmente:
- La enumeración de las alternativas en disputa.
- El objeto macro que estábamos intentando resolver.
- El track de Intentos y Reintentos hacia el usuario.

## 9. Prevención Defensiva frente a Loops Finitos
Uno de los mayores terrores en avatares conversacionales es el loop circular ininterrumpible. Se erradicó forzando matemáticamente dos vías de muerte de estado desde `pipeline.js`:
- El Estado se auto-aniquila tras cualquier coincidencia exitosa y es resuelto devolviendo respuestas hardcodeadas.
- Se fijó `ctx.reintentos = 1` por transacción verbal. Al detectarse el mismo error o desconexión del usuario más allá de este umbral (dos respuestas no entendidas), se limpia el buffer, se purga la caché respectiva y se empuja irrestricta y directamente al usuario a la IA contextual de contingencia para ser respondido como un simple chatbot generalista.  
- A esto se añade la Regex Atrapa-cancelación pasiva `/\b(no|ninguna|olvidalo|ya fue)\b/` resolviendo en 0 milisegundos y con limpieza total.

## 10. Fallback Híbrido Contextualizado
Cuando la cascada algorítmica falle, o el usuario introduzca un tema verdaderamente abstracto, el `pipeline` dispara Llama NO como reemplazo sino como red neuronal de recuperación, empaquetando inyectando artificialmente la deducción original que fracasó (Ej: *"El usuario quiere consultar de un trámite pero nos falló la base de datos... Responde tú amablemente"*).

## 11. Uso de Ollama
Es el puente API residente. Consume nuestro motor Llama cargado localmente con un control de recursos y temperatura gélida (0.1T), lo cual mata la creatividad en pro de respuestas directas y pragmáticas orientadas al espectro académico y estandarizado oficial. Prompts fuertemente restringidos con un tamaño de inferencia ínfimo priorizan el descarte y respuesta menor de 20 tokens (evitando que cueste VRAM valiosa de otros procesos del Avatar 3D).

## 12. Blindaje Anti-Alucinaciones
La arquitectura no asume la obediencia del LLM en sí es decir, a pesar de que el System Prompt diga "no inventes" y "derivá a alumnado", las estrategias de prevención constan en la técnica del Hardware Limits: **Se ha cortado de raíz el output tras 120 caracteres.**
Esto extirpa la mayor de las posibilidades de extrapolación inútil desde la latencia al Pipet TTS impidiendo el desarrollo de largas historias por accidente.

## 13. Capa Transversal de Caché Global
`cache.js` asume el rol del front-gate general. Cada entrada triunfal de las Capas > 1 se mapea permanentemente a su normalización base en RAM. Puesto que el FAQ no mutará y los tramites académicos son piedra, consultar *"cuando inscribo"* diez veces, solo genera gasto de CPU 1 vez en toda la vida del Node.

## 14. Concepto de bypassCache
Dada la nueva existencia de la Capa de Clarificación y de LLMs capados por Reintentos. Almacenar interacciones coyunturales y conversacionales contaminaría el proxy global del avatar para cualquier visitante casual. Para ello, respuestas como *"Decime cuál opción querías"* emplean bypass total marcandolo en la orquestación.

## 15. Arquitectura de Logs Unificados
Todos los eventos transitan y son etiquetados semánticamente en Node.
- `[API]` Monitorea Flujos macro (Entrada a Capas, Trazabilidad, IA derivada).
- `[CTX]` Monitorea el corazón Efímero (Ambigüedades, Expiraciones, Contextos cerrados).
Esto proporciona información diagnóstica vital en un entorno ciego (sin teclado) para futuros debuggings.

## 16. Performance y Latencias esperadas
El flujo determinista (Capas 0 a la 4) procesan interacciones en tiempo asintótico a < **4ms**.
La recuperación a IA (Capa 5 Llama) procesan según VRAM e iteración por Llama (latencias de ~**2.8 segundos**).
Los Caché-Hits procesan iteraciones en tiempo sub-milisegundo (~**0ms**).

## 17. Casos de Flujo Natural Testeados
- `programacion 1` → Cache Miss → Capa 2 (materia) → Capa 3 (Parser). Hit certero. Tiempo Total: 1ms.
- `programacion` → Múltiple Match Escalonado → Capa 3 delega a Capa 0 Contextualizado. → Respuesta "A o B".
   Seguido de...
   `la uno` → Ingreso a Capa 0 → Extracción Matemática de Opción 1 → Envío directo del FAQ al usuario bypassing API y LLM.
- `la 1` → Intención Fallida (No Materia) -> Context Clean (Ninguno activo) -> Ollama -> Caída en Gracia.

---

## 18. Riesgos y Trade-Offs Conocidos

| Riesgo | Justificación Arquitectónica | Trade-Off Aceptado |
| :--- | :--- | :--- |
| **Embudo Secuencial `intencion.js` a `parser.js`** | La detección previa previene correr Regex pesadas indiscriminadas, permitiendo que la capa 3 actúe localizadamente.| Limitación de Cobertura. Si un término está en las FAQs/Materias pero NO se mencionó su alias en el `intencion.js` principal primero, no llegará nunca a evaluarse y fluirá a Llama como `desconocido`.|
| **Falsos Positivos Semánticos con Negación** | Un input diciendo *"Nunca leí prog 1"* actuará como consulta de Muestra porque detecta las Keyword desalineado de la sintaxis.| Precisión Vs Estabilidad. Incorporar NLP o Sentimental Analysis de librerías corrompería la filosofía Zero-Dep local en la actual y multiplicaría la latencia para los simples paths positivos imperantes del kiosk.
| **Hard Truncation Ciego LLM** | Retener 120 caracteres puros con `substring`. Defiende la Pipeline final del TTS ante verbosidades irreales que ralenticen Pipeline final.| Puede ocurrir un borde fonético indeseable para la voz sintetizada cortando palabras como *¨alumn...¨* a ser compensado con el sufijo estático que añadimos.|

## 19. Limitaciones Estructurales
- Es Mono-Usuario (Kiosk-mode). La Caché y la Memoria de Ambiguación (`Context Pendiente`) dependen del estado de servidor único y suponen que los comandos subsiguientes serán del mismo remitente con el micrófono abierto delante de él.
- El sistema de Scoring valora la repetición y los atajos directos, un vocabulario ajeno institucional podría requerir adaptaciones profundas al diccionario JSON.
- `intencion.js` sufre dependencia del acoplamiento secuencial ciego. El super-parser debe vivir subyugado a un array `.includes()` burdo.

## 20. Posible Roadmap Tecnológico
1. **Unificación Intención-Regex**: Proveer a la Capa 2 el motor de Boundaries y el Escape de caracteres actualizando la preselección de tópicos de forma más precisa que la técnica suelta actual.
2. **Contextos Compartidos Híbridos Multi-Sessiones**: Migrar el let efímero a un Micro-Redis caso de querer separar o clonar las memorias de usuario para Web e interacciones de token múltiple (si se libera el proyecto de la pantalla única).
3. **Smart LLM Truncation**: Actualizar `Ollama.js` para detenerse explícitamente y finalizar con puntos limpios para que la síntesis de voz Piper no quiebre la ilusión con terminaciones en seco, pero conservando la seguridad base impuesta.
