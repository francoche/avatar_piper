# Documentación Técnica: Backend del Avatar Interactivo

Este documento describe la arquitectura final, estable y robustecida del backend del Avatar Interactivo. Se encuentra preparado para producción, refactorizado sin deuda técnica y optimizado para latencias bajas en hardware limitado.

## 1. Arquitectura y Pipeline Transaccional

Todo requerimiento que ingresa al endpoint `/chat` es procesado mediante el patrón estructural de **Fallback Pipeline** dentro de `helpers/pipeline.js` y no se detiene hasta que devuelve una estructura estricta garantizada por tipado explícito: `{ reply, type }`.

### El Flujo de Ejecución (/chat)
1. **Validación Inicial**: Si el prompt llega vacío, el endpoint directamente devuelve un soft-fallback con código `400` y tipado válido.
2. **Caché en Memoria (`cache.js`)**: Las preguntas frecuentes respondidas recientemente se almacenan. La resolución es en **~0ms**.
3. **FAQ (`faq.js`)**: Barrido superficial optimizado por frases cortas frecuentes (ej: costo, horario_alumnado).
4. **Intención (`intencion.js`)**: Identificador de ramas lógico, clasifica entre `materia, tramite, ubicacion, contacto, becas`.
5. **Parser JSON Estático (`parser.js`)**: Cruza la intención con las bases de datos `JSON` operables en memoria cruzando *keywords*.
6. **IA Ollama (`Ollama.js`)**: Si (y solo si) la intención resulta "desconocido" y el log de tokens ingresado tiene más de 50 caracteres para valer la pena, se activa nuestro LLM local.
7. **Fallback Seguro**: Si la IA crashea o ninguna capa logró interpretar la petición, se emite una respuesta aleatoria predeterminada.
8. **Gestor Global de Errores**: Si aún con todo el pipeline blindado ocurre alguna excepción (error 500), se activa la directiva Try-Catch global del Route para devolver una respuesta válida por defecto e impedir que el Frontend se quede colgado esperando.

## 2. Bases de Datos Jerárquicas (Carga Estática JSON)

Todas residen en `helpers/data/`.  
**Nota de Mantenimiento:** Para agregar nuevo conocimiento, simplemente editar el `json` pertinente y agregar las `keywords` siempre normalizadas (minúsculas y sin tilde). El Parser trabaja en `$O(n)$` en memoria, garantizando tiempo de búsqueda < 1ms.

## 3. Estados Emitidos a Frontend (Types Contract)

Es indispensable que el Frontend utilice estos `types` para reaccionar o disparar animaciones específicas.
Todos han sido normalizados a minúscula estricta:
  - `materia`
  - `tramite`
  - `ubicacion`
  - `contacto`
  - `becas`
  - `faq`
  - `opinion`
  - `ia`
  - `fallback`

El endpoint `/talk` está bloqueado por diseño bajo un contrato cerrado que **solamente** devuelve `{"filename": "/audio/xxx.wav"}` procesado nativamente por la binario standalone de Piper garantizando ciclos asíncronos rápidos.

## 4. Troubleshooting (Auditoría de Logs)

Todos los logs innecesarios dentro del código base (los `console.log("[MEJORA]")`) fueron eliminados, instaurando una política higiénica de control de tiempos para medir rendimiento de capas:

```
[API] Intención: materia
[API] Capa: Parser (1ms)
[API] Tiempo total: 3ms
[API] Respuesta final: "..." (Type: materia)
```
Si experimentan latencias de +1000ms de manera sostenida, identificar qué Capa la provoca revisando la consola de Node. Si es la capa IA, considerar que el Ollama host puede estar agotando los recursos gráficos/CPU del equipo. En `Ollama.js`, las configuraciones de latencia (`num_predict` y `num_ctx`) han sido limitadas al mínimo aceptable para preservar desempeño en hardware chico.
