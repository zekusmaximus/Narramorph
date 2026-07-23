import type { ReactElement } from 'react';

import type { NodeColors } from './nodeTheme';

interface StoryNodeEffectsProps {
  colors: NodeColors;
  size: number;
  isConnectionTarget: boolean;
}

/**
 * The only remaining node overlay: a hairline ring marking nodes reachable from the
 * current selection. No glow, blur, ripple or RGB-split — Accession conveys state with
 * flat rules and stamps instead of neon halos.
 */
export function StoryNodeEffects({
  colors,
  size,
  isConnectionTarget,
}: StoryNodeEffectsProps): ReactElement | null {
  if (!isConnectionTarget) {
    return null;
  }
  return (
    <div
      className="pointer-events-none absolute rounded-full"
      style={{
        width: size + 12,
        height: size + 12,
        left: -6,
        top: -6,
        border: `1px dashed ${colors.ink}`,
        opacity: 0.7,
      }}
      data-testid="story-node-connection-target"
    />
  );
}
