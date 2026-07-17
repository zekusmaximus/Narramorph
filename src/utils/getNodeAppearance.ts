import { PERSPECTIVE_COLOR, PERSPECTIVE_COLOR_LOCKED } from '@/styles/designTokens';
import type { CharacterType } from '@/types';

export interface NodeAppearance {
  color: string;
  emissiveColor: string;
  emissiveIntensity: number;
  scale: number;
  opacity: number;
}

export interface GetNodeAppearanceParams {
  character: CharacterType;
  isActive: boolean;
  isVisited: boolean;
  isLocked: boolean;
  awarenessLevel: number;
}

/**
 * Character color palette — sourced from the shared design tokens so the map,
 * 3D scene, and Tailwind all render the same perspective identity colours.
 */
const CHARACTER_COLORS: Record<string, string> = PERSPECTIVE_COLOR;

/**
 * Dimmer palette for locked nodes (design-token locked variants).
 */
const LOCKED_COLORS: Record<string, string> = PERSPECTIVE_COLOR_LOCKED;

/**
 * Get visual appearance for a node based on its state
 */
export function getNodeAppearance({
  character,
  isActive,
  isVisited,
  isLocked,
}: GetNodeAppearanceParams): NodeAppearance {
  const baseColor = CHARACTER_COLORS[character] || '#CCCCCC';
  const lockedColor = LOCKED_COLORS[character] || '#666666';

  // Locked node: reduced scale, dim, low opacity
  if (isLocked) {
    return {
      color: lockedColor,
      emissiveColor: lockedColor,
      emissiveIntensity: 0.1,
      scale: 0.8,
      opacity: 0.3,
    };
  }

  // Active node: bright glow
  if (isActive) {
    return {
      color: baseColor,
      emissiveColor: baseColor,
      emissiveIntensity: 2.0,
      scale: 1.0,
      opacity: 1.0,
    };
  }

  // Visited node: medium glow
  if (isVisited) {
    return {
      color: baseColor,
      emissiveColor: baseColor,
      emissiveIntensity: 0.5,
      scale: 1.0,
      opacity: 1.0,
    };
  }

  // Unvisited node: subtle glow
  return {
    color: baseColor,
    emissiveColor: baseColor,
    emissiveIntensity: 0.2,
    scale: 1.0,
    opacity: 1.0,
  };
}
