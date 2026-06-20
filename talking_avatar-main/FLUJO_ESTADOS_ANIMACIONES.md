# 🎭 Flujo de Estados y Animaciones - Avatar Interactivo

## 📊 Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                         APP.JS (Orquestador)                     │
│  - Coordina todos los hooks                                      │
│  - Maneja comunicación entre componentes                         │
│  - Gestiona el renderizado de Canvas3D                          │
└─────────────────────────────────────────────────────────────────┘
              ↓              ↓              ↓              ↓
    ┌─────────────────┬──────────────┬──────────────┬──────────────┐
    │                 │              │              │              │
    ↓                 ↓              ↓              ↓              ↓
[useAvatarState] [useAudioRec] [useAIResponse] [useAudioPlayer] [Avatar.jsx]
  (Estado)       (Voz Input)   (IA Pipeline)   (Audio Output)  (Animaciones)
```

---

## 🎯 La Máquina de Estados - `useAvatarState.js`

### Estados Posibles:
```javascript
avatarState ∈ { 'idle', 'listening', 'thinking', 'talking', ... }
```

### Lógica de Transición (Pseudocódigo):

```javascript
const avatarState = useMemo(() => {
  if (isListening)        → return 'listening'
  if (speak && !playing)  → return 'thinking'    // IA está procesando
  if (playing)            → return animType       // Reproduciendo audio
                          → return 'idle'         // Defecto
}, [isListening, speak, playing, animType])
```

### Diagram de Estados:

```
                    ┌─────────────┐
                    │    IDLE     │  ← Estado por defecto
                    └──────┬──────┘
                           │ handleMicClick()
                           ↓
                    ┌─────────────┐
                    │ LISTENING   │  ← Usuario hablando (STT)
                    └──────┬──────┘
                           │ [Texto reconocido]
                           ↓
                    ┌─────────────┐
                    │  THINKING   │  ← IA procesando respuesta
                    └──────┬──────┘
                           │ [Audio del backend]
                           ↓
                    ┌─────────────┐
                    │   TALKING   │  ← Reproduciendo audio + animación
                    │  (o custom) │     (tipo depende del backend)
                    └──────┬──────┘
                           │ [Audio termina]
                           ↓
                    ┌─────────────┐
                    │    IDLE     │
                    └─────────────┘
```

---

## 🔄 Variables de Estado que Controlan Todo

### En `useAvatarState.js`:

| Variable | Tipo | Quien lo Controla | Significado |
|----------|------|-------------------|------------|
| `isListening` | boolean | `useAudioRecognition` | ¿Micrófono activo? |
| `speak` | boolean | `useAIResponse` | ¿Hay que procesar IA? |
| `playing` | boolean | `useAudioPlayer` | ¿Audio reproduciéndose? |
| `animType` | string | `useAIResponse` | Tipo de animación a jugar |
| `avatarState` | DERIVADO | (computed) | **← El que mira Avatar.jsx** |

### Flujo de Control:

```
Usuario hace clic
    ↓
handleMicClick() → setIsListening(true)
    ↓
useAudioRecognition captura voz
    ↓
STT reconoce texto → setText(texto) + setIsListening(false) + setSpeak(true)
    ↓
avatarState automáticamente → 'thinking' (porque speak=true, playing=false)
    ↓
useAIResponse detecta speak=true
    ↓
Llama backend → obtiene audio + tipo_animación
    ↓
setAnimType('talking') + onAudioReady(audioURL)
    ↓
useAudioPlayer recibe audioURL
    ↓
Espera un delay random (250-450ms) para UX natural
    ↓
Toca el audio → playerReady() → setPlaying(true)
    ↓
avatarState automáticamente → animType (ahora 'talking' o custom)
    ↓
Avatar.jsx ve el cambio de estado
    ↓
playAnimation('talking') ← Se ejecuta la animación
    ↓
