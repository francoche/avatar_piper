export const AVATAR_CONFIG = {
  model: '/cyto_conRig_V1.glb',

  animations: {
    idle_loop: '/animations/Idle.fbx', 

    listening_enter: '/animations/Listening_in.fbx',
    listening_loop: '/animations/Listening_loop.fbx',
    listening_out: '/animations/Listening_out.fbx',

    thinking_in: '/animations/Thinking_in.fbx',
    thinking_loop: '/animations/Thinking_loop.fbx',
    thinking_out: '/animations/Thinking_out.fbx',

    talking_in: '/animations/Talking_in.fbx',
    talking_loop: '/animations/Talking_loop.fbx',
    talking_out: '/animations/Talking_out.fbx',

    // laughing: '/animations/Laughing.FBX',
    // pointing_front: '/animations/Pointing_Front.FBX',
    // negative: '/animations/Negative.FBX',
  },

  animationSettings: {
    crossFadeDuration: 0.1
  },

  api: {
    backend: 'http://localhost:5000',
  }
};