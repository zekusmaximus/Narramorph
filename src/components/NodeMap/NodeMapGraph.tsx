import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
  type OnEdgesChange,
  type OnNodesChange,
  type ReactFlowInstance,
  type Viewport,
} from '@xyflow/react';
import { motion } from 'framer-motion';
import { useEffect, useState, type MouseEvent as ReactMouseEvent, type ReactElement } from 'react';

import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';

import CustomStoryNode from './CustomStoryNode';

const nodeTypes = {
  storyNode: CustomStoryNode,
};

const defaultEdgeOptions = {
  animated: true,
  style: { strokeWidth: 2 },
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

interface NodeMapGraphProps {
  nodes: Node[];
  edges: Edge[];
  screenShake: boolean;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onNodeClick: (event: ReactMouseEvent, node: Node) => void;
  onNodeMouseEnter: (node: Node) => void;
  onNodeMouseLeave: () => void;
  onViewportChange: (viewport: Viewport) => void;
  getNodeColor: (node: Node) => string;
}

export function NodeMapGraph({
  nodes,
  edges,
  screenShake,
  onNodesChange,
  onEdgesChange,
  onNodeClick,
  onNodeMouseEnter,
  onNodeMouseLeave,
  onViewportChange,
  getNodeColor,
}: NodeMapGraphProps): ReactElement {
  const reduceMotion = useReducedMotionPreference();
  const [instance, setInstance] = useState<ReactFlowInstance | null>(null);

  useEffect(() => {
    if (!instance || nodes.length === 0) {
      return undefined;
    }
    const frame = requestAnimationFrame(() => {
      void instance.fitView({ padding: 0.3, minZoom: 0.3, maxZoom: 1.2 });
    });
    return () => cancelAnimationFrame(frame);
  }, [instance, nodes.length]);

  return (
    <motion.div
      className="w-full h-full"
      style={{ width: '100%', height: '100%' }}
      animate={
        screenShake && !reduceMotion ? { x: [0, -2, 2, -2, 2, 0], y: [0, 2, -2, 2, -2, 0] } : {}
      }
      transition={{ duration: 0.3 }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onInit={setInstance}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeMouseEnter={(_event, node) => onNodeMouseEnter(node)}
        onNodeMouseLeave={onNodeMouseLeave}
        onMove={(_event, viewport) => onViewportChange(viewport)}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={{
          ...defaultEdgeOptions,
          animated: reduceMotion ? false : defaultEdgeOptions.animated,
        }}
        fitView
        fitViewOptions={{ padding: 0.3, minZoom: 0.3, maxZoom: 1.2 }}
        minZoom={0.2}
        maxZoom={2}
        className="touch-none"
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        elevateEdgesOnSelect
        zoomOnDoubleClick={false}
        panOnScroll
        preventScrolling
      >
        <Background
          color="#1a2332"
          gap={32}
          size={1}
          variant={BackgroundVariant.Lines}
          style={{ opacity: 0.15 }}
        />
        <Controls
          className="bg-black/80 backdrop-blur-sm shadow-lg rounded border border-gray-700/50"
          showInteractive={false}
        />
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
  );
}
