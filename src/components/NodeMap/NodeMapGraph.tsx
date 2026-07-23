import {
  Background,
  BackgroundVariant,
  ControlButton,
  Controls,
  ReactFlow,
  type Edge,
  type AriaLabelConfig,
  type Node,
  type OnEdgesChange,
  type OnNodesChange,
  type ReactFlowInstance,
  type Viewport,
} from '@xyflow/react';
import { motion } from 'framer-motion';
import {
  useEffect,
  useMemo,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
} from 'react';

import CustomStoryNode from './CustomStoryNode';

const nodeTypes = {
  storyNode: CustomStoryNode,
};

const STORY_MAP_NODE_INSTRUCTIONS =
  'Use the arrow keys to move between available passages. Press Enter or Space to open the selected passage.';
const STORY_MAP_KEYBOARD_DESCRIPTION =
  'Use the arrow keys to move between available passages. Press Enter or Space to open the selected passage, and Escape to close it.';

const storyMapAriaLabelConfig: Partial<AriaLabelConfig> = {
  'node.a11yDescription.default': STORY_MAP_NODE_INSTRUCTIONS,
  'node.a11yDescription.keyboardDisabled': STORY_MAP_NODE_INSTRUCTIONS,
  'node.a11yDescription.ariaLiveMessage': ({ direction }) =>
    `Selected the available passage ${direction}.`,
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
  reduceMotion: boolean;
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
  reduceMotion,
}: NodeMapGraphProps): ReactElement {
  const [instance, setInstance] = useState<ReactFlowInstance | null>(null);
  const [compactViewport, setCompactViewport] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches,
  );

  useEffect(() => {
    const viewportQuery = window.matchMedia('(max-width: 639px)');
    const updateViewportMode = (): void => setCompactViewport(viewportQuery.matches);
    viewportQuery.addEventListener('change', updateViewportMode);
    return () => viewportQuery.removeEventListener('change', updateViewportMode);
  }, []);

  const fitViewOptions = useMemo(
    () =>
      compactViewport
        ? { padding: 0.08, minZoom: 0.55, maxZoom: 1.2 }
        : { padding: 0.3, minZoom: 0.3, maxZoom: 1.2 },
    [compactViewport],
  );

  useEffect(() => {
    if (!instance || nodes.length === 0) {
      return undefined;
    }
    const frame = requestAnimationFrame(() => {
      void instance.fitView(fitViewOptions);
    });
    return () => cancelAnimationFrame(frame);
  }, [fitViewOptions, instance, nodes.length]);

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
        aria-label="Interactive passage constellation"
        aria-description={STORY_MAP_KEYBOARD_DESCRIPTION}
        ariaLabelConfig={storyMapAriaLabelConfig}
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
        fitViewOptions={fitViewOptions}
        minZoom={0.2}
        maxZoom={2}
        className="touch-none"
        nodesDraggable={false}
        nodesConnectable={false}
        deleteKeyCode={null}
        edgesFocusable={false}
        elementsSelectable
        elevateEdgesOnSelect
        zoomOnDoubleClick={false}
        panOnScroll
        preventScrolling
      >
        <Background
          color="#1d2b33"
          gap={32}
          size={1}
          variant={BackgroundVariant.Lines}
          style={{ opacity: 0.15 }}
        />
        <Controls
          className="!z-30 !bottom-3 !left-3 gap-0 overflow-hidden rounded-none border border-[#2b3b44] bg-[#0d1318] !shadow-none [&_button]:relative [&_button]:!h-[38px] [&_button]:!w-[38px] [&_button]:!rounded-none [&_button]:!border-0 [&_button]:!border-t [&_button]:!border-[#1d2b33] [&_button]:!bg-transparent [&_button]:font-mono [&_button]:text-[16px] [&_button]:leading-none [&_button]:!text-[#b7c6ce] [&_button]:before:absolute [&_button]:before:-inset-[3px] [&_button]:before:content-[''] [&_button:first-child]:!border-t-0 [&_button:hover]:!bg-white/5 [&_button:hover]:!text-[#eef4f6] [&_button_svg]:hidden"
          orientation={compactViewport ? 'horizontal' : 'vertical'}
          showZoom={false}
          showFitView={false}
          showInteractive={false}
        >
          <ControlButton
            onClick={() => void instance?.zoomIn()}
            title="Zoom in"
            aria-label="Zoom in"
          >
            +
          </ControlButton>
          <ControlButton
            onClick={() => void instance?.zoomOut()}
            title="Zoom out"
            aria-label="Zoom out"
          >
            −
          </ControlButton>
          <ControlButton
            onClick={() => void instance?.fitView(fitViewOptions)}
            title="Fit view"
            aria-label="Fit view"
          >
            ⤢
          </ControlButton>
        </Controls>
      </ReactFlow>
    </motion.div>
  );
}
