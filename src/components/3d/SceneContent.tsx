import { useEffect, useMemo } from 'react';

import NodeSphere from './NodeSphere';
import { useStoryStore } from '@/stores';
import { useSpatialStore } from '@/stores/spatialStore';
import type { StoryNode } from '@/types';

/**
 * Scene content for 3D visualization
 * Renders node spheres positioned by character layout
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

  // Flatten all nodes from all characters
  const allNodes = useMemo(() => {
    return characters.flatMap((character) => character.nodes);
  }, [characters]);

  // Render NodeSphere for each node
  return (
    <>
      {allNodes.map((node) => {
        const position = positions[node.id];
        if (!position) return null;

        return <NodeSphere key={node.id} nodeId={node.id} position={position} />;
      })}
    </>
  );
}
