import type { MapNodeAdapter } from '@/components/map/mapAdapters';
import type { ConnectionType } from '@/types';

import type { SceneVec3 } from './sceneConfig';

export interface SceneConnectionDescriptor {
  id: string;
  sourceId: string;
  targetId: string;
  source: SceneVec3;
  target: SceneVec3;
  type: ConnectionType;
  bidirectional: boolean;
  locked: boolean;
  highlighted: boolean;
}

/**
 * Select only connections whose endpoints are present in the bounded 3D scene.
 * Locked routes remain visible as dashed lines so the constellation communicates
 * future structure without implying that the destination can already be opened.
 */
export function selectSceneConnections(
  sceneNodes: readonly MapNodeAdapter[],
  positions: Readonly<Record<string, SceneVec3>>,
): SceneConnectionDescriptor[] {
  const byId = new Map(sceneNodes.map((entry) => [entry.node.id, entry]));
  const result: SceneConnectionDescriptor[] = [];

  for (const sourceEntry of sceneNodes) {
    const source = positions[sourceEntry.node.id];
    if (!source) {
      continue;
    }

    for (const connection of sourceEntry.node.connections ?? []) {
      const targetEntry = byId.get(connection.targetId);
      const target = positions[connection.targetId];
      if (!targetEntry || !target) {
        continue;
      }

      result.push({
        id: `${sourceEntry.node.id}-${connection.targetId}`,
        sourceId: sourceEntry.node.id,
        targetId: connection.targetId,
        source,
        target,
        type: connection.type,
        bidirectional: connection.bidirectional ?? false,
        locked: !sourceEntry.available || !targetEntry.available,
        highlighted: sourceEntry.selected || targetEntry.selected,
      });
    }
  }

  return result;
}
