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
import { useCallback, useEffect, useMemo, useState } from 'react';
import '@xyflow/react/dist/style.css';
import { motion } from 'framer-motion';

import { BootSequence } from './BootSequence';
import { CorruptionMeter } from './CorruptionMeter';
import CustomStoryNode, { type CustomStoryNodeData } from './CustomStoryNode';
import { DataStreams } from './DataStreams';
import { DiscoveryOverlay } from './DiscoveryOverlay';
import { convertToReactFlowEdges } from './edgeUtils';
import { GlitchEffect } from './GlitchEffect';
import { MemoryFragments } from './MemoryFragments';
import { NeuralNetwork } from './NeuralNetwork';
import { NodeTooltip } from './NodeTooltip';
import { ParallaxBackground } from './ParallaxBackground';
import { ReadingPathTrail } from './ReadingPathTrail';
import { TemporalDistortion } from './TemporalDistortion';

import { useStoryStore } from '@/stores';
import type { StoryNode, NodeUIState } from '@/types';

interface NodeMapProps {
  className?: string;
}

/**
 * Character themes for mini-map node coloring
 */
const CHARACTER_THEMES = {
  archaeologist: { hex: '#3b82f6', rgb: '59, 130, 246' },
  algorithm: { hex: '#10b981', rgb: '16, 185, 129' },
  'last-human': { hex: '#ef4444', rgb: '239, 68, 68' },
  'multi-perspective': { hex: '#9c27b0', rgb: '156, 39, 176' },
} as const;

/**
 * Convert StoryNode to React Flow node format, filtering out locked nodes
 */
