export const AVATAR_CONFIG = {
  model: '/model.glb',

  animations: {
    idle: '/idle.FBX',
    thinking: '/animations/Pointing_Up.FBX',
    talking: '/animations/Talking.FBX',
    saludo: '/animations/Hello.FBX',
    ubicacion: '/animations/Pointing_Front.FBX',
    info: '/animations/Pointing_Up.FBX',
    error: '/animations/Negative.FBX',
    laughing: '/animations/Laughing.FBX',
    twist: '/animations/Twist.FBX',
    backflip: '/animations/Backflip.FBX'
  },

  animationSettings: {
    crossFadeDuration: 0.3
  },

  api: {
    backend: 'http://localhost:5000',
  }
};