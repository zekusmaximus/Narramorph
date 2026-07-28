import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';

import { extractRendererStatistics, type SceneRendererStatistics } from './rendererStatistics';

interface SceneDiagnosticReader {
  readRendererStatistics: () => SceneRendererStatistics | null;
}

declare global {
  interface Window {
    __narramorph3dDiagnostics?: Readonly<SceneDiagnosticReader>;
  }
}

function diagnosticsRequested(): boolean {
  return new URLSearchParams(window.location.search).get('profile3d') === '1';
}

/**
 * Opt-in, local-only bridge for the automated production profiler.
 * It exposes copied renderer counters only when `?profile3d=1` is present.
 */
export default function SceneDiagnostics(): null {
  const enabled = diagnosticsRequested();
  const latest = useRef<SceneRendererStatistics | null>(null);

  useFrame(({ gl }) => {
    if (enabled) {
      latest.current = extractRendererStatistics(gl.info);
    }
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const reader = Object.freeze({
      readRendererStatistics: (): SceneRendererStatistics | null =>
        latest.current === null ? null : { ...latest.current },
    });
    Object.defineProperty(window, '__narramorph3dDiagnostics', {
      configurable: true,
      enumerable: false,
      value: reader,
      writable: false,
    });

    return () => {
      Reflect.deleteProperty(window, '__narramorph3dDiagnostics');
    };
  }, [enabled]);

  return null;
}
