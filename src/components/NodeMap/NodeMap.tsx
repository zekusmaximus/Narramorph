import { useEdgesState, useNodesState, type Node, type Viewport } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
} from 'react';

import { useMapInteractionAdapter } from '@/components/map/useMapInteractionAdapter';
import { getCharacterLabel } from '@/components/StoryView/storyPresentation';
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';
import { useStoryStore } from '@/stores';

import { buildNodeMapAtmosphereModel } from './atmospherePresentation';
import type { CustomStoryNodeData } from './CustomStoryNode';
import { convertToReactFlowEdges } from './edgeUtils';
import { NodeMapAtmosphere } from './NodeMapAtmosphere';
import { NodeMapGraph } from './NodeMapGraph';
import { NodeMapHud } from './NodeMapHud';
import { getConnectionTargetIds } from './storyNodePresentation';
import { useNodeActivationEffects } from './useNodeActivationEffects';

interface NodeMapProps {
  className?: string;
}

const MINI_MAP_COLORS = {
  archaeologist: '#3b82f6',
  algorithm: '#10b981',
  'last-human': '#ef4444',
  'multi-perspective': '#9c27b0',
} as const;

function toFlowNodes(
  adapter: ReturnType<typeof useMapInteractionAdapter>,
  connectionTargetIds: Set<string>,
  reduceMotion: boolean,
): Node[] {
  return adapter.nodes.map(({ node, state, selected, available }) => ({
    id: node.id,
    type: 'storyNode',
    position: node.position,
    data: {
      node,
      nodeState: state,
      isSelected: selected,
      available,
      isConnectionTarget: connectionTargetIds.has(node.id),
      reduceMotion,
    } satisfies CustomStoryNodeData,
    draggable: false,
    deletable: false,
    selectable: available,
    selected,
    focusable: available,
    ariaRole: available ? 'button' : 'img',
    ariaLabel: [
      node.title,
      getCharacterLabel(node.character),
      node.layer === 1
        ? 'opening passage'
        : node.layer === 2
          ? 'branching passage'
          : node.layer === 3
            ? 'convergence passage'
            : 'final passage',
      state.visited ? `visited ${state.visitCount} times` : 'not yet visited',
      state.currentState === 'metaAware'
        ? 'the passage has fully awakened'
        : state.currentState === 'firstRevisit'
          ? 'the passage changed on return'
          : 'the passage is in its first form',
      selected ? 'selected' : 'not selected',
      available ? 'available' : 'locked',
    ].join(', '),
    domAttributes: {
      'aria-current': selected ? 'true' : undefined,
      'aria-roledescription': 'passage',
    },
  }));
}

function getKeyboardNodeElement(
  root: HTMLDivElement,
  target: EventTarget | null,
): HTMLElement | null {
  if (!(target instanceof Element)) {
    return null;
  }
  const nodeElement = target.closest<HTMLElement>('.react-flow__node[data-id]');
  return nodeElement && root.contains(nodeElement) ? nodeElement : null;
}

function focusNodeElement(root: HTMLDivElement, nodeId: string): void {
  const nodeElement = Array.from(
    root.querySelectorAll<HTMLElement>('.react-flow__node[data-id]'),
  ).find((element) => element.dataset.id === nodeId);
  nodeElement?.focus();
}

