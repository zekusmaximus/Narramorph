import { useCallback, useEffect, useRef, useState } from 'react';

import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';
import { PERSPECTIVE_COLOR } from '@/styles/designTokens';
import type { CharacterType } from '@/types';

/** Activation glitch tint per perspective — drawn from the unified fills, no neon. */
const GLITCH_COLORS: Record<CharacterType, string> = PERSPECTIVE_COLOR;

export interface NodeActivationEffects {
  glitchActive: boolean;
  glitchColor: string;
  screenShake: boolean;
  trigger: (character: CharacterType, visited: boolean) => void;
}

export function useNodeActivationEffects(): NodeActivationEffects {
  const reduceMotion = useReducedMotionPreference();
  const [glitchActive, setGlitchActive] = useState(false);
  const [glitchColor, setGlitchColor] = useState(PERSPECTIVE_COLOR.archaeologist);
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
