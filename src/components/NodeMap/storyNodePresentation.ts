import type { NodeUIState, StoryNode } from '@/types';

/**
 * Centralised z-index scale for the map chrome so the layers cannot drift apart.
 * atmosphere/parallax 0 · edges 5 · edge labels 10 · nodes + labels 20 ·
 * catalog slip + zoom controls 30. Notices (40) and dialogs (50) are owned elsewhere;
 * nothing in the map may claim ≥ 30 except the slip and the controls.
 */
export const MAP_Z = {
  atmosphere: 0,
  edges: 5,
  edgeLabels: 10,
  nodes: 20,
  chrome: 30,
} as const;

export interface StoryNodePresentation {
  size: number;
  canVisit: boolean;
  isVisited: boolean;
  isMetaAware: boolean;
  isCritical: boolean;
  isConnectionTarget: boolean;
  reduceMotion: boolean;
}

export function getConnectionTargetIds(
  nodes: Map<string, StoryNode>,
  selectedNodeId: string | null,
): Set<string> {
  if (selectedNodeId === null) {
    return new Set();
  }
  const selectedNode = nodes.get(selectedNodeId);
  return new Set(selectedNode?.connections?.map((connection) => connection.targetId) ?? []);
}

export function buildStoryNodePresentation(input: {
  node: StoryNode;
  nodeState: NodeUIState;
  available: boolean;
  isConnectionTarget: boolean;
  reduceMotion: boolean;
}): StoryNodePresentation {
  return {
    size: input.node.metadata.criticalPath ? 80 : 60,
    canVisit: input.available,
    isVisited: input.nodeState.visited,
    isMetaAware: input.nodeState.currentState === 'metaAware',
    isCritical: input.node.metadata.criticalPath,
    isConnectionTarget: input.isConnectionTarget,
    reduceMotion: input.reduceMotion,
  };
}