Audio termina → playerEnded() → setPlaying(false)
    ↓
avatarState automáticamente → 'idle'
    ↓
Avatar.jsx ve el cambio → playAnimation('idle')
```

---

## 🎬 Cómo Avatar.jsx Reproduce las Animaciones

### 1. Carga de Animaciones (en `useEffect`):

```javascript
// Cada animación se carga UNA VEZ cuando el componente monta
Object.entries(AVATAR_CONFIG.animations).forEach(([key, url]) => {
  loadAnim(key, url)  // Carga el FBX
})

// Resultado: actions.current = {
//   idle: THREE.AnimationAction,
//   thinking: THREE.AnimationAction,
//   talking: THREE.AnimationAction,
//   ... etc
// }
```

### 2. Configuración de Animaciones:

```javascript
// IDLE: Se repite infinitamente hasta que cambie el estado
if (key === 'idle') {
  action.setLoop(THREE.LoopRepeat)        // Repite
} else {
  action.setLoop(THREE.LoopOnce)          // Solo una vez
  action.clampWhenFinished = true         // Queda en último frame
}
```

### 3. Reproducción (en `playAnimation(name)`):

```
Usuario en 'idle' → estado cambia a 'thinking'
    ↓
useEffect([avatarState]) dispara
    ↓
playAnimation('thinking') se llama
    ↓
// Detener todas las acciones previas
Object.values(actions.current).forEach(action => {
  if (action.isRunning && action !== newAction) action.stop()
})
    ↓
// Configurar la nueva
newAction.reset()                    // Limpiar estado
newAction.timeScale = 0.5            // Más lenta si es thinking
newAction.play()                     // ▶️ REPRODUCIR
    ↓
currentAction.current = 'thinking'   // Recordar cuál es
    ↓
// Mientras se reproduce, useFrame() mantiene mixer.update(delta)
// Esto hace que Three.js avance la animación cada frame
```

---

## 🎪 Mapeo de Intenciones → Animaciones

```javascript
// animationMap.js
ANIMATION_MAP = {
  'saludo'     → idle,
  'ubicacion'  → ubicacion,
  'info'       → info,
  'error'      → error,
  'duda'       → thinking,
  'afirmacion' → laughing,
  default      → talking
}

// El backend envía: { filename, type: 'saludo' }
//                                       ↓
// getAnimationType('saludo') → 'idle' (pero sigue reproduciendo audio)
```

---

## ⏱️ Timeline Completo de un Ciclo

```
T=0ms   │ Usuario presiona micrófono
        │ handleMicClick() → setIsListening(true)
        │ avatarState = 'listening'
        │ Avatar.jsx: playAnimation('listening')
        ├─────────────────────────────────────
T=500ms │ Usuario termina de hablar
        │ STT reconoce: "¿Dónde está la facultad?"
        │ setIsListening(false) + setSpeak(true)
        │ avatarState = 'thinking' ← speak=true, playing=false
        │ Avatar.jsx: playAnimation('thinking')
        │ useAIResponse comienza procesamiento
        ├─────────────────────────────────────
T=1200ms│ Backend responde con audio + type:'ubicacion'
        │ setAnimType('ubicacion') + onAudioReady(audioURL)
        │ useAudioPlayer recibe audioURL
        │ Espera PRE_SPEECH_DELAY random (250-450ms)
        ├─────────────────────────────────────
T=1500ms│ Delay terminado
        │ playerReady() → playAudio()
        │ setPlaying(true)
        │ avatarState = 'ubicacion' ← playing=true, animType='ubicacion'
        │ Avatar.jsx: playAnimation('ubicacion')
        │ 🎬 Avatar hace gesto de señalar la facultad
        ├─────────────────────────────────────
T=6000ms│ Audio termina (5 segundos de audio)
        │ playerEnded() → setPlaying(false)
        │ avatarState = 'idle' ← speak=false, playing=false
        │ Avatar.jsx: playAnimation('idle')
        │ Avatar vuelve a respirar naturalmente
        └─────────────────────────────────────
