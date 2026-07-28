import type { WebGLRenderer } from 'three';

export interface SceneRendererStatistics {
  calls: number;
  triangles: number;
  points: number;
  lines: number;
  geometries: number;
  textures: number;
}

type RendererInfo = WebGLRenderer['info'];

/**
 * Copy the non-sensitive renderer counters used by the local profiling harness.
 * Returning a value object keeps the diagnostic surface read-only and prevents
 * callers from reaching the renderer, scene, camera, or application state.
 */
export function extractRendererStatistics(info: RendererInfo): SceneRendererStatistics {
  return {
    calls: info.render.calls,
    triangles: info.render.triangles,
    points: info.render.points,
    lines: info.render.lines,
    geometries: info.memory.geometries,
    textures: info.memory.textures,
  };
}
