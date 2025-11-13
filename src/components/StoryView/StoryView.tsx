import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStoryStore } from '@/stores';
import { useVariationSelection } from '@/hooks/useVariationSelection';
import { VariationDebugPanel } from './VariationDebugPanel';
import type {
  StoryNode,
  TransformationState,
  CharacterType,
  ConnectionType,
} from '@/types';

interface StoryViewProps {
  className?: string;
}

/**
 * Character theming configuration for visual consistency
 */
const characterThemes: Record<
  CharacterType,
  {
    accent: string;
    border: string;
    bg: string;
    text: string;
  }
> = {
  archaeologist: {
    accent: 'from-blue-500 to-blue-600',
    border: 'border-blue-200',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
  },
  algorithm: {
    accent: 'from-green-500 to-green-600',
    border: 'border-green-200',
    bg: 'bg-green-50',
    text: 'text-green-800',
  },
  'last-human': {
    accent: 'from-red-500 to-red-600',
    border: 'border-red-200',
    bg: 'bg-red-50',
    text: 'text-red-800',
  },
  'multi-perspective': {
    accent: 'from-purple-500 to-purple-600',
    border: 'border-purple-200',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
  },
};

/**
 * Gets visual icon for transformation states
 * Currently unused but kept for future feature
 */
// @ts-expect-error - Unused but kept for future feature
function getStateIcon(state: TransformationState): string {
  switch (state) {
    case 'initial':
      return '🔵';
    case 'firstRevisit':
      return '🟡';
    case 'metaAware':
      return '🟣';
    default:
      return '🔵';
  }
}

/**
 * Gets human-readable label for transformation states
 * Currently unused but kept for future feature
 */
// @ts-expect-error - Unused but kept for future feature
function getStateLabel(state: TransformationState): string {
  switch (state) {
    case 'initial':
      return 'First Visit';
    case 'firstRevisit':
      return 'Returning';
    case 'metaAware':
      return 'Meta-Aware';
    default:
      return 'First Visit';
  }
}

/**
 * Gets icon for connection types
 * Currently unused but kept for future feature
 */
// @ts-expect-error - Unused but kept for future feature
function getConnectionIcon(type: ConnectionType): ReactNode {
  switch (type) {
    case 'temporal':
      return <span className="text-blue-500">⏱️</span>;
    case 'consciousness':
      return <span className="text-green-500">🧠</span>;
    case 'recursive':
      return <span className="text-red-500">🔄</span>;
    case 'hidden':
      return <span className="text-purple-500">🔒</span>;
    default:
      return <span className="text-blue-500">⏱️</span>;
  }
}

/**
 * Formats time duration in readable format
 */
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Parses markdown content for story display
 * Supports bold, italic, and paragraph formatting
 */
function parseMarkdown(content: string): ReactNode {
  // Split into paragraphs - L1 nodes use double newlines, L2 nodes use single newlines
  // Try double newlines first, fall back to single newlines if we only get one paragraph
  let paragraphs = content.split('\n\n').filter((p) => p.trim());
  if (paragraphs.length === 1) {
    paragraphs = content.split('\n').filter((p) => p.trim());
  }

  return paragraphs.map((paragraph, pIndex) => {
    const currentText = paragraph;
    let key = 0;

    // Process text with bold and italic formatting
    const processedParts: ReactNode[] = [];

    // Regex patterns for markdown formatting
    const boldPattern = /(\*\*|__)(.*?)\1/g;
    const italicPattern = /(\*|_)(.*?)\1/g;

    // First pass: handle bold text
    let match;
    let lastIndex = 0;

    while ((match = boldPattern.exec(currentText)) !== null) {
      // Add text before the match
      if (match.index && match.index > lastIndex) {
        processedParts.push(currentText.slice(lastIndex, match.index));
      }

      // Add bold text
      processedParts.push(<strong key={`bold-${key++}`}>{match[2]}</strong>);

      lastIndex = (match.index || 0) + match[0].length;
    }

    // Add remaining text
    if (lastIndex < currentText.length) {
      processedParts.push(currentText.slice(lastIndex));
    }

    // Second pass: handle italic text within the processed parts
    const finalParts: ReactNode[] = [];

    processedParts.forEach((part) => {
      if (typeof part === 'string') {
        // Process italic formatting in string parts
        const italicMatches = [...part.matchAll(italicPattern)];
        if (italicMatches.length > 0) {
          let stringLastIndex = 0;

          italicMatches.forEach((italicMatch) => {
            // Add text before italic
            const matchIndex = italicMatch.index || 0;
            if (matchIndex > stringLastIndex) {
              finalParts.push(part.slice(stringLastIndex, matchIndex));
            }

            // Add italic text
            finalParts.push(<em key={`italic-${key++}`}>{italicMatch[2]}</em>);

            stringLastIndex = matchIndex + italicMatch[0].length;
          });

          // Add remaining text
          if (stringLastIndex < part.length) {
            finalParts.push(part.slice(stringLastIndex));
          }
        } else {
          finalParts.push(part);
        }
      } else {
        // Keep non-string parts (bold elements) as-is
        finalParts.push(part);
      }
    });

    // Filter out empty parts first, then map with index
    const nonEmptyParts = finalParts.filter((part) => part !== '');

    return (
      <p key={`paragraph-${pIndex}`} className="mb-4 leading-relaxed">
        {nonEmptyParts.map((part, index) => {
          // If part is already a React element with a key, return it with a new wrapper to ensure uniqueness
          if (typeof part === 'object' && part !== null && 'key' in part) {
            return <span key={`wrapper-${pIndex}-${index}`}>{part}</span>;
          }
          // Otherwise, wrap it with a unique key
          return <span key={`part-${pIndex}-${index}`}>{part}</span>;
        })}
      </p>
    );
  });
}

