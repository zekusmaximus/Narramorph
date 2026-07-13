import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Node } from '@xyflow/react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createMapInteractionAdapter,
  type MapInteractionAdapter,
} from '@/components/map/mapAdapters';
import type { NodeUIState, StoryNode } from '@/types';

import NodeMap from './NodeMap';

const runtime = vi.hoisted(() => ({
  adapter: null as MapInteractionAdapter | null,
  trigger: vi.fn(),
}));
const storyStoreState = vi.hoisted(() => ({
  nodes: new Map(),
  progress: { visitedNodes: {}, readingPath: [], unlockedConnections: [] },
}));

vi.mock('@/components/map/useMapInteractionAdapter', () => ({
  useMapInteractionAdapter: () => runtime.adapter,
}));

vi.mock('@/hooks/useReducedMotionPreference', () => ({
  useReducedMotionPreference: () => true,
}));

vi.mock('@/stores', () => ({
  useStoryStore: (selector: (state: unknown) => unknown) => selector(storyStoreState),
}));

vi.mock('./edgeUtils', () => ({
  convertToReactFlowEdges: () => [],
}));

vi.mock('./NodeMapAtmosphere', () => ({
  NodeMapAtmosphere: () => null,
}));

vi.mock('./NodeMapHud', () => ({
  NodeMapHud: () => null,
}));

vi.mock('./useNodeActivationEffects', () => ({
  useNodeActivationEffects: () => ({
    trigger: runtime.trigger,
    screenShake: false,
  }),
}));

vi.mock('./NodeMapGraph', () => ({
  NodeMapGraph: ({
    nodes,
    onNodeClick,
  }: {
    nodes: Node[];
    onNodeClick: (event: ReactMouseEvent, node: Node) => void;
  }) => (
    <div>
      {nodes.map((node) => (
        <div
          key={node.id}
          className="react-flow__node"
          data-id={node.id}
          role={node.ariaRole}
          aria-label={node.ariaLabel}
          aria-current={node.domAttributes?.['aria-current']}
          tabIndex={node.focusable ? 0 : undefined}
          onClick={(event) => onNodeClick(event, node)}
        >
          <span data-testid={`story-node-${node.id}`}>{node.id}</span>
        </div>
      ))}
      <button type="button">Zoom In</button>
    </div>
  ),
}));

function storyNode(id: string, x: number): StoryNode {
  return {
    id,
    character: 'archaeologist',
    layer: 1,
    title: id === 'alpha' ? 'Alpha Fragment' : 'Beta Fragment',
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

function nodeState(node: StoryNode, visited = false): NodeUIState {
  return {
    id: node.id,
    position: node.position,
    currentState: 'initial',
    visited,
    visitCount: visited ? 2 : 0,
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

function createAdapter(selectedNodeId: string | null = 'alpha'): {
  adapter: MapInteractionAdapter;
  handleKey: MapInteractionAdapter['handleKey'];
  openPanel: (nodeId: string) => void;
  selectNode: (nodeId: string | null) => void;
} {
  const alpha = storyNode('alpha', 0);
  const beta = storyNode('beta', 10);
  const locked = storyNode('locked', 20);
  const nodes = new Map([
    [alpha.id, alpha],
    [beta.id, beta],
    [locked.id, locked],
  ]);
  const selectNode = vi.fn();
  const openPanel = vi.fn();
  const adapter = createMapInteractionAdapter({
    mode: '2d',
    nodes,
    selectedNodeId,
    hoveredNodeId: null,
    panelOpen: false,
    isAnimating: false,
    awarenessLevel: 0,
    visitedNodes: {},
    canVisitNode: (nodeId) => nodeId !== 'locked',
    getNodeState: (nodeId) => nodeState(nodes.get(nodeId) as StoryNode, nodeId === 'alpha'),
    actions: {
      selectNode,
      setHoveredNode: vi.fn(),
      openPanel,
      closePanel: vi.fn(),
    },
  });
  const handleKey = vi.fn(adapter.handleKey);

  return {
    adapter: { ...adapter, handleKey },
    handleKey,
    openPanel,
    selectNode,
  };
}

describe('NodeMap keyboard interaction', () => {
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    runtime.trigger.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    runtime.adapter = null;
  });

  it('moves DOM focus to the adapter arrow target and exposes selected state', () => {
    const setup = createAdapter();
    runtime.adapter = setup.adapter;
    const { rerender } = render(<NodeMap />);

    const map = screen.getByRole('region', { name: 'Archive passage map' });
    const alpha = screen.getByRole('button', { name: /Alpha Fragment.*selected.*available/ });
    const beta = screen.getByRole('button', { name: /Beta Fragment.*not selected.*available/ });
    expect(map.getAttribute('role')).toBe('region');
    expect(map.getAttribute('aria-description')).toMatch(/arrow keys.*Enter or Space.*Escape/);
    expect(map.getAttribute('data-story-map-focus-target')).toBe('true');
    expect(map.getAttribute('tabindex')).toBe('0');
    alpha.focus();

    fireEvent.keyDown(alpha, { key: 'ArrowRight' });

    expect(setup.handleKey).toHaveBeenCalledWith('ArrowRight', 'alpha');
    expect(setup.selectNode).toHaveBeenCalledWith('beta');
    expect(document.activeElement).toBe(beta);

    runtime.adapter = createAdapter('beta').adapter;
    rerender(<NodeMap />);

    const updatedAlpha = screen.getByRole('button', {
      name: /Alpha Fragment.*not selected.*available/,
    });
    const updatedBeta = screen.getByRole('button', {
      name: /Beta Fragment.*selected.*available/,
    });
    expect(updatedAlpha.getAttribute('aria-current')).toBeNull();
    expect(updatedBeta.getAttribute('aria-current')).toBe('true');
  });

  it('leaves nested map controls alone', () => {
    const setup = createAdapter();
    runtime.adapter = setup.adapter;
    render(<NodeMap />);

    const zoom = screen.getByRole('button', { name: 'Zoom In' });
    fireEvent.keyDown(zoom, { key: 'Enter' });

    expect(setup.handleKey).not.toHaveBeenCalled();
    expect(setup.openPanel).not.toHaveBeenCalled();
  });

  it('preserves the available-only 2D node invariant', () => {
    runtime.adapter = createAdapter().adapter;
    render(<NodeMap />);

    expect(screen.queryByTestId('story-node-locked')).toBeNull();
  });

  it('preserves pointer activation through the React Flow node wrapper', () => {
    const setup = createAdapter();
    runtime.adapter = setup.adapter;
    render(<NodeMap />);

    fireEvent.click(screen.getByTestId('story-node-beta'));

    expect(runtime.trigger).toHaveBeenCalledWith('archaeologist', false);
    expect(setup.selectNode).toHaveBeenCalledWith('beta');
    expect(setup.openPanel).toHaveBeenCalledWith('beta');
  });
});
