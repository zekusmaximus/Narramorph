import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import type { StoryNode, NodeUIState, CharacterType, TransformationState } from '@/types';

/**
 * Props passed to custom node via React Flow
 */
export interface CustomStoryNodeData {
  node: StoryNode;
  nodeState: NodeUIState;
  isSelected: boolean;
}

/**
 * Character-specific visual themes
 */
const CHARACTER_THEMES = {
  archaeologist: {
    gradient: 'from-blue-400 via-blue-500 to-blue-600',
    glow: 'shadow-blue-500/50',
    border: 'border-blue-300',
    ring: 'ring-blue-400',
    color: '#3b82f6',
  },
  algorithm: {
    gradient: 'from-green-400 via-green-500 to-green-600',
    glow: 'shadow-green-500/50',
    border: 'border-green-300',
    ring: 'ring-green-400',
    color: '#10b981',
  },
  human: {
    gradient: 'from-red-400 via-red-500 to-red-600',
    glow: 'shadow-red-500/50',
    border: 'border-red-300',
    ring: 'ring-red-400',
    color: '#ef4444',
  },
} as const;

/**
 * Get character icon/emoji for node
 */
function getCharacterIcon(character: CharacterType): string {
  switch (character) {
    case 'archaeologist':
      return '🔍';
    case 'algorithm':
      return '🧠';
    case 'human':
      return '👤';
    default:
      return '•';
  }
}

/**
 * Get transformation state badge
 */
function getTransformationBadge(state: TransformationState): React.ReactNode {
  if (state === 'firstRevisit') {
    return (
      <motion.div
        className="bg-yellow-400 rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow-lg"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
      >
        <span className="text-xs">🟡</span>
      </motion.div>
    );
  }

  if (state === 'metaAware') {
    return (
      <motion.div
        className="bg-purple-500 rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow-lg"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
      >
        <span className="text-xs">🟣</span>
      </motion.div>
    );
  }

  return null;
}

/**
 * Custom Story Node Component with impressive visuals
 */
function CustomStoryNode({ data, selected }: NodeProps) {
  const { node, nodeState, isSelected } = data as unknown as CustomStoryNodeData;
  const theme = CHARACTER_THEMES[node.character as CharacterType];

  // Calculate size based on importance (critical path nodes are larger)
  const size = node.metadata.criticalPath ? 120 : 80;

  // Determine visual intensity based on transformation state
  const isMetaAware = nodeState.currentState === 'metaAware';
  const isVisited = nodeState.visited;

  return (
    <>
      {/* Connection handles - invisible but necessary for React Flow */}
      <Handle
        type="target"
        position={Position.Top}
        className="opacity-0"
        isConnectable={false}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="opacity-0"
        isConnectable={false}
      />

      <motion.div
        className="relative"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        {/* Outer glow ring (only for meta-aware or selected) */}
        {(isMetaAware || isSelected || selected) && (
          <motion.div
            className={`absolute inset-0 rounded-full bg-gradient-to-br ${theme.gradient} blur-xl`}
            style={{
              width: size + 40,
              height: size + 40,
              left: -20,
              top: -20,
              opacity: 0.3,
            }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}

        {/* Main node circle */}
        <div
          className={`
            relative rounded-full flex items-center justify-center
            bg-gradient-to-br ${theme.gradient}
            border-4 ${isVisited ? theme.border : 'border-gray-300'}
            ${isSelected || selected ? `ring-8 ${theme.ring} ring-opacity-50` : ''}
            shadow-2xl ${theme.glow}
            transition-all duration-300
            cursor-pointer
            ${!isVisited ? 'opacity-60' : ''}
          `}
          style={{ width: size, height: size }}
        >
          {/* Inner radial gradient for depth */}
          <div className="absolute inset-0 rounded-full bg-gradient-radial from-white/20 to-transparent" />

          {/* Character icon/initial */}
          <div
            className="relative z-10 text-white font-bold"
            style={{ fontSize: size / 4 }}
          >
            {getCharacterIcon(node.character)}
          </div>

          {/* Visit counter badge */}
          {isVisited && (
            <motion.div
              className="absolute -top-2 -right-2 bg-white rounded-full shadow-lg border-2 border-gray-200 px-2 py-1"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
            >
              <span className="text-xs font-bold text-gray-800">
                {nodeState.visitCount}
              </span>
            </motion.div>
          )}

          {/* Transformation state indicator */}
          {nodeState.currentState !== 'initial' && getTransformationBadge(nodeState.currentState) && (
            <motion.div className="absolute -bottom-2 -right-2">
              {getTransformationBadge(nodeState.currentState) as React.ReactNode}
            </motion.div>
          )}

          {/* Critical path indicator */}
          {node.metadata.criticalPath && (
            <motion.div
              className="absolute -top-2 -left-2 bg-yellow-400 rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow-lg"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', delay: 0.1 }}
            >
              <span className="text-xs">⭐</span>
            </motion.div>
          )}

          {/* Pulse animation for selected node */}
          {(isSelected || selected) && (
            <motion.div
              className={`absolute inset-0 rounded-full border-4 ${theme.border}`}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [1, 0, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}
        </div>

        {/* Node title label */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-3 text-center pointer-events-none">
          <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg border border-gray-200">
            <div className="text-sm font-semibold text-gray-800 whitespace-nowrap">
              {node.title}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {node.metadata.estimatedReadTime} min
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

export default memo(CustomStoryNode);
