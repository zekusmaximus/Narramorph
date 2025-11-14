import { useEffect, useMemo } from 'react';

import NodeSphere from './NodeSphere';
import PlaneGuide from './PlaneGuide';
import { useStoryStore } from '@/stores';
import { useSpatialStore } from '@/stores/spatialStore';
import type { StoryNode, CharacterType } from '@/types';

/**
 * Character metadata for visual guides
 */
const CHARACTER_METADATA: Record<string, { color: string; label: string }> = {
  archaeologist: { color: '#4A90E2', label: 'Past - Discovery' },
  algorithm: { color: '#50C878', label: 'Present - Processing' },
  'last-human': { color: '#E74C3C', label: 'Future - Memory' },
};

/**
 * Scene content for 3D visualization
 * Renders node spheres positioned by character layout
 */
export default function SceneContent() {
  const nodes = useStoryStore((state) => state.nodes);
  const computeLayout = useSpatialStore((state) => state.computeLayout);
  const positions = useSpatialStore((state) => state.positions);

  // Group nodes by character in consistent order
  const characters = useMemo(() => {
    const charOrder: CharacterType[] = ['archaeologist', 'algorithm', 'last-human'];
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

    // Convert to array in consistent order
    return charOrder
      .filter((char) => charMap.has(char))
      .map((char) => ({
        type: char,
        nodes: charMap.get(char)!,
      }));
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

  // Render plane guides and node spheres
  return (
    <>
      {/* Character layer guides */}
      {characters.map((character, index) => {
        const metadata = CHARACTER_METADATA[character.type];
        if (!metadata) return null;

        return (
          <PlaneGuide
            key={`guide-${character.type}`}
            zPosition={index * 25}
            color={metadata.color}
            label={metadata.label}
          />
        );
      })}

      {/* Node spheres */}
      {allNodes.map((node) => {
        const position = positions[node.id];
        if (!position) return null;

        return <NodeSphere key={node.id} nodeId={node.id} position={position} />;
      })}
    </>
  );
}
