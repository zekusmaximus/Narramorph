import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import { memo, useEffect, useRef, useState, type ReactElement } from 'react';

import type { NodeUIState, StoryNode } from '@/types';

import { STORY_NODE_THEMES } from './nodeTheme';
import { StoryNodeLabel, StoryNodeParticles } from './StoryNodeAncillary';
import { StoryNodeCore } from './StoryNodeCore';
import { StoryNodeEffects } from './StoryNodeEffects';
import { buildStoryNodePresentation } from './storyNodePresentation';

export type CustomStoryNodeData = {
  node: StoryNode;
  nodeState: NodeUIState;
  isSelected: boolean;
  available: boolean;
  isConnectionTarget: boolean;
  reduceMotion: boolean;
} & Record<string, unknown>;

export type CustomStoryFlowNode = Node<CustomStoryNodeData, 'storyNode'>;

function useRipple(canVisit: boolean): [boolean, () => void] {
  const [ripple, setRipple] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    },
    [],
  );

  const triggerRipple = (): void => {
    if (!canVisit) {
      return;
    }
    setRipple(true);
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => setRipple(false), 1000);
  };

  return [ripple, triggerRipple];
}

function CustomStoryNode({ data, selected }: NodeProps<CustomStoryFlowNode>): ReactElement {
  const { node, nodeState, isSelected, available, isConnectionTarget, reduceMotion } = data;
  const theme = STORY_NODE_THEMES[node.character];
  const [isHovering, setIsHovering] = useState(false);
  const presentation = buildStoryNodePresentation({
    node,
    nodeState,
    available,
    isConnectionTarget,
    reduceMotion,
  });
  const selectedForReactFlow = isSelected || selected;
  const [ripple, triggerRipple] = useRipple(presentation.canVisit);

  return (
    <>
      <Handle type="target" position={Position.Top} className="opacity-0" isConnectable={false} />
      <Handle
        type="source"
        position={Position.Bottom}
        className="opacity-0"
        isConnectable={false}
      />

      <motion.div
        className="relative"
        data-testid={`story-node-${node.id}`}
        initial={{ scale: 0, opacity: 0, rotateZ: -180 }}
        animate={{ scale: 1, opacity: 1, rotateZ: 0 }}
        whileHover={
          presentation.canVisit
            ? { scale: 1.08, transition: { type: 'spring', stiffness: 400, damping: 10 } }
            : {}
        }
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={triggerRipple}
      >
        <StoryNodeEffects
          node={node}
          theme={theme}
          size={presentation.size}
          isHovering={isHovering}
          ripple={ripple}
          isSelected={selectedForReactFlow}
          isMetaAware={presentation.isMetaAware}
          isConnectionTarget={presentation.isConnectionTarget}
          reduceMotion={presentation.reduceMotion}
        />
        <StoryNodeCore
          node={node}
          nodeState={nodeState}
          theme={theme}
          size={presentation.size}
          canVisit={presentation.canVisit}
          isVisited={presentation.isVisited}
          isSelected={selectedForReactFlow}
          isMetaAware={presentation.isMetaAware}
          isCritical={presentation.isCritical}
          reduceMotion={presentation.reduceMotion}
        />
        {presentation.isVisited && (
          <StoryNodeParticles
            node={node}
            theme={theme}
            size={presentation.size}
            reduceMotion={presentation.reduceMotion}
          />
        )}
        <StoryNodeLabel node={node} theme={theme} />
      </motion.div>
    </>
  );
}

export default memo(CustomStoryNode);
