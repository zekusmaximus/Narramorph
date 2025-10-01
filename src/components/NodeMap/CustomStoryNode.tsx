import { memo, useState, useMemo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import type { StoryNode, NodeUIState, CharacterType, TransformationState } from '@/types';
import { useStoryStore } from '@/stores/storyStore';

/**
 * Props passed to custom node via React Flow
 */
export interface CustomStoryNodeData {
  node: StoryNode;
  nodeState: NodeUIState;
  isSelected: boolean;
}

/**
 * Character-specific visual themes - Dystopian Cyberpunk
 */
const CHARACTER_THEMES = {
  archaeologist: {
    // Cold preservation, frozen memories
    primary: '#00e5ff',
    secondary: '#0097a7',
    tertiary: '#ffa726',
    accent: '#b0bec5',
    rgb: '0, 229, 255',

    gradient: 'from-cyan-400 via-cyan-600 to-teal-700',
    glowColor: '#00e5ff',
    glowSecondary: '#ffa726',

    glow: `
      0 0 30px #00e5ff,
      0 0 60px rgba(0, 229, 255, 0.5),
      0 0 100px rgba(255, 167, 38, 0.25),
      inset 0 0 20px #ffa726
    `,
    pulseGlow: `
      0 0 40px #00e5ff,
      0 0 80px rgba(0, 229, 255, 0.6),
      0 0 120px rgba(255, 167, 38, 0.3)
    `,
  },

  algorithm: {
    // Electric emergence, living code
    primary: '#39ff14',
    secondary: '#76ff03',
    tertiary: '#7c4dff',
    accent: '#e8f5e9',
    rgb: '57, 255, 20',

    gradient: 'from-green-400 via-green-500 to-purple-600',
    glowColor: '#39ff14',
    glowSecondary: '#7c4dff',

    glow: `
      0 0 40px #39ff14,
      0 0 80px rgba(57, 255, 20, 0.5),
      0 0 120px rgba(124, 77, 255, 0.25),
      0 0 5px #ffffff
    `,
    pulseGlow: `
      0 0 50px #39ff14,
      0 0 100px rgba(57, 255, 20, 0.6),
      0 0 150px rgba(124, 77, 255, 0.4)
    `,
  },

  human: {
    // Organic warmth, mortality
    primary: '#d32f2f',
    secondary: '#b71c1c',
    tertiary: '#ff6e40',
    accent: '#fafafa',
    rgb: '211, 47, 47',

    gradient: 'from-red-600 via-red-700 to-red-900',
    glowColor: '#d32f2f',
    glowSecondary: '#ff6e40',

    glow: `
      0 0 50px #d32f2f,
      0 0 90px rgba(211, 47, 47, 0.5),
      0 0 130px rgba(255, 110, 64, 0.25),
      inset 0 0 30px #fafafa
    `,
    pulseGlow: `
      0 0 60px #d32f2f,
      0 0 110px rgba(211, 47, 47, 0.6),
      0 0 160px rgba(255, 110, 64, 0.4)
    `,
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
    return '◇';
  }

  if (state === 'metaAware') {
    return '◈';
  }

  return null;
}

/**
 * Custom Story Node Component with dystopian cyberpunk aesthetics
 */
function CustomStoryNode({ data, selected }: NodeProps) {
  const { node, nodeState, isSelected } = data as unknown as CustomStoryNodeData;
  const theme = CHARACTER_THEMES[node.character as CharacterType];

  // Hover and interaction states
  const [isHovering, setIsHovering] = useState(false);
  const [ripple, setRipple] = useState(false);

  // Store access for connection detection
  const selectedNode = useStoryStore(state => state.selectedNode);
  const nodes = useStoryStore(state => state.nodes);

  // Check if this node is connected to selected node
  const isConnectionTarget = useMemo(() => {
    if (!selectedNode) return false;
    const selected = nodes.get(selectedNode);
    if (!selected || !selected.connections) return false;
    return selected.connections.some(conn => conn.targetId === node.id);
  }, [selectedNode, nodes, node.id]);

  // Calculate size based on importance (critical path nodes are larger)
  const size = node.metadata.criticalPath ? 120 : 80;

  // Determine visual intensity based on transformation state
  const isMetaAware = nodeState.currentState === 'metaAware';
  const isVisited = nodeState.visited;

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
        initial={{ scale: 0, opacity: 0, rotateZ: -180 }}
        animate={{ scale: 1, opacity: 1, rotateZ: 0 }}
        whileHover={{
          scale: 1.08,
          transition: { type: 'spring', stiffness: 400, damping: 10 }
        }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 15,
          delay: 0.1,
        }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={() => {
          setRipple(true);
          setTimeout(() => setRipple(false), 1000);
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
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{
              duration: isMetaAware ? 1.5 : 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}

        {/* Chromatic aberration for meta-aware state */}
        {isMetaAware && isHovering && (
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
        {ripple && (
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
        {isHovering && node.connections && node.connections.length > 0 && (
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
                    x: [0, Math.cos((idx * 360) / connectionsLength * Math.PI / 180) * 60],
                    y: [0, Math.sin((idx * 360) / connectionsLength * Math.PI / 180) * 60],
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
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
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
            cursor-pointer
            ${!isVisited ? 'opacity-40' : 'opacity-100'}
          `}
          style={{
            width: size,
            height: size,
            borderColor: isVisited ? theme.primary : theme.accent,
            boxShadow: isSelected || isMetaAware ? theme.pulseGlow : theme.glow,
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
              animate={{
                y: [0, -8, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
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
              animate={{
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: 0.15,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          )}

          {/* Breathing effect for Human */}
          {node.character === 'human' && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: `radial-gradient(circle, ${theme.glowSecondary}20 0%, transparent 70%)`,
              }}
              animate={{
                scale: [0.95, 1.05, 0.95],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
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
            {getCharacterIcon(node.character)}
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
          {nodeState.currentState !== 'initial' && getTransformationBadge(nodeState.currentState) && (
            <motion.div
              className="absolute -bottom-2 -right-2 rounded-full border-2 w-6 h-6 flex items-center justify-center font-mono text-xs"
              style={{
                backgroundColor: '#0a0e12',
                borderColor: nodeState.currentState === 'metaAware' ? '#7c4dff' : '#ffa726',
                color: nodeState.currentState === 'metaAware' ? '#7c4dff' : '#ffa726',
                boxShadow:
                  nodeState.currentState === 'metaAware'
                    ? '0 0 10px #7c4dff'
                    : '0 0 10px #ffa726',
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              {getTransformationBadge(nodeState.currentState) as React.ReactNode}
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
          {(isSelected || selected) && (
            <motion.div
              className="absolute inset-0 rounded-full border-4"
              style={{ borderColor: theme.primary }}
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

        {/* Character-specific particles */}
        {isVisited && (
          <>
            {/* Archaeologist: Crystalline dust particles */}
            {node.character === 'archaeologist' && (
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full"
                    style={{
                      background: theme.tertiary,
                      left: `${20 + Math.random() * 60}%`,
                      top: `${20 + Math.random() * 60}%`,
                    }}
                    animate={{
                      y: [0, -20, 0],
                      opacity: [0, 0.6, 0],
                      scale: [0, 1, 0],
                    }}
                    transition={{
                      duration: 3 + Math.random() * 2,
                      repeat: Infinity,
                      delay: i * 0.5,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>
            )}

            {/* Algorithm: Binary streams */}
            {node.character === 'algorithm' && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
                {['0', '1', '0', '1'].map((digit, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-xs font-mono"
                    style={{
                      color: theme.primary,
                      left: `${25 * i}%`,
                      textShadow: `0 0 5px ${theme.primary}`,
                    }}
                    animate={{
                      y: [size, -20],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.3,
                      ease: 'linear',
                    }}
                  >
                    {digit}
                  </motion.div>
                ))}
              </div>
            )}

            {/* Human: Rising embers */}
            {node.character === 'human' && (
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(4)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1.5 h-1.5 rounded-full"
                    style={{
                      background: theme.tertiary,
                      boxShadow: `0 0 4px ${theme.tertiary}`,
                      left: `${30 + Math.random() * 40}%`,
                    }}
                    animate={{
                      y: [size / 2, -size],
                      opacity: [0.8, 0],
                      x: [0, (Math.random() - 0.5) * 20],
                    }}
                    transition={{
                      duration: 4 + Math.random(),
                      repeat: Infinity,
                      delay: i * 0.8,
                      ease: 'easeOut',
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Node title label - terminal style */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 text-center pointer-events-none">
          <div
            className="bg-black/95 backdrop-blur-sm px-3 py-1.5 rounded border font-mono shadow-lg"
            style={{
              borderColor: `${theme.primary}40`,
              boxShadow: `0 0 10px ${theme.primary}20`,
            }}
          >
            <div
              className="text-sm font-semibold whitespace-nowrap tracking-wide"
              style={{ color: theme.primary }}
            >
              {node.title}
            </div>
            <div className="text-xs mt-0.5" style={{ color: theme.accent }}>
              {node.metadata.estimatedReadTime} MIN • ACT {node.metadata.narrativeAct}
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

export default memo(CustomStoryNode);
