import { AVATAR_CONFIG } from '../components/Avatar/config';

export const API_BACKEND = AVATAR_CONFIG.api.backend;
export const AZURE_HOST = AVATAR_CONFIG.api.backend;

export const SESSION_TIMEOUT = 30000; // 30 segundos
export const PRE_SPEECH_DELAY_MIN = 250; // ms
export const PRE_SPEECH_DELAY_MAX = 450; // ms
export const INITIAL_GREETING_DELAY = 3500; // 3.5 segundos
export const TRANSCRIPT_CONFIRMATION_DELAY = 5000; // 5 segundos
export const AI_RESPONSE_DELAY = 300; // 300ms
export const SHORT_INPUT_DELAY = 2000;
export const TRANSCRIPT_MIN_WORDS = 1;
export const TRANSCRIPT_MIN_LENGTH = 2;

export const AUDIO_RECOGNITION_CONFIG = {
  lang: 'es-ES',
  continuous: true,
  interimResults: true,
};

export const CANVAS_CONFIG = {
  dpr: 2,
  camera: {
    fov: 40,
    position: [0, 1.2, 4],
  },
  controls: {
    target: [0, 1.0, 0],
  },
};

export const BG_MESH_CONFIG = {
  position: [0, 1.0, -2],
  scale: [5, 5, 1],
  texture: '/images/bg.webp',
};

export const ENVIRONMENT_CONFIG = {
  background: false,
  files: '/images/photo_studio_loft_hall_1k.hdr',
};
