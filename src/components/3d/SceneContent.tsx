import { useEffect, useMemo, type ReactElement } from 'react';

import { useMapInteractionAdapter } from '@/components/map/useMapInteractionAdapter';
import { useSpatialStore } from '@/stores/spatialStore';
import { PERSPECTIVE_COLOR } from '@/styles/designTokens';
import type { StoryNode, CharacterType } from '@/types';

import NodeSphere from './NodeSphere';
import PlaneGuide from './PlaneGuide';

/**
 * Character metadata for visual guides — colours from the shared design tokens.
 */
const CHARACTER_METADATA: Record<string, { color: string; label: string }> = {
  archaeologist: { color: PERSPECTIVE_COLOR.archaeologist, label: 'Past - Discovery' },
  algorithm: { color: PERSPECTIVE_COLOR.algorithm, label: 'Present - Processing' },
  'last-human': { color: PERSPECTIVE_COLOR['last-human'], label: 'Future - Memory' },
};

/**
 * Scene content for 3D visualization
 * Renders node spheres positioned by character layout
 */
export default function SceneContent(): ReactElement {
  const adapter = useMapInteractionAdapter('3d');
  const accessibleNodes = useMemo(() => adapter.nodes.map(({ node }) => node), [adapter.nodes]);
  const computeLayout = useSpatialStore((state) => state.computeLayout);
  const positions = useSpatialStore((state) => state.positions);

  // Group nodes by character in consistent order
  const characters = useMemo(() => {
    const charOrder: CharacterType[] = ['archaeologist', 'algorithm', 'last-human'];
    const charMap = new Map<string, StoryNode[]>();

    accessibleNodes.forEach((node) => {
      // Nodes already filtered to exclude multi-perspective entries, but double-check to be safe
      if (node.character === 'multi-perspective') {
        return;
      }

      const char = node.character;
      const existing = charMap.get(char);
      if (existing) {
        existing.push(node);
      } else {
        charMap.set(char, [node]);
      }
    });

    // Convert to array in consistent order
    return charOrder
      .filter((char) => charMap.has(char))
      .map((char) => {
        const nodes = charMap.get(char);
        if (!nodes) {
          // This should never happen due to the filter above, but TypeScript can't infer this
          throw new Error(`Unexpected: character ${char} missing from charMap`);
        }
        return {
          type: char,
          nodes,
        };
      });
  }, [accessibleNodes]);

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
      const payload = visibleCharacters.map(({ nodes }) => ({ nodes }));
      computeLayout(payload);
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
        if (!metadata) {
          return null;
        }

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
        if (!position) {
          return null;
        }

        return <NodeSphere key={node.id} nodeId={node.id} position={position} />;
      })}
    </>
  );
}
