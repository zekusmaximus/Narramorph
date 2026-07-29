import { useEffect, useState } from 'react';

export type SceneFrameloop = 'always' | 'demand' | 'never';

export function resolveSceneFrameloop(
  visibilityState: DocumentVisibilityState,
  reduceMotion: boolean,
): SceneFrameloop {
  if (visibilityState === 'hidden') {
    return 'never';
  }
  return reduceMotion ? 'demand' : 'always';
}

function readVisibilityState(): DocumentVisibilityState {
  return typeof document === 'undefined' ? 'visible' : document.visibilityState;
}

/**
 * Keep the optional scene from consuming a continuous render loop in a hidden
 * document. Reduced-motion readers get demand rendering because all scene
 * springs are immediate and OrbitControls damping is disabled for them.
 */
export function useSceneFrameloop(reduceMotion: boolean): SceneFrameloop {
  const [visibilityState, setVisibilityState] =
    useState<DocumentVisibilityState>(readVisibilityState);

  useEffect(() => {
    const handleVisibilityChange = (): void => setVisibilityState(readVisibilityState());
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return resolveSceneFrameloop(visibilityState, reduceMotion);
}
