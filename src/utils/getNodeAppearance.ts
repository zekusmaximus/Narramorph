import type { CharacterType } from '@/types';

interface NodeAppearance {
  color: string;
  emissiveColor: string;
  emissiveIntensity: number;
}

interface GetNodeAppearanceParams {
  character: CharacterType;
  isActive: boolean;
  isVisited: boolean;
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
 * Get visual appearance for a node based on its state
 */
export function getNodeAppearance({
  character,
  isActive,
  isVisited,
}: GetNodeAppearanceParams): NodeAppearance {
  const baseColor = CHARACTER_COLORS[character] || '#CCCCCC';

  // Active node: bright glow
  if (isActive) {
    return {
      color: baseColor,
      emissiveColor: baseColor,
      emissiveIntensity: 2.0,
    };
  }

  // Visited node: medium glow
  if (isVisited) {
    return {
      color: baseColor,
      emissiveColor: baseColor,
      emissiveIntensity: 0.5,
    };
  }

  // Unvisited node: subtle glow
  return {
    color: baseColor,
    emissiveColor: baseColor,
    emissiveIntensity: 0.2,
  };
}