export default function NodeMap({ className = '' }: NodeMapProps): ReactElement {
  const adapter = useMapInteractionAdapter('2d');
  const storyNodes = useStoryStore((state) => state.nodes);
  const visitedNodes = useStoryStore((state) => state.progress.visitedNodes);
  const readingPath = useStoryStore((state) => state.progress.readingPath);
  const unlockedConnections = useStoryStore((state) => state.progress.unlockedConnections);
  const reduceMotion = useReducedMotionPreference();
  const activationEffects = useNodeActivationEffects();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [supportsPrecisePointer, setSupportsPrecisePointer] = useState(false);
  const [viewport, setViewport] = useState<Viewport>({ zoom: 1, x: 0, y: 0 });

  const connectionTargetIds = useMemo(
    () => getConnectionTargetIds(storyNodes, adapter.selectedNodeId),
    [adapter.selectedNodeId, storyNodes],
  );
  const flowNodes = useMemo(
    () => toFlowNodes(adapter, connectionTargetIds, reduceMotion),
    [adapter, connectionTargetIds, reduceMotion],
  );
  const flowEdges = useMemo(
    () => convertToReactFlowEdges(storyNodes, unlockedConnections, reduceMotion),
    [reduceMotion, storyNodes, unlockedConnections],
  );
  const atmosphereModel = useMemo(
    () => buildNodeMapAtmosphereModel({ storyNodes, readingPath, visitedNodes }),
    [readingPath, storyNodes, visitedNodes],
  );
  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  useEffect(() => setNodes(flowNodes), [flowNodes, setNodes]);
  useEffect(() => setEdges(flowEdges), [flowEdges, setEdges]);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const pointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const updatePointerSupport = (): void => setSupportsPrecisePointer(pointerQuery.matches);

    updatePointerSupport();
    pointerQuery.addEventListener('change', updatePointerSupport);

    return () => pointerQuery.removeEventListener('change', updatePointerSupport);
  }, []);

  useEffect(() => {
    if (!supportsPrecisePointer) {
      return undefined;
    }

    const handleMouseMove = (event: globalThis.MouseEvent): void => {
      const position = { x: event.clientX, y: event.clientY };
      setTooltipPosition(position);
      if (!reduceMotion) {
        setMousePosition(position);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [reduceMotion, supportsPrecisePointer]);

  const handleNodeClick = useCallback(
    (_event: ReactMouseEvent, flowNode: Node): void => {
      const node = adapter.getNode(flowNode.id);
      if (node === undefined || !node.available) {
        return;
      }
      activationEffects.trigger(node.node.character, node.visited);
      adapter.activate(flowNode.id);
    },
    [activationEffects, adapter],
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const root = event.currentTarget;
    const nodeElement = getKeyboardNodeElement(root, event.target);
    const originatedOnMap = event.target === root;

    // React Flow's controls are nested inside the map. Leave their keyboard
    // activation alone instead of treating Enter or Space as node activation.
    if (!originatedOnMap && nodeElement === null) {
      return;
    }

    const currentNodeId = nodeElement?.dataset.id ?? adapter.selectedNodeId;
    const result = adapter.handleKey(event.key, currentNodeId);
    if (!result.handled) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (event.key.startsWith('Arrow') && result.targetId !== null) {
      const targetId = result.targetId;
      requestAnimationFrame(() => focusNodeElement(root, targetId));
    }
  };

  const getNodeColor = useCallback(
    (flowNode: Node): string => {
      const node = adapter.getNode(flowNode.id);
      return node ? MINI_MAP_COLORS[node.node.character] : '#9ca3af';
    },
    [adapter],
  );

  const totalNodes = storyNodes.size;
  const visitedCount = Object.keys(visitedNodes).length;

  return (
    <div
      className={`relative w-full h-full bg-[#0a0e12] ${className}`}
      style={{ minHeight: '100%' }}
      role="region"
      aria-label="Archive passage map"
      aria-description="Use the arrow keys to move between available passages. Press Enter or Space to open the selected passage, and Escape to close it."
      data-story-map-focus-target="true"
      tabIndex={0}
      onKeyDownCapture={handleKeyDown}
    >
      <NodeMapAtmosphere
        model={atmosphereModel}
        mousePosition={mousePosition}
        viewportZoom={viewport.zoom}
        showFogOfWar={false}
        showTrail
        reduceMotion={reduceMotion}
      />

      <NodeMapGraph
        nodes={nodes}
        edges={edges}
        screenShake={activationEffects.screenShake}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onNodeMouseEnter={(node) => adapter.hover(node.id)}
        onNodeMouseLeave={() => adapter.hover(null)}
        onViewportChange={setViewport}
        getNodeColor={getNodeColor}
        reduceMotion={reduceMotion}
      />

      <NodeMapHud
        totalNodes={totalNodes}
        visitedCount={visitedCount}
        availableCount={adapter.nodes.filter((node) => node.available).length}
        hoveredNodeId={adapter.hoveredNodeId}
        tooltipPosition={tooltipPosition}
        showTooltip={supportsPrecisePointer}
      />
    </div>
  );
}
