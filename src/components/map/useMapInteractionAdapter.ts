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
  const awarenessLevel = useStoryStore((state) => state.progress.temporalAwarenessLevel);
  const visitedNodes = useStoryStore((state) => state.progress.visitedNodes);
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
        awarenessLevel,
        visitedNodes,
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
      awarenessLevel,
      visitedNodes,
      selectNode,
      selectedNodeId,
      setHoveredNode,
    ],
  );
}
