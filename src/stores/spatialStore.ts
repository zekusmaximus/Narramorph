import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import type { StoryNode } from '@/types';

type Vec3 = [number, number, number];

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
  positions: Record<string, Vec3>;
  computeLayout: (characters: Character[]) => void;
}

function shallowEqualPositions(a: Record<string, Vec3>, b: Record<string, Vec3>): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);

  if (aKeys.length !== bKeys.length) {
    return false;
  }

  for (const key of aKeys) {
    const av = a[key];
    const bv = b[key];

    if (!bv) {
      return false;
    }

    if (av[0] !== bv[0] || av[1] !== bv[1] || av[2] !== bv[2]) {
      return false;
    }
  }

  return true;
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
        const newPositions: Record<string, Vec3> = {};

        characters.forEach((character, characterIndex) => {
          const z = characterIndex * 25;
          const totalNodes = character.nodes.length;
          const radius = 15;

          if (totalNodes === 0) {
            return;
          }

          character.nodes.forEach((node, nodeIndex) => {
            const angle = (nodeIndex / totalNodes) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            newPositions[node.id] = [x, y, z];
          });
        });

        if (shallowEqualPositions(state.positions, newPositions)) {
          // Skip notifying subscribers when layout inputs are identical
          return;
        }

        state.positions = newPositions;
      });
    },
  })),
);
