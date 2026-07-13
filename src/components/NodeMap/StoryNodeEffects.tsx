import { motion } from 'framer-motion';
import type { ReactElement } from 'react';

import type { StoryNode } from '@/types';

import type { StoryNodeTheme } from './nodeTheme';

interface StoryNodeEffectsProps {
  node: StoryNode;
  theme: StoryNodeTheme;
  size: number;
  isHovering: boolean;
  ripple: boolean;
  isSelected: boolean;
  isMetaAware: boolean;
  isConnectionTarget: boolean;
  reduceMotion: boolean;
}

export function StoryNodeEffects({
  node,
  theme,
  size,
  isHovering,
  ripple,
  isSelected,
  isMetaAware,
  isConnectionTarget,
  reduceMotion,
}: StoryNodeEffectsProps): ReactElement {
  return (
    <>
      {(isMetaAware || isSelected) && (
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

      {isMetaAware && isHovering && !reduceMotion && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ background: theme.primary, opacity: 0.3, filter: 'blur(3px)' }}
            animate={{ x: [-2, 2, -2], y: [2, -2, 2] }}
            transition={{ duration: 0.1, repeat: Infinity }}
          />
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ background: theme.tertiary, opacity: 0.3, filter: 'blur(3px)' }}
            animate={{ x: [2, -2, 2], y: [-2, 2, -2] }}
            transition={{ duration: 0.1, repeat: Infinity }}
          />
        </>
      )}

      {ripple && !reduceMotion && (
        <motion.div
          className="absolute inset-0 rounded-full border-2"
          style={{ borderColor: theme.primary }}
          initial={{ scale: 1, opacity: 1 }}
          animate={{ scale: 3, opacity: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      )}

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
                transition={{ duration: 1.5, repeat: Infinity, delay: idx * 0.2 }}
              />
            );
          })}
        </div>
      )}

      {isConnectionTarget && (
        <motion.div
          className="absolute inset-0 rounded-full border-2"
          style={{ borderColor: theme.primary }}
          animate={
            reduceMotion
              ? { scale: 1, opacity: 0.85 }
              : { scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }
          }
          transition={{ duration: reduceMotion ? 0 : 1.5, repeat: reduceMotion ? 0 : Infinity }}
          data-testid="story-node-connection-target"
        />
      )}
    </>
  );
}
