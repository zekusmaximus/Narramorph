import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { resolveSceneFrameloop, useSceneFrameloop } from './sceneFrameloop';

afterEach(() => {
  Reflect.deleteProperty(document, 'visibilityState');
});

describe('resolveSceneFrameloop', () => {
  it('pauses hidden documents and uses demand rendering for reduced motion', () => {
    expect(resolveSceneFrameloop('hidden', false)).toBe('never');
    expect(resolveSceneFrameloop('hidden', true)).toBe('never');
    expect(resolveSceneFrameloop('visible', true)).toBe('demand');
    expect(resolveSceneFrameloop('visible', false)).toBe('always');
  });
});

describe('useSceneFrameloop', () => {
  it('reacts to document visibility changes and resumes in the requested motion mode', () => {
    let visibilityState: DocumentVisibilityState = 'visible';
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => visibilityState,
    });

    const { result, rerender } = renderHook(({ reduceMotion }) => useSceneFrameloop(reduceMotion), {
      initialProps: { reduceMotion: false },
    });
    expect(result.current).toBe('always');

    act(() => {
      visibilityState = 'hidden';
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(result.current).toBe('never');

    act(() => {
      visibilityState = 'visible';
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(result.current).toBe('always');

    rerender({ reduceMotion: true });
    expect(result.current).toBe('demand');
  });
});
