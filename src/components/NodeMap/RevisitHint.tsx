import { X } from 'lucide-react';
import { useState, type ReactElement } from 'react';

import { useStoryStore } from '@/stores';

import { hasSeenRevisitHint, markRevisitHintSeen } from './revisitHintStorage';

/**
 * A single, dismissible hint that reopening a passage may change it (Phase 7.1,
 * revisitation discovery). It appears once the reader has opened at least one
 * passage and is back on the map — never while reading, never before there is
 * anything to revisit — and never again after it is dismissed. It carries no
 * motion, so it needs no reduced-motion handling, and it is fully keyboard- and
 * screen-reader-reachable. It invites, but does not force, a revisit.
 */
export function RevisitHint(): ReactElement | null {
  const [dismissed, setDismissed] = useState(() => hasSeenRevisitHint());
  const hasOpenedPassage = useStoryStore(
    (state) => Object.keys(state.progress.visitedNodes).length > 0,
  );
  const storyViewOpen = useStoryStore((state) => state.storyViewOpen);

  if (dismissed || !hasOpenedPassage || storyViewOpen) {
    return null;
  }

  const handleDismiss = (): void => {
    markRevisitHintSeen();
    setDismissed(true);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="revisit-hint"
      className="pointer-events-none absolute bottom-3 left-1/2 z-40 flex w-[min(92%,26rem)] max-w-[calc(100%-1.5rem)] -translate-x-1/2 items-start gap-2 rounded-lg border border-cyan-200/25 bg-[#11191e]/95 px-4 py-3 text-sm text-slate-200 shadow-xl backdrop-blur"
    >
      <p className="min-w-0 flex-1 leading-relaxed">
        The archive remembers. Reopen a passage you&apos;ve read and it may have changed.
      </p>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss revisit hint"
        className="pointer-events-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/10 hover:text-cyan-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
