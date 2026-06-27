import { describe, expect, it, vi } from 'vitest';

import type { NodeUIState, StoryNode, VisitRecord } from '@/types';

import {
  createMapInteractionAdapter,
  type MapAdapterActions,
  type MapInteractionAdapter,
  type MapMode,
} from './mapAdapters';

function storyNode(
  id: string,
  x: number,
  character: StoryNode['character'] = 'archaeologist',
): StoryNode {
  return {
    id,
    character,
    layer: 1,
    title: id,
    position: { x, y: 0 },
    content: { initial: '', firstRevisit: '', metaAware: '' },
    connections: [],
    visualState: { defaultColor: '#fff', size: 1 },
    metadata: {
      estimatedReadTime: 1,
      thematicTags: [],
      narrativeAct: 1,
      criticalPath: false,
    },
  };
}

function nodeState(node: StoryNode): NodeUIState {
  return {
    id: node.id,
    position: node.position,
    currentState: 'initial',
    visited: false,
    visitCount: 0,
    transformationAvailable: false,
    highlighted: false,
    connected: false,
    visualProperties: {
      color: '#fff',
      size: 1,
      opacity: 1,
      glow: false,
      pulse: false,
    },
  };
}

function createActions(): MapAdapterActions {
  return {
    selectNode: vi.fn(),
    setHoveredNode: vi.fn(),
    openPanel: vi.fn(),
    closePanel: vi.fn(),
  };
}

function buildAdapter(
  mode: MapMode,
  actions: MapAdapterActions,
  overrides: {
    available?: Set<string>;
    visitedNodes?: Record<string, VisitRecord>;
    selectedNodeId?: string | null;
    panelOpen?: boolean;
  } = {},
): MapInteractionAdapter {
  const nodeList = [
    storyNode('alpha', 0),
    storyNode('beta', 10),
    storyNode('locked', 20),
    storyNode('multi', 30, 'multi-perspective'),
  ];
  const nodes = new Map(nodeList.map((node) => [node.id, node]));
  const available = overrides.available ?? new Set(['alpha', 'beta', 'multi']);

  return createMapInteractionAdapter({
    mode,
    nodes,
    selectedNodeId: overrides.selectedNodeId ?? null,
    hoveredNodeId: null,
    panelOpen: overrides.panelOpen ?? false,
    isAnimating: false,
    awarenessLevel: 0,
    visitedNodes: overrides.visitedNodes ?? {},
    canVisitNode: (nodeId) => available.has(nodeId),
    getNodeState: (nodeId) => {
      const node = nodes.get(nodeId);
      if (node === undefined) {
        throw new Error(`Missing test node: ${nodeId}`);
      }
      return nodeState(node);
    },
    actions,
  });
}

describe.each<MapMode>(['2d', '3d'])('%s map interaction adapter', (mode) => {
  it('shares selection, hover, activation, and panel behavior', () => {
    const actions = createActions();
    const adapter = buildAdapter(mode, actions);

    expect(adapter.hover('alpha')).toBe(true);
    expect(adapter.activate('alpha')).toBe(true);
    expect(actions.setHoveredNode).toHaveBeenCalledWith('alpha');
    expect(actions.selectNode).toHaveBeenCalledWith('alpha');
    expect(actions.openPanel).toHaveBeenCalledWith('alpha');
  });

  it('supports cyclic keyboard navigation and activation', () => {
    const actions = createActions();
    const adapter = buildAdapter(mode, actions, { selectedNodeId: 'alpha' });

    expect(adapter.handleKey('ArrowRight')).toMatchObject({
      handled: true,
      targetId: 'beta',
      activated: false,
    });
    expect(adapter.handleKey('Enter', 'beta')).toMatchObject({
      handled: true,
      targetId: 'beta',
      activated: true,
    });
    expect(actions.selectNode).toHaveBeenCalledWith('beta');
    expect(actions.openPanel).toHaveBeenCalledWith('beta');
  });

  it('blocks unavailable nodes and closes an open panel with Escape', () => {
    const actions = createActions();
    const adapter = buildAdapter(mode, actions, {
      selectedNodeId: 'alpha',
      panelOpen: true,
    });

    expect(adapter.activate('locked')).toBe(false);
    expect(adapter.handleKey('Escape')).toMatchObject({ handled: true });
    expect(actions.openPanel).not.toHaveBeenCalledWith('locked');
    expect(actions.closePanel).toHaveBeenCalledOnce();
  });
});

describe('mode-specific visibility', () => {
  it('keeps visited-but-now-locked nodes in 3D while 2D preserves its available-only view', () => {
    const visit: VisitRecord = {
      visitCount: 1,
      visitTimestamps: [],
      currentState: 'initial',
      timeSpent: 0,
      lastVisited: '',
    };
    const actions = createActions();
    const options = {
      available: new Set(['alpha', 'beta']),
      visitedNodes: { locked: visit },
    };

    expect(buildAdapter('2d', actions, options).getNode('locked')).toBeUndefined();
    expect(buildAdapter('3d', actions, options).getNode('locked')).toBeDefined();
    expect(buildAdapter('3d', actions, options).getNode('multi')).toBeUndefined();
  });

  it('derives the same appearance in both modes for the same node state', () => {
    const actions = createActions();
    const twoDimensional = buildAdapter('2d', actions).getNode('alpha');
    const threeDimensional = buildAdapter('3d', actions).getNode('alpha');

    expect(twoDimensional?.appearance).toEqual(threeDimensional?.appearance);
  });
});
