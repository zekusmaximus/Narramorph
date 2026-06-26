import type { NodeUIState, StoryNode, VisitRecord } from '@/types';
import type { NodeAppearance } from '@/utils/getNodeAppearance';
import { getNodeAppearance } from '@/utils/getNodeAppearance';

export type MapMode = '2d' | '3d';
export type MapNavigationDirection = 'previous' | 'next';

export interface MapNodeAdapter {
  node: StoryNode;
  state: NodeUIState;
  available: boolean;
  selected: boolean;
  hovered: boolean;
  visited: boolean;
  appearance: NodeAppearance;
}

export interface MapPanelAdapter {
  open: boolean;
  nodeId: string | null;
  close: () => void;
}

export interface MapAdapterActions {
  selectNode: (nodeId: string | null) => void;
  setHoveredNode: (nodeId: string | null) => void;
  openPanel: (nodeId: string) => void;
  closePanel: () => void;
}

export interface MapAdapterInput {
  mode: MapMode;
  nodes: Map<string, StoryNode>;
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  panelOpen: boolean;
  isAnimating: boolean;
  awarenessLevel: number;
  visitedNodes: Record<string, VisitRecord>;
  canVisitNode: (nodeId: string) => boolean;
  getNodeState: (nodeId: string) => NodeUIState;
  actions: MapAdapterActions;
}

export interface MapKeyboardResult {
  handled: boolean;
  targetId: string | null;
  activated: boolean;
}

export interface MapInteractionAdapter {
  mode: MapMode;
  nodes: MapNodeAdapter[];
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  panel: MapPanelAdapter;
  getNode: (nodeId: string) => MapNodeAdapter | undefined;
  select: (nodeId: string) => boolean;
  hover: (nodeId: string | null) => boolean;
  activate: (nodeId: string) => boolean;
  navigate: (currentNodeId: string | null, direction: MapNavigationDirection) => string | null;
  handleKey: (key: string, currentNodeId?: string | null) => MapKeyboardResult;
}

function compareNodes(left: MapNodeAdapter, right: MapNodeAdapter): number {
  if (left.node.layer !== right.node.layer) {
    return left.node.layer - right.node.layer;
  }
  if (left.node.position.y !== right.node.position.y) {
    return left.node.position.y - right.node.position.y;
  }
  if (left.node.position.x !== right.node.position.x) {
    return left.node.position.x - right.node.position.x;
  }
  return left.node.id.localeCompare(right.node.id);
}

function isVisibleInMode(mode: MapMode, node: MapNodeAdapter): boolean {
  if (mode === '2d') {
    return node.available;
  }
  return node.node.character !== 'multi-perspective' && (node.available || node.visited);
}

export function createMapInteractionAdapter(input: MapAdapterInput): MapInteractionAdapter {
  const adaptedNodes = Array.from(input.nodes.values())
    .map((node): MapNodeAdapter => {
      const available = input.canVisitNode(node.id);
      const visited = (input.visitedNodes[node.id]?.visitCount ?? 0) > 0;
      return {
        node,
        state: input.getNodeState(node.id),
        available,
        selected: input.selectedNodeId === node.id,
        hovered: input.hoveredNodeId === node.id,
        visited,
        appearance: getNodeAppearance({
          character: node.character,
          isActive: input.selectedNodeId === node.id,
          isVisited: visited,
          isLocked: !available,
          awarenessLevel: input.awarenessLevel,
        }),
      };
    })
    .filter((node) => isVisibleInMode(input.mode, node))
    .sort(compareNodes);

  const byId = new Map(adaptedNodes.map((node) => [node.node.id, node]));

  const select = (nodeId: string): boolean => {
    const node = byId.get(nodeId);
    if (node === undefined || !node.available || input.isAnimating) {
      return false;
    }
    input.actions.selectNode(nodeId);
    return true;
  };

  const hover = (nodeId: string | null): boolean => {
    if (nodeId === null) {
      input.actions.setHoveredNode(null);
      return true;
    }
    const node = byId.get(nodeId);
    if (node === undefined || !node.available) {
      return false;
    }
    input.actions.setHoveredNode(nodeId);
    return true;
  };

  const activate = (nodeId: string): boolean => {
    if (!select(nodeId)) {
      return false;
    }
    input.actions.openPanel(nodeId);
    return true;
  };

  const navigate = (
    currentNodeId: string | null,
    direction: MapNavigationDirection,
  ): string | null => {
    const availableNodes = adaptedNodes.filter((node) => node.available);
    if (availableNodes.length === 0) {
      return null;
    }

    const currentIndex = availableNodes.findIndex((node) => node.node.id === currentNodeId);
    const delta = direction === 'next' ? 1 : -1;
    const baseIndex = currentIndex < 0 ? (direction === 'next' ? -1 : 0) : currentIndex;
    const nextIndex = (baseIndex + delta + availableNodes.length) % availableNodes.length;
    return availableNodes[nextIndex]?.node.id ?? null;
  };

  const handleKey = (key: string, currentNodeId = input.selectedNodeId): MapKeyboardResult => {
    if (key === 'Escape' && input.panelOpen) {
      input.actions.closePanel();
      return { handled: true, targetId: currentNodeId, activated: false };
    }

    const direction =
      key === 'ArrowRight' || key === 'ArrowDown'
        ? 'next'
        : key === 'ArrowLeft' || key === 'ArrowUp'
          ? 'previous'
          : null;
    if (direction !== null) {
      const targetId = navigate(currentNodeId, direction);
      if (targetId !== null) {
        select(targetId);
      }
      return { handled: true, targetId, activated: false };
    }

    if (key === 'Enter' || key === ' ') {
      const targetId = currentNodeId ?? navigate(null, 'next');
      const activated = targetId === null ? false : activate(targetId);
      return { handled: true, targetId, activated };
    }

    return { handled: false, targetId: currentNodeId, activated: false };
  };

  return {
    mode: input.mode,
    nodes: adaptedNodes,
    selectedNodeId: input.selectedNodeId,
    hoveredNodeId: input.hoveredNodeId,
    panel: {
      open: input.panelOpen,
      nodeId: input.panelOpen ? input.selectedNodeId : null,
      close: input.actions.closePanel,
    },
    getNode: (nodeId) => byId.get(nodeId),
    select,
    hover,
    activate,
    navigate,
    handleKey,
  };
}
