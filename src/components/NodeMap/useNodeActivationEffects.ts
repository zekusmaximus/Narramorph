import { useCallback, useEffect, useRef, useState } from 'react';

import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';
import type { CharacterType } from '@/types';

const GLITCH_COLORS: Record<CharacterType, string> = {
  archaeologist: '#00e5ff',
  algorithm: '#39ff14',
  'last-human': '#d32f2f',
  'multi-perspective': '#9c27b0',
};

export interface NodeActivationEffects {
  glitchActive: boolean;
  glitchColor: string;
  screenShake: boolean;
  trigger: (character: CharacterType, visited: boolean) => void;
}

export function useNodeActivationEffects(): NodeActivationEffects {
  const reduceMotion = useReducedMotionPreference();
  const [glitchActive, setGlitchActive] = useState(false);
  const [glitchColor, setGlitchColor] = useState('#00e5ff');
  const [screenShake, setScreenShake] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(
    () => () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
    },
    [],
  );

  const trigger = useCallback(
    (character: CharacterType, visited: boolean): void => {
      if (reduceMotion) {
        return;
      }
      setScreenShake(true);
      timers.current.push(window.setTimeout(() => setScreenShake(false), 300));
      if (visited) {
        setGlitchColor(GLITCH_COLORS[character]);
        setGlitchActive(true);
        timers.current.push(window.setTimeout(() => setGlitchActive(false), 800));
      }
    },
    [reduceMotion],
  );

  return { glitchActive, glitchColor, screenShake, trigger };
}
