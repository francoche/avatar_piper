import { useMemo, useEffect } from 'react';

export const useAvatarState = (isListening, speak, playing, animType, hasGreeted) => {
  const avatarState = useMemo(() => {
    if (!hasGreeted) return 'saludo';
    if (isListening) return 'idle'; // Por requerimiento actual
    if (speak && !playing) return 'thinking';
    if (playing) return animType;
    return 'idle';
  }, [hasGreeted, isListening, speak, playing, animType]);

  useEffect(() => {
    console.log(`[AVATAR] Estado: ${avatarState}`);
  }, [avatarState]);

  return avatarState;
};
