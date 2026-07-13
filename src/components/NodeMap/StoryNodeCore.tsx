import { motion } from 'framer-motion';
import type { ReactElement } from 'react';

import type { NodeUIState, StoryNode } from '@/types';

import { getTransformationBadge, type StoryNodeTheme } from './nodeTheme';

interface StoryNodeCoreProps {
  node: StoryNode;
  nodeState: NodeUIState;
  theme: StoryNodeTheme;
  size: number;
  canVisit: boolean;
  isVisited: boolean;
  isSelected: boolean;
  isMetaAware: boolean;
  isCritical: boolean;
  reduceMotion: boolean;
}

export function StoryNodeCore({
  node,
  nodeState,
  theme,
  size,
  canVisit,
  isVisited,
  isSelected,
  isMetaAware,
  isCritical,
  reduceMotion,
}: StoryNodeCoreProps): ReactElement {
  const transformationBadge = getTransformationBadge(nodeState.currentState);
  return (
    <div
      className={`relative rounded-full flex items-center justify-center bg-gradient-to-br ${theme.gradient} border-2 transition-all duration-300 ${canVisit ? 'cursor-pointer' : 'cursor-not-allowed'} ${!isVisited ? 'opacity-40' : !canVisit ? 'opacity-40' : 'opacity-100'}`}
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
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${theme.accent}40 0%, transparent 70%)`,
        }}
      />
      {node.character === 'archaeologist' && (
        <motion.div
          className="absolute inset-0 rounded-full overflow-hidden opacity-30"
          style={{
            background: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${theme.accent} 2px, ${theme.accent} 4px)`,
          }}
          animate={reduceMotion ? { y: 0 } : { y: [0, -8, 0] }}
          transition={{
            duration: reduceMotion ? 0 : 2,
            repeat: reduceMotion ? 0 : Infinity,
            ease: 'linear',
          }}
        />
      )}
      {node.character === 'algorithm' && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ background: theme.tertiary, mixBlendMode: 'overlay', opacity: 0.2 }}
          animate={reduceMotion ? { opacity: 0.2 } : { opacity: [0.1, 0.3, 0.1] }}
          transition={{
            duration: reduceMotion ? 0 : 0.15,
            repeat: reduceMotion ? 0 : Infinity,
            ease: 'linear',
          }}
        />
      )}
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
      <div
        className="relative z-10 font-bold"
        style={{ fontSize: size / 4, color: theme.accent, textShadow: `0 0 10px ${theme.primary}` }}
      >
        {node.character === 'archaeologist'
          ? 'A'
          : node.character === 'algorithm'
            ? 'Σ'
            : node.character === 'last-human'
              ? 'H'
              : '∴'}
      </div>
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
      {isCritical && (
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
      {isSelected && canVisit && (
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
    </div>
  );
}
