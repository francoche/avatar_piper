import { useState } from 'react';

export function useAvatar() {
    const [state, setState] = useState('idle');

    const setIdle = () => setState('idle');
    const setTalking = () => setState('talking');

    return {
        state,
        setIdle,
        setTalking,
    };
}