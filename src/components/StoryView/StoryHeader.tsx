import type { ReactElement } from 'react';

import type { NodeUIState, StoryNode, VariationMetadata } from '@/types';

import { getStateGlyph, getStateLabel, type StoryCharacterTheme } from './storyPresentation';

interface StoryHeaderProps {
  node: StoryNode;
  nodeState: NodeUIState;
  theme: StoryCharacterTheme;
  estimatedReadingTime: string;
  variationId: string | null;
  variationMetadata: VariationMetadata | null;
  usedFallback: boolean;
  variationError: Error | null;
  onClose: () => void;
}

export function StoryHeader({
  node,
  nodeState,
  theme,
  estimatedReadingTime,
  variationId,
  variationMetadata,
  usedFallback,
  variationError,
  onClose,
}: StoryHeaderProps): ReactElement {
  return (
    <header className={`border-b border-white/10 bg-gradient-to-r ${theme.accent}`}>
      <div className="flex items-start justify-between gap-3 px-4 pb-4 pt-5 sm:gap-6 sm:px-7 sm:pb-5 sm:pt-6">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-sm font-semibold text-white/90 sm:h-10 sm:w-10">
            {node.character[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="mb-1 text-[0.65rem] font-medium uppercase tracking-[0.24em] text-white/55">
              Recovered passage
            </p>
            <h2
              id="story-view-title"
              className="font-serif text-xl leading-tight text-white sm:text-2xl"
            >
              {node.title}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/65 sm:text-sm">
              <span className="capitalize">{node.character.replace('-', ' ')}</span>
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
          className="shrink-0 rounded-full border border-white/10 p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Close story view"
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

      <div className="flex flex-wrap items-center gap-2 border-t border-white/5 px-4 py-3 sm:px-7">
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80">
          <span>{getStateGlyph(nodeState.currentState)}</span>
          <span>{getStateLabel(nodeState.currentState)}</span>
        </div>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <div className="border-t border-white/5 px-4 py-2 font-mono text-xs text-white/50 sm:px-7">
          {variationId && (
            <div>
              Variation: {variationId}
              {variationMetadata?.awarenessLevel && ` • ${variationMetadata.awarenessLevel}`}
              {variationMetadata?.journeyPattern &&
                variationMetadata.journeyPattern !== 'unknown' &&
                ` • ${variationMetadata.journeyPattern}`}
            </div>
          )}
          {usedFallback && !variationError && (
            <div className="mt-1 text-yellow-300/80">Using fallback content</div>
          )}
          {variationError && (
            <div className="mt-1 text-red-300/80">Variation error: {variationError.message}</div>
          )}
        </div>
      )}
    </header>
  );
}
