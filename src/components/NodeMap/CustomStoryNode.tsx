import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import { memo, type ReactElement } from 'react';

import type { NodeUIState, StoryNode } from '@/types';

import { getNodeColors } from './nodeTheme';
import { StoryNodeLabel, StoryNodeLockedGhost, StoryNodeParticles } from './StoryNodeAncillary';
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

function CustomStoryNode({ data, selected }: NodeProps<CustomStoryFlowNode>): ReactElement {
  const { node, nodeState, isSelected, available, isConnectionTarget, reduceMotion } = data;
  const colors = getNodeColors(node.character);
  const presentation = buildStoryNodePresentation({
    node,
    nodeState,
    available,
    isConnectionTarget,
    reduceMotion,
  });
  const selectedForReactFlow = isSelected || selected;

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
        className="group relative"
        data-testid={`story-node-${node.id}`}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={
          presentation.canVisit
            ? { scale: 1.08, transition: { type: 'spring', stiffness: 400, damping: 10 } }
            : {}
        }
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
      >
        {presentation.canVisit ? (
          <>
            <StoryNodeEffects
              colors={colors}
              size={presentation.size}
              isConnectionTarget={presentation.isConnectionTarget}
            />
            <StoryNodeCore
              node={node}
              nodeState={nodeState}
              colors={colors}
              size={presentation.size}
              canVisit={presentation.canVisit}
              isVisited={presentation.isVisited}
              isSelected={selectedForReactFlow}
              isCritical={presentation.isCritical}
            />
            {presentation.isVisited && (
              <StoryNodeParticles
                node={node}
                colors={colors}
                size={presentation.size}
                reduceMotion={presentation.reduceMotion}
              />
            )}
            <StoryNodeLabel
              node={node}
              colors={colors}
              isSelected={selectedForReactFlow}
              reduceMotion={presentation.reduceMotion}
            />
          </>
        ) : (
          <StoryNodeLockedGhost node={node} colors={colors} size={presentation.size} />
        )}
      </motion.div>
    </>
  );
}

export default memo(CustomStoryNode);
