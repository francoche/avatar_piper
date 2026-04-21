# 📁 Estructura del Proyecto - talking_avatar

## Organización Limpia del Frontend

Después de la refactorización, el proyecto ahora tiene una estructura escalable y mantenible.

### 📂 Estructura de Carpetas

```
src/
├── components/
│   ├── Avatar/
│   │   ├── Background.jsx          # Componente de fondo 3D
│   │   └── config.js               # Configuración del avatar (existente)
│   │
│   ├── ControlPanel/
│   │   ├── ControlPanel.jsx        # Panel de control con micrófono
│   │   └── styles.js               # Estilos centralizados
│   │
│   └── Canvas3D/
│       └── Canvas3D.jsx            # Canvas 3D con configuración
│
├── hooks/
│   ├── useAvatarState.js           # Máquina de estados del avatar
│   ├── useAudioRecognition.js      # Reconocimiento de voz (STT)
│   ├── useAIResponse.js            # Pipeline LLM + Backend
│   └── useAudioPlayer.js           # Control del reproductor de audio
│
├── utils/
│   ├── constants.js                # Constantes y configuraciones
│   ├── animationMap.js             # Mapeo de intenciones a animaciones
│   └── api.js                      # Funciones de API
│
├── avatar/                         # Carpeta existente (sin cambios)
├── App.js                          # Componente principal (LIMPIO)
├── App.css
├── index.js
└── ... (otros archivos)
```

---

## 🎯 Descripción de Cada Sección

### **Components** - Componentes React Reutilizables

| Archivo | Responsabilidad |
|---------|-----------------|
| `Background.jsx` | Renderiza el fondo 3D del escenario |
| `ControlPanel.jsx` | Panel de control: botón micrófono + estado |
| `Canvas3D.jsx` | Canvas 3D con avatar, iluminación y ambiente |

### **Hooks** - Lógica Personalizada

| Hook | Responsabilidad |
|------|-----------------|
| `useAvatarState` | Máquina de estados (idle, thinking, talking, saludo) |
| `useAudioRecognition` | Reconocimiento de voz con filtro de calidad |
| `useAIResponse` | Pipeline: Chat API → TTS → Audio |
| `useAudioPlayer` | Control de reproducción con delays naturales |

### **Utils** - Utilidades y Configuraciones

| Archivo | Responsabilidad |
|---------|-----------------|
| `constants.js` | Valores constantes, timeouts, configuración 3D |
| `animationMap.js` | Mapeo intención → animación con helper |
| `api.js` | Llamadas HTTP (chat + TTS) |

---

## 🔄 Flujo de Datos en App.js

```
App.js (Orquestador)
│
├─→ useAvatarState()
│   └─ Retorna: avatarState, setters de estado
│
├─→ useAudioRecognition()
│   └─ Maneja: STT (Speech to Text)
│
├─→ useAIResponse()
│   └─ Maneja: Chat API + TTS
│
├─→ useAudioPlayer()
│   └─ Maneja: Reproducción de audio
│
└─→ Renderiza:
    ├─ ControlPanel (UI)
    ├─ Canvas3D (3D)
    └─ ReactAudioPlayer (Audio)
```

---

## ✨ Beneficios de la Refactorización

✅ **App.js limpio** - Solo 90 líneas (antes 380+)
✅ **Separación de responsabilidades** - Cada hook maneja un aspecto
✅ **Reutilizable** - Los hooks pueden usarse en otros componentes
✅ **Testeable** - Lógica aislada y fácil de testear
✅ **Escalable** - Estructura lista para nuevas funcionalidades
✅ **Mantenible** - Cambios localizados sin efectos secundarios

---

## 🔧 Cómo Extender

### Agregar una Nueva Animación
1. Actualizar `animationMap.js`
2. Agregar la animación en el backend
3. El mapeo se aplica automáticamente

### Agregar Nueva Funcionalidad de Voz
1. Crear `hooks/useNewFeature.js`
2. Importar en `App.js`
3. Usar en el flujo

### Agregar Nuevo Componente UI
1. Crear `components/NewComponent/`
2. Importar en `App.js`
3. Pasar props del estado

---

## 📝 Cambios Realizados

- ✅ Extraído reconocimiento de voz a hook
- ✅ Extraído pipeline LLM a hook
- ✅ Extraído manejo de audio a hook
- ✅ Extraído componente Fondo (Bg)
- ✅ Extraído Panel de control
- ✅ Extraído Canvas 3D
- ✅ Centralizado estilos
- ✅ Centralizado constantes
- ✅ App.js ahora es solo orquestación

---

**Última actualización**: Abril 20, 2026
