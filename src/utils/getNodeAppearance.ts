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
 * Character color palette (matches tailwind config)
 */
const CHARACTER_COLORS: Record<string, string> = {
  archaeologist: '#4A90E2', // Blue-500
  algorithm: '#50C878', // Green-500
  'last-human': '#E74C3C', // Red-500
  'multi-perspective': '#9B59B6', // Purple-500
};

/**
 * Darker color palette for locked nodes (using 800 variants for better contrast)
 */
const LOCKED_COLORS: Record<string, string> = {
  archaeologist: '#1e40af', // Blue-800
  algorithm: '#166534', // Green-800
  'last-human': '#991b1b', // Red-800
  'multi-perspective': '#6b21a8', // Purple-800
};

/**
 * Get visual appearance for a node based on its state
 */
export function getNodeAppearance({ character, isActive, isVisited, isLocked }: GetNodeAppearanceParams): NodeAppearance {
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
