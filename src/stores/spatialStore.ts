import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import type { StoryNode } from '@/types';

/**
 * Character with nodes for spatial layout
 */
interface Character {
  nodes: StoryNode[];
}

/**
 * Spatial store state
 */
interface SpatialState {
  positions: Record<string, [number, number, number]>;
  computeLayout: (characters: Character[]) => void;
}

/**
 * Spatial store for 3D node positioning
 */
export const useSpatialStore = create<SpatialState>()(
  immer((set) => ({
    // Initial state
    positions: {},

    // Actions
    computeLayout: (characters: Character[]) => {
      set((state) => {
        const newPositions: Record<string, [number, number, number]> = {};

        characters.forEach((character, characterIndex) => {
          const z = characterIndex * 25;
          const totalNodes = character.nodes.length;
          const radius = 15;

          character.nodes.forEach((node, nodeIndex) => {
            const angle = (nodeIndex / totalNodes) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            newPositions[node.id] = [x, y, z];
          });
        });

        state.positions = newPositions;
      });
    },
  })),
);