```

---

## 🔧 Componentes Clave

### `App.js` - El Maestro de Ceremonias
```javascript
// Conecta todo mediante callbacks y props
- Instancia 5 hooks
- Maneja el componente Canvas3D
- Pasa avatarState a Avatar.jsx
- Maneja inactividad (SESSION_TIMEOUT)
```

### `useAvatarState.js` - La Máquina de Estados
```javascript
// Calcula en qué estado está basado en booleanos
- isListening
- speak
- playing
- animType
→ avatarState (derivado, recomputa automáticamente)
```

### `Avatar.jsx` - El Reproductor
```javascript
// Escucha cambios en avatarState
- Carga todas las animaciones al montar
- En useEffect([avatarState]) → playAnimation(avatarState)
- Maneja transiciones suaves entre animaciones
- Ejecuta micro-movimientos y lip-sync en useFrame()
```

### `useAudioRecognition.js` - El Micrófono
```javascript
// Web Speech API
- Captura voz del usuario
- STT en español
- Filtra entrada de baja calidad
```

### `useAIResponse.js` - El Cerebro
```javascript
// Pipeline LLM + Backend + TTS
- Espera a que speak=true
- Llama backend con el texto
- Recibe { audio, type }
- Mapea type → animación via animationMap.js
```

### `useAudioPlayer.js` - El Timing
```javascript
// Control de reproducción con delays naturales
- Espera audioSource
- Random PRE_SPEECH_DELAY (250-450ms)
- Toca audio
- Callback cuando termina
```

---

## ⚡ El Problema Que Tenías

### ❌ ANTES (crossFadeFrom con LoopRepeat):
```
idle ▶️ thinking ▶️ talking ▶️ idle (rápido, se solapaban)
└─ Las animaciones se repetían infinitamente
└─ crossFadeFrom() conflictuaba con LoopRepeat
└─ Resultaba: mezcla de animaciones
```

### ✅ AHORA (stop + play con LoopOnce para no-idle):
```
idle (REPEAT)
    ├─→ thinking (ONCE, se queda en frame final)
    │       └─→ talking (ONCE, se queda en frame final)
    │           └─→ idle (REPEAT, vuelve a respirar)
    └─ Sin solapamiento, transiciones claras
```

---

## 📝 Resumen: ¿Qué Maneja Qué?

| Lo que hace | Quién lo maneja | Ubicación |
|-------------|-----------------|-----------|
| Detectar voz usuario | `useAudioRecognition` | `/hooks/useAudioRecognition.js` |
| Cambiar entre estados | `useAvatarState` | `/hooks/useAvatarState.js` |
| Llamar IA/backend | `useAIResponse` | `/hooks/useAIResponse.js` |
| Reproducir audio | `useAudioPlayer` | `/hooks/useAudioPlayer.js` |
| Cargar/reproducir animaciones | `Avatar.jsx` | `/components/Avatar/Avatar.jsx` |
| Orquestar todo | `App.js` | `/App.js` |
| Mapear tipo_respuesta → animación | `animationMap.js` | `/utils/animationMap.js` |

---

## 🎯 Cómo Debuggear

### Ver cambios de estado:
```javascript
// En consola, busca logs [STATE] o [AVATAR]
// Mira los cambios:
[AVATAR] Estado actual: thinking → talking
[AVATAR] Estado actual: talking → idle
```

### Ver cuándo se cargan animaciones:
```javascript
// Busca [AVATAR] ✅ Acción registrada
// Debe verse: idle, thinking, talking, etc.
```

### Ver cuándo se reproducen:
```javascript
// Busca [AVATAR] ▶️ Reproduciendo
// Seguido de [AVATAR] ✅ Transición completada
```

---

**Última actualización**: Abril 21, 2026
