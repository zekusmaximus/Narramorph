import { useEffect, useMemo } from 'react';

import { useStoryStore } from '@/stores';
import { useSpatialStore } from '@/stores/spatialStore';
import type { StoryNode } from '@/types';

/**
 * Scene content for 3D visualization
 * Renders test spheres positioned by character layout
 */
export default function SceneContent() {
  const nodes = useStoryStore((state) => state.nodes);
  const computeLayout = useSpatialStore((state) => state.computeLayout);
  const positions = useSpatialStore((state) => state.positions);

  // Group nodes by character
  const characters = useMemo(() => {
    const charMap = new Map<string, StoryNode[]>();

    nodes.forEach((node) => {
      // Skip multi-perspective nodes
      if (node.character === 'multi-perspective') return;

      const char = node.character;
      if (!charMap.has(char)) {
        charMap.set(char, []);
      }
      charMap.get(char)!.push(node);
    });

    // Convert to array of { nodes: StoryNode[] }
    return Array.from(charMap.values()).map((nodeList) => ({ nodes: nodeList }));
  }, [nodes]);

  // Compute layout when characters change
  useEffect(() => {
    if (characters.length > 0) {
      computeLayout(characters);
    }
  }, [characters, computeLayout]);

  // Log positions for debugging
  useEffect(() => {
    if (Object.keys(positions).length > 0) {
      console.log('[SceneContent] Computed positions:', positions);
    }
  }, [positions]);

  // Render test spheres - one per character at first node position
  return (
    <>
      {characters.map((character, index) => {
        const firstNode = character.nodes[0];
        if (!firstNode || !positions[firstNode.id]) return null;

        const [x, y, z] = positions[firstNode.id];

        return (
          <mesh key={`char-${index}`} position={[x, y, z]}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial color={index === 0 ? '#4A90E2' : index === 1 ? '#50C878' : '#E74C3C'} />
          </mesh>
        );
      })}
    </>
  );
}
