import type { ReactElement } from 'react';

import type { NodeUIState, StoryNode } from '@/types';

import {
  getCharacterLabel,
  getStateGlyph,
  getStateLabel,
  type StoryCharacterTheme,
} from './storyPresentation';

interface StoryHeaderProps {
  node: StoryNode;
  nodeState: NodeUIState;
  theme: StoryCharacterTheme;
  estimatedReadingTime: string;
  usedFallback: boolean;
  variationError: Error | null;
  onClose: () => void;
}

export function StoryHeader({
  node,
  nodeState,
  theme,
  estimatedReadingTime,
  usedFallback,
  variationError,
  onClose,
}: StoryHeaderProps): ReactElement {
  return (
    <header
      className={`min-w-0 overflow-x-hidden border-b border-white/10 bg-gradient-to-r ${theme.accent}`}
    >
      <div className="flex min-w-0 items-start justify-between gap-3 px-4 pb-4 pt-5 sm:gap-6 sm:px-7 sm:pb-5 sm:pt-6">
        <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
          <div
            aria-hidden="true"
            className="mt-0.5 hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-sm font-semibold text-white/90 sm:flex sm:h-10 sm:w-10"
          >
            {node.character[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="mb-1 break-words text-[0.65rem] font-medium uppercase tracking-[0.24em] text-white/55 [overflow-wrap:anywhere]">
              Recovered passage
            </p>
            <h2
              id="story-view-title"
              tabIndex={-1}
              className="break-words font-serif text-xl leading-tight text-white [overflow-wrap:anywhere] sm:text-2xl"
            >
              {node.title}
            </h2>
            <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/65 sm:text-sm">
              <span className="min-w-0 break-words [overflow-wrap:anywhere]">
                {getCharacterLabel(node.character)}
              </span>
              <span aria-hidden="true">·</span>
              <span>{estimatedReadingTime}</span>
              {nodeState.visited && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Visit #{nodeState.visitCount}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border border-white/10 p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          <svg
            className="w-6 h-6 text-white/80"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-2 border-t border-white/5 px-4 py-3 sm:px-7">
        <div className="flex max-w-full min-w-0 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80">
          <span aria-hidden="true" className="shrink-0">
            {getStateGlyph(nodeState.currentState)}
          </span>
          <span className="min-w-0 break-words [overflow-wrap:anywhere]">
            {getStateLabel(nodeState.currentState)}
          </span>
        </div>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <div className="border-t border-white/5 px-4 py-2 font-mono text-xs text-white/50 sm:px-7">
          {usedFallback && !variationError && (
            <div className="text-yellow-300/80">Using fallback content</div>
          )}
          {variationError && (
            <div className="mt-1 text-red-300/80">Variation error: {variationError.message}</div>
          )}
        </div>
      )}
    </header>
  );
}
