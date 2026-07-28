import { describe, expect, it } from 'vitest';

import { extractRendererStatistics } from './rendererStatistics';

describe('extractRendererStatistics', () => {
  it('copies only stable render and memory counters', () => {
    const info = {
      render: {
        calls: 41,
        triangles: 52_104,
        points: 3,
        lines: 9,
        frame: 120,
      },
      memory: {
        geometries: 37,
        textures: 3,
      },
      programs: [],
      autoReset: true,
      reset: () => undefined,
      update: () => undefined,
    };

    expect(extractRendererStatistics(info)).toEqual({
      calls: 41,
      triangles: 52_104,
      points: 3,
      lines: 9,
      geometries: 37,
      textures: 3,
    });
  });
});
