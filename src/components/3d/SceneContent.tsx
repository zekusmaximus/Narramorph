import { useEffect, useMemo } from 'react';

import NodeSphere from './NodeSphere';
import PlaneGuide from './PlaneGuide';
import { useStoryStore } from '@/stores';
import { useSpatialStore } from '@/stores/spatialStore';
import type { StoryNode, CharacterType } from '@/types';

/**
 * Character metadata for visual guides (matches tailwind config)
 */
const CHARACTER_METADATA: Record<string, { color: string; label: string }> = {
  archaeologist: { color: '#4A90E2', label: 'Past - Discovery' }, // Blue-500
  algorithm: { color: '#50C878', label: 'Present - Processing' }, // Green-500
  'last-human': { color: '#E74C3C', label: 'Future - Memory' }, // Red-500
};

/**
 * Scene content for 3D visualization
 * Renders node spheres positioned by character layout
 */
export default function SceneContent() {
  const nodes = useStoryStore((state) => Array.from(state.nodes.values()));
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

  // Ensure predictable ordering, limit to spec maximum of 19 nodes total
  const visibleCharacters = useMemo(() => {
    let remaining = 19;
    const result: { type: CharacterType; nodes: StoryNode[] }[] = [];

    for (const character of characters) {
      if (remaining <= 0) {
        break;
      }

      const sortedNodes = [...character.nodes].sort((a, b) => {
        if (a.layer !== b.layer) {
          return a.layer - b.layer;
        }

        const titleA = a.metadata?.chapterTitle ?? a.title ?? a.id;
        const titleB = b.metadata?.chapterTitle ?? b.title ?? b.id;
        return titleA.localeCompare(titleB);
      });

      const limitedNodes = sortedNodes.slice(0, remaining);
      if (limitedNodes.length === 0) {
        continue;
      }

      result.push({
        type: character.type,
        nodes: limitedNodes,
      });
      remaining -= limitedNodes.length;
    }

    return result;
  }, [characters]);

  // Compute layout when characters change
  useEffect(() => {
    if (visibleCharacters.length > 0) {
      computeLayout(visibleCharacters.map(({ nodes }) => ({ nodes })));
    } else {
      computeLayout([]);
    }
  }, [computeLayout, visibleCharacters]);

  // Flatten all nodes from all characters
  const allNodes = useMemo(() => {
    return visibleCharacters.flatMap((character) => character.nodes);
  }, [visibleCharacters]);

  // Render plane guides and node spheres
  return (
    <>
      {/* Character layer guides */}
      {visibleCharacters.map((character, index) => {
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
