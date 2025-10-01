import { useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  BackgroundVariant,
  type OnNodesChange,
  type OnEdgesChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useStoryStore } from '@/stores';
import type { StoryNode, NodeUIState } from '@/types';
import CustomStoryNode, { type CustomStoryNodeData } from './CustomStoryNode';
import { convertToReactFlowEdges } from './edgeUtils';

interface NodeMapProps {
  className?: string;
}

/**
 * Character themes for mini-map node coloring
 */
const CHARACTER_THEMES = {
  archaeologist: '#3b82f6',
  algorithm: '#10b981',
  human: '#ef4444',
} as const;

/**
 * Convert StoryNode to React Flow node format
 */
function convertToReactFlowNodes(
  storyNodes: Map<string, StoryNode>,
  getNodeState: (id: string) => NodeUIState,
  selectedNode: string | null
): Node[] {
  return Array.from(storyNodes.values()).map((node) => {
    const nodeState = getNodeState(node.id);

    return {
      id: node.id,
      type: 'storyNode',
      position: node.position,
      data: {
        node,
        nodeState,
        isSelected: selectedNode === node.id,
      } as Record<string, unknown>,
      draggable: false,
      selectable: true,
      focusable: true,
    };
  });
}

/**
 * Default edge options for consistent styling
 */
const defaultEdgeOptions = {
  style: { strokeWidth: 2 },
};

/**
 * Node types for React Flow
 */
const nodeTypes = {
  storyNode: CustomStoryNode,
} as const;

/**
 * Interactive node map component with React Flow visualization
 */
export default function NodeMap({ className = '' }: NodeMapProps) {
  const {
    nodes: storyNodes,
    selectedNode,
    selectNode,
    openStoryView,
    getNodeState,
    progress,
  } = useStoryStore();

  // Convert to React Flow format
  const initialNodes = useMemo(
    () => convertToReactFlowNodes(storyNodes, getNodeState, selectedNode),
    []
  );

  const initialEdges = useMemo(
    () => convertToReactFlowEdges(storyNodes, progress),
    []
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when selection or state changes
  useEffect(() => {
    setNodes(convertToReactFlowNodes(storyNodes, getNodeState, selectedNode));
  }, [storyNodes, selectedNode, getNodeState, setNodes]);

  // Update edges when story nodes or progress changes
  useEffect(() => {
    setEdges(convertToReactFlowEdges(storyNodes, progress));
  }, [storyNodes, progress, setEdges]);

  // Handle node click - select and open story view
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      selectNode(node.id);
      openStoryView(node.id);
    },
    [selectNode, openStoryView]
  );

  // Get node color for mini-map
  const getNodeColor = useCallback((node: Node) => {
    const nodeData = node.data as unknown as CustomStoryNodeData;
    const character = nodeData?.node?.character;
    return CHARACTER_THEMES[character as keyof typeof CHARACTER_THEMES] || '#9ca3af';
  }, []);

  // Calculate stats for info overlay
  const totalNodes = storyNodes.size;
  const visitedCount = Object.keys(progress.visitedNodes).length;

  return (
    <div
      className={`relative w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 ${className}`}
      style={{ minHeight: '100%' }}
      role="region"
      aria-label="Interactive story node map"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange as OnNodesChange}
        onEdgesChange={onEdgesChange as OnEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        minZoom={0.2}
        maxZoom={2}
        className="touch-none"
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        zoomOnDoubleClick={false}
        panOnScroll={true}
        preventScrolling={true}
      >
        {/* Background grid with subtle pattern */}
        <Background
          color="#d1d5db"
          gap={24}
          size={1}
          variant={BackgroundVariant.Lines}
        />

        {/* Zoom/pan controls */}
        <Controls
          className="bg-white/90 backdrop-blur-sm shadow-lg rounded-lg border border-gray-200"
          showInteractive={false}
        />

        {/* Mini-map for overview */}
        <MiniMap
          className="bg-white/90 backdrop-blur-sm shadow-lg rounded-lg border border-gray-200"
          nodeColor={getNodeColor}
          maskColor="rgba(0, 0, 0, 0.1)"
          pannable
          zoomable
        />
      </ReactFlow>

      {/* Info overlay */}
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-4 py-3 rounded-lg shadow-lg border border-gray-200 pointer-events-none max-w-xs">
        <div className="text-sm font-semibold text-gray-800 mb-2">
          Eternal Return of the Digital Self
        </div>
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex items-center justify-between">
            <span>Nodes:</span>
            <span className="font-semibold">{totalNodes}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Visited:</span>
            <span className="font-semibold text-blue-600">{visitedCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Progress:</span>
            <span className="font-semibold text-green-600">
              {totalNodes > 0 ? Math.round((visitedCount / totalNodes) * 100) : 0}%
            </span>
          </div>
          <div className="text-gray-500 mt-2 text-center">
            {visitedCount === 0
              ? 'Click any node to begin'
              : `${Math.round((visitedCount / totalNodes) * 100)}% explored`}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-20 left-4 bg-white/95 backdrop-blur-sm px-4 py-3 rounded-lg shadow-lg border border-gray-200 pointer-events-none">
        <div className="text-xs font-semibold text-gray-700 mb-2">Characters</div>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-sm" />
            <span className="text-gray-600">Archaeologist 🔍</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-sm" />
            <span className="text-gray-600">Algorithm 🧠</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-red-400 to-red-600 shadow-sm" />
            <span className="text-gray-600">Human 👤</span>
          </div>
        </div>

        <div className="text-xs font-semibold text-gray-700 mb-2 mt-3">Connections</div>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-0.5 bg-blue-500" />
            <span className="text-gray-600">Temporal</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-0.5 bg-green-500" />
            <span className="text-gray-600">Consciousness</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-0.5 bg-red-500" style={{ backgroundImage: 'repeating-linear-gradient(to right, #ef4444 0, #ef4444 3px, transparent 3px, transparent 8px)' }} />
            <span className="text-gray-600">Recursive</span>
          </div>
        </div>
      </div>
    </div>
  );
}
