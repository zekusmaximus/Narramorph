import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import type { ReactElement } from 'react';

import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';
import type { StoryNode } from '@/types';
import type { NodeUnlockConfig, UnlockProgress } from '@/types/Unlock';

import { getCharacterIcon, type StoryNodeTheme } from './nodeTheme';

interface StoryNodeParticlesProps {
  node: StoryNode;
  theme: StoryNodeTheme;
  size: number;
}

export function StoryNodeParticles({
  node,
  theme,
  size,
}: StoryNodeParticlesProps): ReactElement | null {
  const reduceMotion = useReducedMotionPreference();

  if (reduceMotion) {
    return null;
  }

  if (node.character === 'algorithm') {
    return (
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden rounded-full"
        data-testid="story-node-particles"
        aria-hidden="true"
      >
        {['0', '1', '0', '1'].map((digit, index) => (
          <motion.div
            key={index}
            className="absolute text-xs font-mono"
            style={{
              color: theme.primary,
              left: `${25 * index}%`,
              textShadow: `0 0 5px ${theme.primary}`,
            }}
            animate={{ y: [size, -20], opacity: [0, 1, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: index * 0.3,
              ease: 'linear',
            }}
          >
            {digit}
          </motion.div>
        ))}
      </div>
    );
  }

  const particleCount = node.character === 'archaeologist' ? 6 : 4;
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      data-testid="story-node-particles"
      aria-hidden="true"
    >
      {Array.from({ length: particleCount }, (_, index) => (
        <motion.div
          key={index}
          className={
            node.character === 'last-human'
              ? 'absolute w-1.5 h-1.5 rounded-full'
              : 'absolute w-1 h-1 rounded-full'
          }
          style={{
            background: theme.tertiary,
            boxShadow: node.character === 'last-human' ? `0 0 4px ${theme.tertiary}` : undefined,
            left:
              node.character === 'last-human'
                ? `${30 + Math.random() * 40}%`
                : `${20 + Math.random() * 60}%`,
            top: node.character === 'archaeologist' ? `${20 + Math.random() * 60}%` : undefined,
          }}
          animate={
            node.character === 'last-human'
              ? {
                  y: [size / 2, -size],
                  opacity: [0.8, 0],
                  x: [0, (Math.random() - 0.5) * 20],
                }
              : { y: [0, -20, 0], opacity: [0, 0.6, 0], scale: [0, 1, 0] }
          }
          transition={{
            duration: node.character === 'last-human' ? 4 + Math.random() : 3 + Math.random() * 2,
            repeat: Infinity,
            delay: index * (node.character === 'last-human' ? 0.8 : 0.5),
            ease: node.character === 'last-human' ? 'easeOut' : 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

export function StoryNodeLabel({
  node,
  theme,
}: {
  node: StoryNode;
  theme: StoryNodeTheme;
}): ReactElement {
  const layerLabel =
    node.layer === 1
      ? 'Opening fragment'
      : node.layer === 2
        ? 'Branching fragment'
        : node.layer === 3
          ? 'Convergence'
          : 'Final fragment';

  return (
    <div className="pointer-events-none absolute left-1/2 top-full mt-3 w-40 -translate-x-1/2 transform text-center sm:mt-4 sm:w-48">
      <div
        className="rounded border bg-black/90 px-2.5 py-1.5 shadow-lg backdrop-blur-sm sm:px-3"
        style={{
          borderColor: `${theme.primary}40`,
          boxShadow: `0 0 10px ${theme.primary}20`,
        }}
      >
        <div
          className="flex items-start justify-center gap-1.5 font-serif text-[13px] font-semibold leading-tight tracking-wide sm:text-sm"
          style={{ color: theme.primary }}
        >
          <span className="mt-0.5 text-[10px] opacity-80">{getCharacterIcon(node.character)}</span>
          <span>{node.title}</span>
        </div>
        <div
          className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] opacity-80"
          style={{ color: theme.accent }}
        >
          {layerLabel}
        </div>
      </div>
    </div>
  );
}

interface StoryNodeUnlockStatusProps {
  canVisit: boolean;
  isHovering: boolean;
  theme: StoryNodeTheme;
  unlockProgress: UnlockProgress | null;
  unlockConfig: NodeUnlockConfig | undefined;
  includeOverlay?: boolean;
}

export function StoryNodeUnlockStatus({
  canVisit,
  isHovering,
  theme,
  unlockProgress,
  unlockConfig,
  includeOverlay = false,
}: StoryNodeUnlockStatusProps): ReactElement | null {
  if (canVisit) {
    return null;
  }
  if (includeOverlay) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full backdrop-blur-sm"
        >
          <Lock className="w-8 h-8 text-white" />
        </motion.div>
        {unlockProgress && unlockProgress.progress > 0 && (
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="48"
              fill="none"
              stroke={theme.primary}
              strokeWidth="4"
              strokeDasharray={`${unlockProgress.progress * 3.01} 301`}
              opacity="0.6"
            />
          </svg>
        )}
      </>
    );
  }
  if (!isHovering || !unlockProgress || !unlockConfig) {
    return null;
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute top-full left-1/2 transform -translate-x-1/2 mt-28 w-64 pointer-events-none z-50"
    >
      <div
        className="bg-black/95 backdrop-blur-sm p-3 rounded border font-mono text-xs shadow-2xl"
        style={{
          borderColor: `${theme.primary}40`,
          boxShadow: `0 0 20px ${theme.primary}20`,
        }}
      >
        <div className="mb-2">
          <div className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Locked</div>
          <div className="text-white font-semibold text-sm">{unlockConfig.lockedMessage}</div>
        </div>
        <div className="mb-2">
          <div className="flex justify-between text-gray-400 text-[10px] mb-1">
            <span>Progress</span>
            <span>{Math.round(unlockProgress.progress)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1">
            <div
              className="h-1 rounded-full transition-all"
              style={{
                width: `${unlockProgress.progress}%`,
                backgroundColor: theme.primary,
              }}
            />
          </div>
        </div>
        <div className="space-y-1">
          {unlockConfig.unlockConditions.map((condition) => {
            const met = unlockProgress.conditionsMet.includes(condition.id);
            return (
              <div key={condition.id} className="flex items-start space-x-2">
                <span className={met ? 'text-green-400' : 'text-gray-500'}>{met ? '✓' : '○'}</span>
                <span className={met ? 'text-gray-400 line-through' : 'text-gray-300'}>
                  {condition.description}
                </span>
              </div>
            );
          })}
        </div>
        {unlockProgress.nextConditionHint && (
          <div className="mt-2 pt-2 border-t border-gray-700">
            <div className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">
              Next Action
            </div>
            <div className="text-yellow-400">{unlockProgress.nextConditionHint}</div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
