/**
 * Default camera position and target constants
 * Separated to support React Fast Refresh requirements
 */

type Vec3 = [number, number, number];

// Default framing keeps the camera high enough to reveal complete rings instead of clipped half-spheres
export const DEFAULT_CAMERA_TARGET: Vec3 = [0, 0, 25];
export const DEFAULT_CAMERA_POSITION: Vec3 = [0, 35, 90];
