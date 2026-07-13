import type { NodeUIState, StoryNode } from '@/types';

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
