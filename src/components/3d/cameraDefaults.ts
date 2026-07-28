import { SCENE_CONFIG } from './sceneConfig';

/**
 * Compatibility exports for camera consumers. The source of truth now lives in
 * sceneConfig with the rest of the supported scene framing.
 */
export const DEFAULT_CAMERA_TARGET = SCENE_CONFIG.camera.target;
export const DEFAULT_CAMERA_POSITION = SCENE_CONFIG.camera.position;
