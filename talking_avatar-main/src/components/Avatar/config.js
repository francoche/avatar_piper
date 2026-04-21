export const AVATAR_CONFIG = {
  model: '/Robot_Esqueleto.glb',

  animations: {
    idle: '/animations/Hello.FBX', 
    thinking: '/animations/Pointing_Up.FBX',
    talking: '/animations/Talking.FBX',
    //saludo: '/animations/Hello.FBX',
    ubicacion: '/animations/Pointing_Front.FBX',
    info: '/animations/Pointing_Up.FBX',
    error: '/animations/Negative.FBX',
    laughing: '/animations/Laughing.FBX',
    //BUGEADA twist: '/animations/Twist.FBX',
    listening: '/animations/Backflip.FBX'
  },

  animationSettings: {
    crossFadeDuration: 0.3
  },

  api: {
    backend: 'http://localhost:5000',
  }
};