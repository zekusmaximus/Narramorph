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
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';
import { useStoryStore } from '@/stores';

import { BootSequence } from './BootSequence';
import type { CustomStoryNodeData } from './CustomStoryNode';
import { convertToReactFlowEdges } from './edgeUtils';
import { NodeMapAtmosphere } from './NodeMapAtmosphere';
import { NodeMapGraph } from './NodeMapGraph';
import { NodeMapHud } from './NodeMapHud';
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

function toFlowNodes(adapter: ReturnType<typeof useMapInteractionAdapter>): Node[] {
  return adapter.nodes.map(({ node, state, selected, available }) => ({
    id: node.id,
    type: 'storyNode',
    position: node.position,
    data: {
      node,
      nodeState: state,
      isSelected: selected,
      available,
    } satisfies CustomStoryNodeData,
    draggable: false,
    selectable: true,
    focusable: true,
    ariaLabel: `${node.title}, ${available ? 'available' : 'locked'}`,
  }));
}

export default function NodeMap({ className = '' }: NodeMapProps): ReactElement {
  const adapter = useMapInteractionAdapter('2d');
  const storyNodes = useStoryStore((state) => state.nodes);
  const progress = useStoryStore((state) => state.progress);
  const storyData = useStoryStore((state) => state.storyData);
  const reduceMotion = useReducedMotionPreference();
  const activationEffects = useNodeActivationEffects();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [bootComplete, setBootComplete] = useState(false);
  const [viewport, setViewport] = useState<Viewport>({ zoom: 1, x: 0, y: 0 });

  const flowNodes = useMemo(() => toFlowNodes(adapter), [adapter]);
  const flowEdges = useMemo(
    () => convertToReactFlowEdges(storyNodes, progress),
    [progress, storyNodes],
  );
  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  useEffect(() => setNodes(flowNodes), [flowNodes, setNodes]);
  useEffect(() => setEdges(flowEdges), [flowEdges, setEdges]);

  useEffect(() => {
    if (reduceMotion) {
      return undefined;
    }
    const handleMouseMove = (event: globalThis.MouseEvent): void => {
      const position = { x: event.clientX, y: event.clientY };
      setMousePosition(position);
      setTooltipPosition(position);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [reduceMotion]);

  const handleNodeClick = useCallback(
    (_event: ReactMouseEvent, flowNode: Node): void => {
      const node = adapter.getNode(flowNode.id);
      if (node === undefined) {
        return;
      }
      activationEffects.trigger(node.node.character, node.visited);
      adapter.activate(flowNode.id);
    },
    [activationEffects, adapter],
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const result = adapter.handleKey(event.key);
    if (result.handled) {
      event.preventDefault();
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
  const visitedCount = Object.keys(progress.visitedNodes).length;
  const showBoot = storyData !== null && !bootComplete && !reduceMotion;

  return (
    <div
      className={`relative w-full h-full bg-[#0a0e12] ${className}`}
      style={{ minHeight: '100%' }}
      role="application"
      aria-label="Interactive story node map"
      aria-description="Use arrow keys to select nodes, Enter to open, and Escape to close the story panel."
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {showBoot && <BootSequence onComplete={() => setBootComplete(true)} />}

      <NodeMapAtmosphere
        storyNodes={storyNodes}
        mousePosition={mousePosition}
        viewportZoom={viewport.zoom}
        showFogOfWar={false}
        showTrail
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
      />

      <NodeMapHud
        totalNodes={totalNodes}
        visitedCount={visitedCount}
        glitchActive={activationEffects.glitchActive}
        glitchColor={activationEffects.glitchColor}
        hoveredNodeId={adapter.hoveredNodeId}
        tooltipPosition={tooltipPosition}
      />
    </div>
  );
}
