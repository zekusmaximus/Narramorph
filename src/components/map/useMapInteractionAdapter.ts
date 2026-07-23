import { useMemo } from 'react';

import { useStoryStore } from '@/stores';

import {
  createMapInteractionAdapter,
  type MapInteractionAdapter,
  type MapMode,
} from './mapAdapters';

export function useMapInteractionAdapter(mode: MapMode): MapInteractionAdapter {
  const nodes = useStoryStore((state) => state.nodes);
  const selectedNodeId = useStoryStore((state) => state.selectedNode);
  const hoveredNodeId = useStoryStore((state) => state.hoveredNode);
  const panelOpen = useStoryStore((state) => state.storyViewOpen);
  const isAnimating = useStoryStore((state) => state.isAnimating);
  // Subscribe to the whole progress object: node availability can change on any
  // progress advance (e.g. completing a convergence unlocks an ending without
  // touching visitedNodes), and canVisitNode reads live state, so the adapter
  // must recompute whenever progress moves at all.
  const progress = useStoryStore((state) => state.progress);
  const canVisitNode = useStoryStore((state) => state.canVisitNode);
  const getNodeState = useStoryStore((state) => state.getNodeState);
  const selectNode = useStoryStore((state) => state.selectNode);
  const setHoveredNode = useStoryStore((state) => state.setHoveredNode);
  const openPanel = useStoryStore((state) => state.openStoryView);
  const closePanel = useStoryStore((state) => state.closeStoryView);

  return useMemo(
    () =>
      createMapInteractionAdapter({
        mode,
        nodes,
        selectedNodeId,
        hoveredNodeId,
        panelOpen,
        isAnimating,
        awarenessLevel: progress.temporalAwarenessLevel,
        visitedNodes: progress.visitedNodes,
        canVisitNode,
        getNodeState,
        actions: {
          selectNode,
          setHoveredNode,
          openPanel,
          closePanel,
        },
      }),
    [
      canVisitNode,
      closePanel,
      getNodeState,
      hoveredNodeId,
      isAnimating,
      mode,
      nodes,
      openPanel,
      panelOpen,
      progress,
      selectNode,
      selectedNodeId,
      setHoveredNode,
    ],
  );
}
