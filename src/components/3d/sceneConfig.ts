import type { ConnectionType } from '@/types';

export type SceneVec3 = [number, number, number];

/**
 * Named configuration for the deliberately small experimental scene.
 *
 * Keeping these values together makes camera/layout changes reviewable and lets
 * tests assert the supported framing instead of duplicating magic numbers.
 */
export const SCENE_CONFIG = {
  layout: {
    perspectiveSpacing: 25,
    ringRadius: 15,
  },
  camera: {
    position: [0, 35, 90] as SceneVec3,
    target: [0, 0, 25] as SceneVec3,
    fov: 50,
    near: 0.1,
    far: 500,
  },
  fog: {
    color: '#1a1a1a',
    near: 50,
    far: 200,
  },
  lighting: {
    ambientIntensity: 0.3,
    pointPosition: [10, 10, 10] as SceneVec3,
  },
  renderer: {
    dpr: [1, 2] as [number, number],
  },
  orbit: {
    dampingFactor: 0.08,
    minDistance: 35,
    maxDistance: 120,
    minPolarAngle: Math.PI / 6,
    maxPolarAngle: Math.PI / 2,
    rotateSpeed: 0.6,
    zoomSpeed: 0.8,
  },
  focus: {
    verticalOffset: 5,
    depthOffset: 15,
    spring: { tension: 280, friction: 60 },
  },
  node: {
    radius: 1.5,
    widthSegments: 32,
    heightSegments: 32,
    hoverScale: 1.05,
    selectedScale: 1.3,
    cueRingRadius: 1.9,
    cueRingTube: 0.08,
    lockedCageColor: '#94a3b8',
    lockedCageOpacity: 0.7,
    lockedCageSegments: 12,
    spring: { tension: 300, friction: 20 },
  },
  guide: {
    labelPositionY: -20,
    labelScale: [32, 4, 1] as SceneVec3,
    planeSize: 80,
  },
  connection: {
    nodeClearance: 2.1,
    availableRadius: 0.055,
    highlightedRadius: 0.11,
    lockedRadius: 0.04,
    lockedSegments: 7,
    lockedSegmentFill: 0.56,
    arrowRadius: 0.32,
    arrowHeight: 0.82,
    opacity: {
      locked: 0.28,
      available: 0.58,
      highlighted: 0.95,
    },
  },
} as const;

/** Connection colour enriches the structural solid/dashed + arrow encoding. */
export const SCENE_CONNECTION_COLOR: Record<ConnectionType, string> = {
  temporal: '#67e8f9',
  consciousness: '#c4b5fd',
  recursive: '#fbbf24',
  hidden: '#94a3b8',
};
