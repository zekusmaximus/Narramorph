import type { CharacterType } from '@/types';

interface NodeAppearance {
  color: string;
  emissiveColor: string;
  emissiveIntensity: number;
  scale: number;
  opacity: number;
}

interface GetNodeAppearanceParams {
  character: CharacterType;
  isActive: boolean;
  isVisited: boolean;
  isLocked: boolean;
  awarenessLevel: number;
}

/**
 * Character color palette
 */
const CHARACTER_COLORS: Record<string, string> = {
  archaeologist: '#4A90E2', // Blue
  algorithm: '#50C878', // Green
  'last-human': '#E74C3C', // Red
  'multi-perspective': '#9B59B6', // Purple
};

/**
 * Darker color palette for locked nodes
 */
const LOCKED_COLORS: Record<string, string> = {
  archaeologist: '#2D5A8F', // Darker blue
  algorithm: '#2F7A4D', // Darker green
  'last-human': '#8F2E1E', // Darker red
  'multi-perspective': '#5E366F', // Darker purple
};

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
