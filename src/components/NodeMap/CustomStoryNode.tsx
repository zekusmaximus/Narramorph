import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import { memo, useMemo, useState, type ReactElement } from 'react';

import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';
import type { NodeUIState, StoryNode } from '@/types';

import { STORY_NODE_THEMES, getTransformationBadge } from './nodeTheme';
import { StoryNodeLabel, StoryNodeParticles, StoryNodeUnlockStatus } from './StoryNodeAncillary';
import { useStoryStore } from '../../stores/storyStore';

/**
 * Props passed to custom node via React Flow
 */
export type CustomStoryNodeData = {
  node: StoryNode;
  nodeState: NodeUIState;
  isSelected: boolean;
  available: boolean;
} & Record<string, unknown>;

export type CustomStoryFlowNode = Node<CustomStoryNodeData, 'storyNode'>;

/**
 * Custom Story Node Component with dystopian cyberpunk aesthetics
 */
function CustomStoryNode({ data, selected }: NodeProps<CustomStoryFlowNode>): ReactElement {
  const { node, nodeState, isSelected, available } = data;
  const theme = STORY_NODE_THEMES[node.character];
  const reduceMotion = useReducedMotionPreference();

  // Hover and interaction states
  const [isHovering, setIsHovering] = useState(false);
  const [ripple, setRipple] = useState(false);

  // Store access for connection detection
  const selectedNode = useStoryStore((state) => state.selectedNode);
  const nodes = useStoryStore((state) => state.nodes);

  // Unlock system access
  const canVisit = available;
  const getUnlockProgress = useStoryStore((state) => state.getUnlockProgress);
  const unlockConfigs = useStoryStore((state) => state.unlockConfigs);

  // Get unlock progress if node has config
  const unlockProgress = useMemo(() => {
    if (unlockConfigs.has(node.id)) {
      return getUnlockProgress(node.id);
    }
    return null;
  }, [node.id, unlockConfigs, getUnlockProgress]);
  const unlockConfig = unlockConfigs.get(node.id);

  // Check if this node is connected to selected node
  const isConnectionTarget = useMemo(() => {
    if (!selectedNode) {
      return false;
    }
    const selected = nodes.get(selectedNode);
    if (!selected || !selected.connections) {
      return false;
    }
    return selected.connections.some((conn) => conn.targetId === node.id);
  }, [selectedNode, nodes, node.id]);

  // Calculate size based on importance (critical path nodes are larger)
  const size = node.metadata.criticalPath ? 80 : 60;

  // Determine visual intensity based on transformation state
  const isMetaAware = nodeState.currentState === 'metaAware';
  const isVisited = nodeState.visited;
  const transformationBadge = getTransformationBadge(nodeState.currentState);

  return (
    <>
      {/* Connection handles - invisible but necessary for React Flow */}
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
          canVisit
            ? {
                scale: 1.08,
                transition: { type: 'spring', stiffness: 400, damping: 10 },
              }
            : {}
        }
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 15,
          delay: 0.1,
        }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={() => {
          if (canVisit) {
            setRipple(true);
            setTimeout(() => setRipple(false), 1000);
          }
        }}
      >
        {/* Outer glow ring (only for meta-aware or selected) */}
        {(isMetaAware || isSelected || selected) && (
          <motion.div
            className="absolute rounded-full"
            style={{
              width: size + 60,
              height: size + 60,
              left: -30,
              top: -30,
              background: `radial-gradient(circle, ${theme.primary}40 0%, transparent 70%)`,
              filter: 'blur(20px)',
            }}
            animate={
              reduceMotion
                ? { scale: 1, opacity: 0.55 }
                : { scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }
            }
            transition={{
              duration: reduceMotion ? 0 : isMetaAware ? 1.5 : 2,
              repeat: reduceMotion ? 0 : Infinity,
              ease: 'easeInOut',
            }}
          />
        )}

        {/* Chromatic aberration for meta-aware state */}
        {isMetaAware && isHovering && !reduceMotion && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: theme.primary,
                opacity: 0.3,
                filter: 'blur(3px)',
              }}
              animate={{
                x: [-2, 2, -2],
                y: [2, -2, 2],
              }}
              transition={{
                duration: 0.1,
                repeat: Infinity,
              }}
            />
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: theme.tertiary,
                opacity: 0.3,
                filter: 'blur(3px)',
              }}
              animate={{
                x: [2, -2, 2],
                y: [-2, 2, -2],
              }}
              transition={{
                duration: 0.1,
                repeat: Infinity,
              }}
            />
          </>
        )}

        {/* Ripple effect on click */}
        {ripple && !reduceMotion && (
          <motion.div
            className="absolute inset-0 rounded-full border-2"
            style={{
              borderColor: theme.primary,
            }}
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        )}

        {/* Connection indicators on hover */}
        {isHovering && !reduceMotion && node.connections && node.connections.length > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            {node.connections.map((conn, idx) => {
              const connectionsLength = node.connections?.length ?? 1;
              return (
                <motion.div
                  key={conn.targetId}
                  className="absolute w-1 h-1 rounded-full"
                  style={{
                    background: theme.primary,
                    boxShadow: `0 0 8px ${theme.primary}`,
                    left: '50%',
                    top: '50%',
                  }}
                  animate={{
                    x: [0, Math.cos((((idx * 360) / connectionsLength) * Math.PI) / 180) * 60],
                    y: [0, Math.sin((((idx * 360) / connectionsLength) * Math.PI) / 180) * 60],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: idx * 0.2,
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Pulsing border for connection targets */}
        {isConnectionTarget && (
          <motion.div
            className="absolute inset-0 rounded-full border-2"
            style={{
              borderColor: theme.primary,
            }}
            animate={
              reduceMotion
                ? { scale: 1, opacity: 0.85 }
                : { scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }
            }
            transition={{
              duration: reduceMotion ? 0 : 1.5,
              repeat: reduceMotion ? 0 : Infinity,
            }}
          />
        )}

        {/* Main node circle with character-specific glow */}
        <div
          className={`
            relative rounded-full flex items-center justify-center
            bg-gradient-to-br ${theme.gradient}
            border-2
            transition-all duration-300
            ${canVisit ? 'cursor-pointer' : 'cursor-not-allowed'}
            ${!isVisited ? 'opacity-40' : !canVisit ? 'opacity-40' : 'opacity-100'}
          `}
          style={{
            width: size,
            height: size,
            borderColor: isVisited ? theme.primary : theme.accent,
            boxShadow:
              (isSelected || isMetaAware) && canVisit
                ? theme.pulseGlow
                : canVisit
                  ? theme.glow
                  : 'none',
          }}
        >
          {/* Inner radial gradient for depth */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${theme.accent}40 0%, transparent 70%)`,
            }}
          />

          {/* Scanline effect for Archaeologist */}
          {node.character === 'archaeologist' && (
            <motion.div
              className="absolute inset-0 rounded-full overflow-hidden opacity-30"
              style={{
                background: `repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 2px,
                  ${theme.accent} 2px,
                  ${theme.accent} 4px
                )`,
              }}
              animate={reduceMotion ? { y: 0 } : { y: [0, -8, 0] }}
              transition={{
                duration: reduceMotion ? 0 : 2,
                repeat: reduceMotion ? 0 : Infinity,
                ease: 'linear',
              }}
            />
          )}

          {/* Electric noise for Algorithm */}
          {node.character === 'algorithm' && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: theme.tertiary,
                mixBlendMode: 'overlay',
                opacity: 0.2,
              }}
              animate={reduceMotion ? { opacity: 0.2 } : { opacity: [0.1, 0.3, 0.1] }}
              transition={{
                duration: reduceMotion ? 0 : 0.15,
                repeat: reduceMotion ? 0 : Infinity,
                ease: 'linear',
              }}
            />
          )}

          {/* Breathing effect for Human */}
          {node.character === 'last-human' && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: `radial-gradient(circle, ${theme.glowSecondary}20 0%, transparent 70%)`,
              }}
              animate={
                reduceMotion
                  ? { scale: 1, opacity: 0.65 }
                  : { scale: [0.95, 1.05, 0.95], opacity: [0.5, 0.8, 0.5] }
              }
              transition={{
                duration: reduceMotion ? 0 : 3,
                repeat: reduceMotion ? 0 : Infinity,
                ease: 'easeInOut',
              }}
            />
          )}

          {/* Character icon/initial with enhanced styling */}
          <div
            className="relative z-10 font-bold"
            style={{
              fontSize: size / 4,
              color: theme.accent,
              textShadow: `0 0 10px ${theme.primary}`,
            }}
          >
            {node.character === 'archaeologist'
              ? 'A'
              : node.character === 'algorithm'
                ? 'Σ'
                : node.character === 'last-human'
                  ? 'H'
                  : '∴'}
          </div>

          {/* Visit counter badge - cyberpunk style */}
          {isVisited && (
            <motion.div
              className="absolute -top-2 -right-2 rounded-full border-2 px-2 py-1 font-mono text-xs font-bold"
              style={{
                backgroundColor: '#0a0e12',
                borderColor: theme.primary,
                color: theme.primary,
                boxShadow: `0 0 10px ${theme.primary}, inset 0 0 10px ${theme.primary}40`,
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
            >
              {nodeState.visitCount}
            </motion.div>
          )}

          {/* Transformation state indicator */}
          {nodeState.currentState !== 'initial' && transformationBadge && (
            <motion.div
              className="absolute -bottom-2 -right-2 rounded-full border-2 w-6 h-6 flex items-center justify-center font-mono text-xs"
              style={{
                backgroundColor: '#0a0e12',
                borderColor: nodeState.currentState === 'metaAware' ? '#7c4dff' : '#ffa726',
                color: nodeState.currentState === 'metaAware' ? '#7c4dff' : '#ffa726',
                boxShadow:
                  nodeState.currentState === 'metaAware' ? '0 0 10px #7c4dff' : '0 0 10px #ffa726',
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              {transformationBadge}
            </motion.div>
          )}

          {/* Critical path indicator */}
          {node.metadata.criticalPath && (
            <motion.div
              className="absolute -top-2 -left-2 rounded-full w-6 h-6 flex items-center justify-center border-2 font-bold"
              style={{
                backgroundColor: '#0a0e12',
                borderColor: '#ffa726',
                color: '#ffa726',
                boxShadow: '0 0 10px #ffa726',
              }}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', delay: 0.3 }}
            >
              ⚠
            </motion.div>
          )}

          {/* Pulse animation for selected node */}
          {(isSelected || selected) && canVisit && (
            <motion.div
              className="absolute inset-0 rounded-full border-4"
              style={{ borderColor: theme.primary }}
              animate={
                reduceMotion ? { scale: 1, opacity: 1 } : { scale: [1, 1.2, 1], opacity: [1, 0, 1] }
              }
              transition={{
                duration: reduceMotion ? 0 : 1.5,
                repeat: reduceMotion ? 0 : Infinity,
                ease: 'easeInOut',
              }}
            />
          )}

          <StoryNodeUnlockStatus
            canVisit={canVisit}
            isHovering={isHovering}
            theme={theme}
            unlockProgress={unlockProgress}
            unlockConfig={unlockConfig}
            includeOverlay
          />
        </div>

        {isVisited && <StoryNodeParticles node={node} theme={theme} size={size} />}
        <StoryNodeLabel node={node} theme={theme} />
        <StoryNodeUnlockStatus
          canVisit={canVisit}
          isHovering={isHovering}
          theme={theme}
          unlockProgress={unlockProgress}
          unlockConfig={unlockConfig}
        />
      </motion.div>
    </>
  );
}

export default memo(CustomStoryNode);
