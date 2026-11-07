import type { ReactElement } from 'react';

import { FOCUS } from '@/styles/designTokens';
import type { NodeUIState, StoryNode } from '@/types';

import { getTransformationBadge, type NodeColors } from './nodeTheme';

interface StoryNodeCoreProps {
  node: StoryNode;
  nodeState: NodeUIState;
  colors: NodeColors;
  size: number;
  canVisit: boolean;
  isVisited: boolean;
  isSelected: boolean;
  isCritical: boolean;
}

const characterGlyph: Record<StoryNode['character'], string> = {
  archaeologist: 'A',
  algorithm: 'Σ',
  'last-human': 'H',
  'multi-perspective': '∴',
};

/**
 * The node body. Flat perspective fill, hairline border, square selection stamp in the
 * focus colour — no neon glow, no gradient. Meaningful states surface as square metadata
 * stamps at the node's 1–2 o'clock (max two; further detail lives in the catalog slip).
 */
export function StoryNodeCore({
  node,
  nodeState,
  colors,
  size,
  canVisit,
  isVisited,
  isSelected,
  isCritical,
}: StoryNodeCoreProps): ReactElement {
  const transformationBadge = getTransformationBadge(nodeState.currentState);

  // At most two stamps at 1–2 o'clock; visit count first, then adaptation, then warning.
  const stamps: string[] = [];
  if (isVisited) {
    stamps.push(`×${nodeState.visitCount}`);
  }
  if (nodeState.currentState !== 'initial' && transformationBadge) {
    stamps.push(transformationBadge);
  }
  if (stamps.length < 2 && isCritical) {
    stamps.push('!');
  }
  const visibleStamps = stamps.slice(0, 2);

  return (
    <div
      className={`relative flex items-center justify-center rounded-full transition-opacity duration-200 ${
        canVisit ? 'cursor-pointer' : 'cursor-not-allowed'
      } ${isVisited && canVisit ? 'opacity-100' : 'opacity-40'}`}
      style={{
        width: size,
        height: size,
        backgroundColor: colors.fill,
        border: `1px solid ${isSelected ? FOCUS.onDark : colors.ink}`,
      }}
    >
      {/* The glyph and stamps are decorative repeats of what the node's aria-label says
          (perspective, visit count, transformation). They render as CSS generated content,
          not DOM text, so the passage title stays the node's only visible label and remains
          part of its accessible name (WCAG 2.5.3 Label in Name). */}
      <div
        aria-hidden="true"
        data-glyph={characterGlyph[node.character]}
        className="relative z-10 font-serif font-semibold before:content-[attr(data-glyph)]"
        style={{ fontSize: size / 3, color: '#080d10' }}
      />

      {isSelected && canVisit && (
        <div
          className="pointer-events-none absolute -inset-1 rounded-full"
          style={{ border: `2px solid ${FOCUS.onDark}` }}
          data-testid="story-node-selected"
        />
      )}

      {visibleStamps.length > 0 && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-2 -top-2 flex flex-col items-end gap-0.5"
          data-testid="story-node-stamps"
        >
          {visibleStamps.map((stamp, index) => (
            <span
              key={index}
              data-stamp={stamp}
              className="flex items-center justify-center rounded-none px-1 py-0.5 font-mono text-[10px] font-semibold leading-none before:content-[attr(data-stamp)]"
              style={{
                backgroundColor: '#0b1015',
                border: `1px solid ${colors.ink}80`,
                color: colors.ink,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
