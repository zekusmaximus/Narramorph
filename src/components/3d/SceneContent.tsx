import { useEffect, useMemo, type ReactElement } from 'react';

import { useMapInteractionAdapter } from '@/components/map/useMapInteractionAdapter';
import { useSpatialStore } from '@/stores/spatialStore';
import { PERSPECTIVE_COLOR } from '@/styles/designTokens';

import NodeSphere from './NodeSphere';
import PlaneGuide from './PlaneGuide';
import { selectSceneNodeGroups } from './sceneNodes';

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

  // Shared scene-node selection (same source the accessible companion list uses,
  // so the canvas and the list can never drift).
  const visibleCharacters = useMemo(
    () => selectSceneNodeGroups(accessibleNodes),
    [accessibleNodes],
  );

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
