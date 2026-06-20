export const AVATAR_CONFIG = {
  model: '/Robot_Esqueleto.glb',

  animations: {
    idle_loop: '/animations/idle_y_up_Anim.FBX', 

    listening_enter: '/animations/Listening_enter_y_Anim.FBX',
    listening_loop: '/animations/Listetning_loop_y_up_Anim.FBX',
    listening_out: '/animations/Listening_out_y_Anim.FBX',

    thinking_in: '/animations/thinking_in_y_Anim.FBX',
    thinking_loop: '/animations/thinking_loop_y_Anim.FBX',
    thinking_out: '/animations/thinking_out_y_Anim.FBX',

    talking_in: '/animations/talking_in_y_Anim.FBX',
    talking_loop: '/animations/talking_loop_y_Anim.FBX',
    talking_out: '/animations/talking_out_y_Anim.FBX',

    laughing: '/animations/Laughing.FBX',
    pointing_front: '/animations/Pointing_Front.FBX',
    negative: '/animations/Negative.FBX',
  },

  animationSettings: {
    crossFadeDuration: 0.1
  },

  api: {
    backend: 'http://localhost:5000',
  }
};