/**
 * Story reading component that displays node content based on transformation state
 */
export default function StoryView({ className = '' }: StoryViewProps) {
  const {
    nodes,
    selectedNode,
    storyViewOpen,
    preferences,
    closeStoryView,
    getNodeState,
    updateActiveVisitVariation,
    finalizeActiveVisit,
  } = useStoryStore();

  // Reading time tracking
  const [timeSpentOnNode, setTimeSpentOnNode] = useState(0);

  const currentNode: StoryNode | null = useMemo(() => {
    if (!selectedNode) return null;
    return nodes.get(selectedNode) || null;
  }, [nodes, selectedNode]);

  const nodeState = useMemo(() => {
    if (!selectedNode) return null;
    return getNodeState(selectedNode);
  }, [selectedNode, getNodeState]);

  // Get static fallback content based on transformation state
  const fallbackContent = useMemo(() => {
    if (!currentNode || !nodeState) return '';
    return currentNode.content[nodeState.currentState];
  }, [currentNode, nodeState]);

  // Use variation selection hook to get dynamic content
  const {
    content: currentContent,
    variationId,
    metadata: variationMetadata,
    usedFallback,
    error: variationError,
  } = useVariationSelection(currentNode?.id || null, fallbackContent);

  // Get character theme
  const theme = useMemo(() => {
    if (!currentNode) return characterThemes.archaeologist;
    return characterThemes[currentNode.character];
  }, [currentNode]);

  // Reading time tracking
  useEffect(() => {
    if (!storyViewOpen || !selectedNode) {
      return undefined;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      setTimeSpentOnNode(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => {
      clearInterval(interval);
      // Reset time when closing/changing nodes
      setTimeSpentOnNode(0);
    };
  }, [storyViewOpen, selectedNode]);

  // Keyboard navigation - only ESC to close
  useEffect(() => {
    if (!storyViewOpen) {
      return undefined;
    }

    const handleKeyPress = (e: KeyboardEvent) => {
      // Escape key to close
      if (e.key === 'Escape') {
        e.preventDefault();
        closeStoryView();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [storyViewOpen, closeStoryView]);

  // Update active visit with variationId once it's determined
  useEffect(() => {
    if (storyViewOpen && selectedNode && variationId && !usedFallback) {
      updateActiveVisitVariation(variationId);
    }
  }, [storyViewOpen, selectedNode, variationId, usedFallback, updateActiveVisitVariation]);

  // Finalize active visit on unmount
  useEffect(() => {
    return () => {
      // Cleanup: finalize active visit when component unmounts
      finalizeActiveVisit();
    };
  }, [finalizeActiveVisit]);

  if (!storyViewOpen || !currentNode || !nodeState) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        key={`story-modal-${selectedNode}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={closeStoryView}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`
            relative max-w-4xl w-full max-h-[90vh] overflow-hidden
            flex flex-col
            ${preferences.theme === 'dark' ? 'bg-gray-900' : ''}
            ${preferences.theme === 'light' ? 'bg-white' : ''}
            ${preferences.theme === 'sepia' ? 'bg-amber-50' : ''}
            rounded-xl shadow-2xl
            ${className}
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with character theming */}
          <div
            className={`
            p-6 border-b
            ${preferences.theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}
            bg-gradient-to-r ${theme.accent}
          `}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Character indicator */}
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold bg-white/20 backdrop-blur-sm">
                  {currentNode.character[0].toUpperCase()}
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-white">{currentNode.title}</h2>
                  <div className="flex items-center space-x-3 text-sm text-white/80 mt-1">
                    <span className="capitalize font-medium">{currentNode.character}</span>
                    <span>•</span>
                    <span>{currentNode.metadata.estimatedReadTime} min read</span>
                    {nodeState.visited && (
                      <>
                        <span>•</span>
                        <span className="font-medium">Visit #{nodeState.visitCount}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Close button */}
              <button
                type="button"
                onClick={closeStoryView}
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

            {/* Enhanced transformation state indicator */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* State badge with icon */}
                <div
                  className={`
                  px-3 py-1.5 rounded-full text-sm font-medium flex items-center space-x-2
                  bg-white/10 backdrop-blur-sm text-white
                `}
                >
                  <span>
                    {nodeState.currentState === 'initial'
                      ? '●'
                      : nodeState.currentState === 'firstRevisit'
                        ? '◑'
                        : '◎'}
                  </span>
                  <span>{getStateLabel(nodeState.currentState)}</span>
                </div>

                {/* Visit counter */}
                {nodeState.visited && nodeState.visitCount >= 2 && (
                  <div className="text-sm text-white/70">
                    <span className="text-xs">(transformed {nodeState.visitCount - 1}x)</span>
                  </div>
                )}

                {/* Tags */}
                <div className="flex items-center space-x-1">
                  {currentNode.metadata.thematicTags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-white/10 backdrop-blur-sm text-white/80 text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Reading progress */}
              <div className="text-sm text-white/70">
                Reading: {formatTime(timeSpentOnNode)} / ~{currentNode.metadata.estimatedReadTime}{' '}
                min
              </div>
            </div>

            {/* Variation metadata display (development mode) */}
            {process.env.NODE_ENV === 'development' && variationId && (
              <div className="mt-3 text-xs text-white/60 font-mono">
                Variation: {variationId}
                {variationMetadata?.awarenessLevel && ` • ${variationMetadata.awarenessLevel}`}
                {variationMetadata?.journeyPattern &&
                  variationMetadata.journeyPattern !== 'unknown' &&
                  ` • ${variationMetadata.journeyPattern}`}
              </div>
            )}

            {/* Fallback warning */}
            {usedFallback && !variationError && (
              <div className="mt-3 text-xs text-yellow-300 flex items-center space-x-1">
                <span>⚠</span>
                <span>Using fallback content (variation system unavailable)</span>
              </div>
            )}

            {/* Error display */}
            {variationError && (
              <div className="mt-3 text-xs text-red-300 flex items-center space-x-1">
                <span>⚠</span>
                <span>Variation selection error: {variationError.message}</span>
              </div>
            )}
          </div>

          {/* Content area with improved typography */}
          <div className="flex-1 overflow-y-auto">
            <div
              className={`
              p-8 max-w-3xl mx-auto
              ${preferences.textSize === 'small' ? 'text-sm' : ''}
              ${preferences.textSize === 'medium' ? 'text-base' : ''}
              ${preferences.textSize === 'large' ? 'text-lg' : ''}
              ${preferences.theme === 'sepia' ? 'bg-amber-50 text-amber-900' : ''}
              ${preferences.theme === 'dark' ? 'bg-gray-900 text-gray-100' : ''}
              ${preferences.theme === 'light' ? 'bg-white text-gray-900' : ''}
            `}
            >
              {/* Content with markdown rendering and smooth transitions */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={nodeState.currentState} // Re-mount on state change
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="prose prose-gray max-w-none leading-loose"
                >
                  {parseMarkdown(currentContent)}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Enhanced footer */}
          <div
            className={`
            p-6 border-t
            ${preferences.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}
          `}
          >
            <div className="flex items-center justify-between">
              <div
                className={`
                text-sm
                ${preferences.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}
              `}
              >
                Act {currentNode.metadata.narrativeAct}
                {currentNode.metadata.criticalPath && (
                  <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded">
                    Critical Path
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <div
                  className={`
                  text-sm
                  ${preferences.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}
                `}
                >
                  Reading: {formatTime(timeSpentOnNode)}
                </div>
                <button
                  type="button"
                  className={`
                    px-4 py-2 rounded-lg transition-colors text-sm font-medium
                    ${
                      preferences.theme === 'dark'
                        ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }
                  `}
                  onClick={closeStoryView}
                >
                  Back to Map
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Debug panel - only in development */}
      {process.env.NODE_ENV === 'development' && (
        <VariationDebugPanel
          key="variation-debug-panel"
          nodeId={currentNode?.id || null}
          variationId={variationId}
          variationMetadata={variationMetadata}
          usedFallback={usedFallback}
        />
      )}
    </AnimatePresence>
  );
}
