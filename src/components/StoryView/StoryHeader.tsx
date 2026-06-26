import type { ReactElement } from 'react';

import type { NodeUIState, StoryNode, VariationMetadata } from '@/types';

import {
  formatReadingTime,
  getStateGlyph,
  getStateLabel,
  type StoryCharacterTheme,
} from './storyPresentation';

interface StoryHeaderProps {
  node: StoryNode;
  nodeState: NodeUIState;
  theme: StoryCharacterTheme;
  timeSpent: number;
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
  timeSpent,
  variationId,
  variationMetadata,
  usedFallback,
  variationError,
  onClose,
}: StoryHeaderProps): ReactElement {
  return (
    <div className={`p-6 border-b bg-gradient-to-r ${theme.accent}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold bg-white/20 backdrop-blur-sm">
            {node.character[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <h2 id="story-view-title" className="text-2xl font-bold text-white">
              {node.title}
            </h2>
            <div className="flex items-center space-x-3 text-sm text-white/80 mt-1">
              <span className="capitalize font-medium">{node.character}</span>
              <span>•</span>
              <span>{node.metadata.estimatedReadTime} min read</span>
              {nodeState.visited && (
                <>
                  <span>•</span>
                  <span className="font-medium">Visit #{nodeState.visitCount}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
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

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="px-3 py-1.5 rounded-full text-sm font-medium flex items-center space-x-2 bg-white/10 backdrop-blur-sm text-white">
            <span>{getStateGlyph(nodeState.currentState)}</span>
            <span>{getStateLabel(nodeState.currentState)}</span>
          </div>
          {nodeState.visited && nodeState.visitCount >= 2 && (
            <div className="text-sm text-white/70">
              <span className="text-xs">(transformed {nodeState.visitCount - 1}x)</span>
            </div>
          )}
          <div className="flex items-center space-x-1">
            {node.metadata.thematicTags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-white/10 backdrop-blur-sm text-white/80 text-xs rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="text-sm text-white/70">
          Reading: {formatReadingTime(timeSpent)} / ~{node.metadata.estimatedReadTime} min
        </div>
      </div>

      {process.env.NODE_ENV === 'development' && variationId && (
        <div className="mt-3 text-xs text-white/60 font-mono">
          Variation: {variationId}
          {variationMetadata?.awarenessLevel && ` • ${variationMetadata.awarenessLevel}`}
          {variationMetadata?.journeyPattern &&
            variationMetadata.journeyPattern !== 'unknown' &&
            ` • ${variationMetadata.journeyPattern}`}
        </div>
      )}
      {usedFallback && !variationError && (
        <div className="mt-3 text-xs text-yellow-300 flex items-center space-x-1">
          <span>⚠</span>
          <span>Using fallback content (variation system unavailable)</span>
        </div>
      )}
      {variationError && (
        <div className="mt-3 text-xs text-red-300 flex items-center space-x-1">
          <span>⚠</span>
          <span>Variation selection error: {variationError.message}</span>
        </div>
      )}
    </div>
  );
}
