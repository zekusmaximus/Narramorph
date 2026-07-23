import { motion } from 'framer-motion';
import type { ReactElement } from 'react';

import type { StoryNode } from '@/types';

import type { NodeColors } from './nodeTheme';

interface StoryNodeParticlesProps {
  node: StoryNode;
  colors: NodeColors;
  size: number;
  reduceMotion: boolean;
}

export function StoryNodeParticles({
  node,
  colors,
  size,
  reduceMotion,
}: StoryNodeParticlesProps): ReactElement | null {
  if (reduceMotion) {
    return null;
  }

  if (node.character === 'algorithm') {
    return (
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-full"
        data-testid="story-node-particles"
        aria-hidden="true"
      >
        {['0', '1', '0', '1'].map((digit, index) => (
          <motion.div
            key={index}
            className="absolute font-mono text-xs"
            style={{
              color: colors.ink,
              opacity: 0.35,
              left: `${25 * index}%`,
            }}
            animate={{ y: [size, -20], opacity: [0, 0.35, 0] }}
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
      className="pointer-events-none absolute inset-0"
      data-testid="story-node-particles"
      aria-hidden="true"
    >
      {Array.from({ length: particleCount }, (_, index) => (
        <motion.div
          key={index}
          className={
            node.character === 'last-human'
              ? 'absolute h-1.5 w-1.5 rounded-full'
              : 'absolute h-1 w-1 rounded-full'
          }
          style={{
            background: colors.ink,
            opacity: 0.35,
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
                  opacity: [0.35, 0],
                  x: [0, (Math.random() - 0.5) * 20],
                }
              : { y: [0, -20, 0], opacity: [0, 0.3, 0], scale: [0, 1, 0] }
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

interface StoryNodeLabelProps {
  node: StoryNode;
  colors: NodeColors;
  isSelected: boolean;
  reduceMotion: boolean;
}

/**
 * The node plaque: a single serif line in perspective ink on a square, hairline card.
 * Truncated to stay under the sibling column pitch; un-truncates on hover or while
 * selected (keyboard focus selects, so the selected state covers focus too).
 */
export function StoryNodeLabel({
  node,
  colors,
  isSelected,
  reduceMotion,
}: StoryNodeLabelProps): ReactElement {
  const widthClass = isSelected
    ? 'max-w-none z-20'
    : 'max-w-[7rem] group-hover:z-20 group-hover:max-w-none';
  const motionClass = reduceMotion ? '' : 'transition-[max-width] duration-150';

  return (
    <div className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 transform">
      <div
        className={`overflow-hidden rounded-none border bg-[#0b1015]/[0.92] px-1.5 py-0.5 ${widthClass} ${motionClass}`}
        style={{ borderColor: `${colors.fill}59` }}
      >
        <div
          className="overflow-hidden text-ellipsis whitespace-nowrap font-serif text-[12px] font-semibold leading-tight"
          style={{ color: colors.ink }}
        >
          {node.title}
        </div>
      </div>
    </div>
  );
}

/**
 * Locked nodes show no plaque — only a dashed ghost circle and a centred layer tag.
 * Details are surfaced on demand in the catalog-slip inspector.
 */
export function StoryNodeLockedGhost({
  node,
  colors,
  size,
}: {
  node: StoryNode;
  colors: NodeColors;
  size: number;
}): ReactElement {
  return (
    <div
      className="flex items-center justify-center rounded-full border border-dashed"
      style={{
        width: size,
        height: size,
        borderColor: `${colors.fill}8c`,
        backgroundColor: `${colors.fill}1a`,
      }}
    >
      <span className="font-mono text-[11px] font-medium" style={{ color: '#93a5ae' }}>
        L{node.layer}
      </span>
    </div>
  );
}
