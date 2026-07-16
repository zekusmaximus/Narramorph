import { useMemo } from 'react';

import { resolveEntryBridge, type ResolvedBridge } from '@/domain/bridges/edgeBridge';
import { useStoryStore } from '@/stores';

/**
 * Resolves the condition-aware edge prose for the edge the reader just crossed into `toNodeId`.
 *
 * The "from" node is the passage visited immediately before this one, read from the reading path so
 * it stays correct across revisits. Returns `null` when there is no crossed edge, no matching
 * connection, or the connection carries no bridge — which is the case for every passage until a
 * connection is deliberately authored with bridge prose.
 */
export function useEdgeBridge(toNodeId: string | null): ResolvedBridge | null {
  const connections = useStoryStore((state) => state.connections);
  const readingPath = useStoryStore((state) => state.progress.readingPath);
  const getConditionContext = useStoryStore((state) => state.getConditionContext);

  return useMemo(() => {
    if (!toNodeId) {
      return null;
    }
    const lastIndex = readingPath.lastIndexOf(toNodeId);
    const fromNodeId = lastIndex > 0 ? readingPath[lastIndex - 1] : null;
    const context = getConditionContext(toNodeId);
    return resolveEntryBridge(connections, fromNodeId, toNodeId, context);
  }, [toNodeId, connections, readingPath, getConditionContext]);
}
