import { type ReactElement } from 'react';

import type { ResolvedBridge } from '@/domain/bridges/edgeBridge';
import type { Theme } from '@/types';

import { MarkdownContent } from './MarkdownContent';

interface StoryBridgeProps {
  bridge: ResolvedBridge;
  theme: Theme;
}

/**
 * Condition-aware edge prose rendered at passage entry (Phase 4.2).
 *
 * The bridge is a static block inside the reading flow — never a timed or auto-dismissed element —
 * so assistive technology can always read it. It is a transition into the passage, not a separate
 * visited node, and carries no interactive controls.
 */
export function StoryBridge({ bridge, theme }: StoryBridgeProps): ReactElement {
  const toneClass =
    theme === 'sepia'
      ? 'border-[#c9b892] text-[#6b5d45]'
      : theme === 'light'
        ? 'border-slate-300 text-slate-500'
        : 'border-white/10 text-slate-400';

  return (
    <div
      role="note"
      aria-label="Passage transition"
      data-testid="story-bridge"
      className={`mx-auto w-full min-w-0 max-w-[44rem] border-l-2 px-5 py-3 font-serif text-sm italic leading-relaxed sm:px-8 ${toneClass}`}
    >
      <MarkdownContent content={bridge.content} />
    </div>
  );
}