function convertToReactFlowNodes(
  storyNodes: Map<string, StoryNode>,
  getNodeState: (id: string) => NodeUIState,
  selectedNode: string | null,
  canVisitNode: (id: string) => boolean,
): Node[] {
  return Array.from(storyNodes.values())
    .filter((node) => canVisitNode(node.id)) // Filter out locked nodes
    .map((node) => {
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
  animated: true,
  style: {
    strokeWidth: 2,
  },
  labelStyle: {
    fill: '#e0e0e0',
    fontWeight: 600,
    fontSize: 11,
    fontFamily: 'monospace',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  labelBgStyle: {
    fill: '#0a0e12',
    fillOpacity: 0.98,
    stroke: '#455a64',
    strokeWidth: 1,
    rx: 2,
    ry: 2,
  },
  labelBgPadding: [8, 6] as [number, number],
  labelBgBorderRadius: 2,
  zIndex: 1000,
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
    canVisitNode,
  } = useStoryStore();

  // State for atmospheric effects
  const [glitchActive, setGlitchActive] = useState(false);
  const [glitchColor, setGlitchColor] = useState('#00e5ff');
  const [screenShake, setScreenShake] = useState(false);
  const [showTrail] = useState(true); // Can be toggled

  // Phase 3 state
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [bootComplete, setBootComplete] = useState(false);
  const [showFogOfWar] = useState(false); // Can toggle
  const [viewport, setViewport] = useState({ zoom: 1, x: 0, y: 0 });

  // Convert to React Flow format
  const initialNodes = useMemo(
    () => convertToReactFlowNodes(storyNodes, getNodeState, selectedNode, canVisitNode),
    [storyNodes, getNodeState, selectedNode, canVisitNode],
  );

  const initialEdges = useMemo(
    () => convertToReactFlowEdges(storyNodes, progress),
    [storyNodes, progress],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Mouse tracking for parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      setTooltipPos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Update nodes when selection, state, or progress changes (for L2 unlocking)
  useEffect(() => {
    setNodes(convertToReactFlowNodes(storyNodes, getNodeState, selectedNode, canVisitNode));
  }, [storyNodes, selectedNode, getNodeState, canVisitNode, progress, setNodes]);

  // Update edges when story nodes or progress changes
  useEffect(() => {
    setEdges(convertToReactFlowEdges(storyNodes, progress));
  }, [storyNodes, progress, setEdges]);

  // Handle node click - select and open story view
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const nodeData = node.data as { node: StoryNode };
      const visitRecord = progress.visitedNodes[node.id];

      // Trigger screen shake
      setScreenShake(true);
      setTimeout(() => setScreenShake(false), 300);

      // Trigger glitch effect on transformation (visited nodes)
      if (visitRecord && visitRecord.visitCount > 0) {
        // Get character theme color
        const colors = {
          archaeologist: '#00e5ff',
          algorithm: '#39ff14',
          'last-human': '#d32f2f',
          'multi-perspective': '#9c27b0',
        };
        setGlitchColor(colors[nodeData.node.character] || '#00e5ff');
        setGlitchActive(true);
        setTimeout(() => setGlitchActive(false), 800);
      }

      selectNode(node.id);
      openStoryView(node.id);
    },
    [selectNode, openStoryView, progress.visitedNodes],
  );

  // Get node color for mini-map
  const getNodeColor = useCallback((node: Node) => {
    const nodeData = node.data as unknown as CustomStoryNodeData;
    const character = nodeData?.node?.character;
    const theme = CHARACTER_THEMES[character as keyof typeof CHARACTER_THEMES];
    return theme ? theme.hex : '#9ca3af';
  }, []);

  // Calculate stats for info overlay
  const totalNodes = storyNodes.size;
  const visitedCount = Object.keys(progress.visitedNodes).length;

  // Show boot sequence on first load
  const storyData = useStoryStore((state) => state.storyData);
  const showBoot = storyData && !bootComplete;

  return (
    <div
      className={`relative w-full h-full bg-[#0a0e12] ${className}`}
      style={{ minHeight: '100%' }}
      role="region"
      aria-label="Interactive story node map"
    >
      {/* Boot sequence */}
      {showBoot && <BootSequence onComplete={() => setBootComplete(true)} />}

      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          mixBlendMode: 'overlay',
        }}
      />

      {/* Parallax background layers */}
      <ParallaxBackground mouseX={mousePos.x} mouseY={mousePos.y} />

      {/* Vignette effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 0%, rgba(10, 14, 18, 0.8) 100%)',
        }}
      />

      {/* Fog of war / Discovery overlay */}
      {showFogOfWar && <DiscoveryOverlay />}

      {/* Character zone tinting - appears around node areas */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from(storyNodes.values()).map((node) => {
          const colors = {
            archaeologist: 'rgba(0, 229, 255, 0.03)',
            algorithm: 'rgba(57, 255, 20, 0.03)',
            'last-human': 'rgba(211, 47, 47, 0.03)',
            'multi-perspective': 'rgba(156, 39, 176, 0.03)',
          };

          return (
            <motion.div
              key={`zone-${node.id}`}
              className="absolute rounded-full"
              style={{
                width: 400,
                height: 400,
                left: node.position.x - 200,
                top: node.position.y - 200,
                background: `radial-gradient(circle, ${colors[node.character]} 0%, transparent 70%)`,
                filter: 'blur(60px)',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 2 }}
            />
          );
        })}
      </div>

      {/* Floating memory fragments */}
      <MemoryFragments />

      {/* Reading path ghost trail */}
      {showTrail && <ReadingPathTrail />}

      {/* Neural network connections */}
      {viewport.zoom > 0.3 && <NeuralNetwork />}

      {/* Temporal distortion effects */}
      {viewport.zoom > 0.5 && <TemporalDistortion />}

      {/* Data streams along connections */}
      <DataStreams />

      {/* Ambient data particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-0.5 h-0.5 rounded-full bg-cyan-400/20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -800],
              opacity: [0, 0.3, 0],
            }}
            transition={{
              duration: 10 + Math.random() * 5,
              repeat: Infinity,
              delay: i * 0.5,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      <motion.div
        className="w-full h-full"
        style={{ width: '100%', height: '100%' }}
        animate={
          screenShake
            ? {
                x: [0, -2, 2, -2, 2, 0],
                y: [0, 2, -2, 2, -2, 0],
              }
            : {}
        }
        transition={{ duration: 0.3 }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange as OnNodesChange}
          onEdgesChange={onEdgesChange as OnEdgesChange}
          onNodeClick={onNodeClick}
          onNodeMouseEnter={(_event, node) => {
            setHoveredNodeId(node.id);
          }}
          onNodeMouseLeave={() => {
            setHoveredNodeId(null);
          }}
          onMove={(_event, viewportUpdate) => {
            setViewport({
              zoom: viewportUpdate.zoom,
              x: viewportUpdate.x,
              y: viewportUpdate.y,
            });
          }}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          fitViewOptions={{
            padding: 0.3,
            minZoom: 0.3,
            maxZoom: 1.2,
          }}
          minZoom={0.2}
          maxZoom={2}
          className="touch-none"
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={true}
          elevateEdgesOnSelect={true}
          zoomOnDoubleClick={false}
          panOnScroll={true}
          preventScrolling={true}
        >
          {/* Background grid with subtle pattern */}
          <Background
            color="#1a2332"
            gap={32}
            size={1}
            variant={BackgroundVariant.Lines}
            style={{ opacity: 0.15 }}
          />

          {/* Zoom/pan controls */}
          <Controls
            className="bg-black/80 backdrop-blur-sm shadow-lg rounded border border-gray-700/50"
            showInteractive={false}
          />

          {/* Mini-map for overview */}
          <MiniMap
            className="bg-black/80 backdrop-blur-sm shadow-lg rounded border border-gray-700/50"
            style={{ width: 200, height: 150, backgroundColor: '#0a0e12' }}
            nodeColor={getNodeColor}
            maskColor="rgba(10, 14, 18, 0.8)"
            pannable
            zoomable
          />
        </ReactFlow>
      </motion.div>

      {/* Info overlay - terminal style with glitch */}
      <motion.div
        className="absolute top-4 left-4 bg-black/90 backdrop-blur-sm px-4 py-3 rounded border border-cyan-500/30 shadow-lg shadow-cyan-500/20 font-mono max-w-xs pointer-events-none"
        animate={{
          boxShadow: [
            '0 0 20px rgba(0, 229, 255, 0.2)',
            '0 0 30px rgba(0, 229, 255, 0.3)',
            '0 0 20px rgba(0, 229, 255, 0.2)',
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <motion.div
          className="text-xs text-cyan-400 mb-2 tracking-wider border-b border-cyan-500/30 pb-2"
          animate={{
            opacity: [1, 0.8, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
          }}
        >
          STORY.EXE
        </motion.div>
        <div className="text-xs text-gray-400 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">NODES:</span>
            <motion.span
              className="text-cyan-400 font-semibold"
              key={visitedCount}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              [{visitedCount.toString().padStart(2, '0')}/{totalNodes.toString().padStart(2, '0')}]
            </motion.span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">LOADED:</span>
            <motion.span
              className="text-green-400 font-semibold"
              key={`loaded-${visitedCount}`}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {totalNodes > 0 ? Math.round((visitedCount / totalNodes) * 100) : 0}%
            </motion.span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">STATE:</span>
            <span className="text-purple-400 font-semibold text-[10px]">
              {visitedCount === 0 ? 'INITIAL' : 'ACTIVE'}
            </span>
          </div>
        </div>
        <div className="text-xs text-cyan-400 mt-2 pt-2 border-t border-cyan-500/30">
          └────────────────────────┘
        </div>
      </motion.div>

      {/* Corruption meter */}
      <CorruptionMeter />

      {/* Legend - Cyberpunk style */}
      <div className="absolute bottom-20 left-4 bg-black/90 backdrop-blur-sm px-4 py-3 rounded border border-gray-700/50 shadow-lg font-mono pointer-events-none">
        <div className="text-xs font-semibold text-gray-400 mb-2 tracking-wider uppercase">
          Characters
        </div>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center space-x-2">
            <div
              className="w-3 h-3 rounded-full bg-gradient-to-br from-cyan-400 to-teal-700"
              style={{ boxShadow: '0 0 8px #00e5ff' }}
            />
            <span className="text-gray-300">Archaeologist 🔍</span>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className="w-3 h-3 rounded-full bg-gradient-to-br from-green-400 to-purple-600"
              style={{ boxShadow: '0 0 8px #39ff14' }}
            />
            <span className="text-gray-300">Algorithm 🧠</span>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className="w-3 h-3 rounded-full bg-gradient-to-br from-red-600 to-red-900"
              style={{ boxShadow: '0 0 8px #d32f2f' }}
            />
            <span className="text-gray-300">Human 👤</span>
          </div>
        </div>

        <div className="text-xs font-semibold text-gray-400 mb-2 mt-3 tracking-wider uppercase">
          Connections
        </div>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center space-x-2">
            <div
              className="w-4 h-0.5"
              style={{
                backgroundColor: '#00e5ff',
                boxShadow: '0 0 4px #00e5ff',
              }}
            />
            <span className="text-gray-300">Temporal</span>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className="w-4 h-0.5"
              style={{
                backgroundColor: '#7c4dff',
                boxShadow: '0 0 4px #7c4dff',
              }}
            />
            <span className="text-gray-300">Consciousness</span>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className="w-4 h-0.5"
              style={{
                background:
                  'repeating-linear-gradient(to right, #39ff14 0, #39ff14 3px, transparent 3px, transparent 8px)',
                boxShadow: '0 0 4px #39ff14',
              }}
            />
            <span className="text-gray-300">Recursive</span>
          </div>
        </div>
      </div>

      {/* Glitch effect overlay */}
      <GlitchEffect active={glitchActive} color={glitchColor} />

      {/* Node tooltip */}
      <NodeTooltip nodeId={hoveredNodeId} position={tooltipPos} />
    </div>
  );
}
