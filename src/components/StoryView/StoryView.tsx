import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStoryStore } from '@/stores';
import type { StoryNode, TransformationState, ConnectionType, CharacterType } from '@/types';

interface StoryViewProps {
  className?: string;
}

/**
 * Character theming configuration for visual consistency
 */
const characterThemes: Record<CharacterType, {
  accent: string;
  border: string;
  bg: string;
  text: string;
}> = {
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
  human: {
    accent: 'from-red-500 to-red-600',
    border: 'border-red-200',
    bg: 'bg-red-50',
    text: 'text-red-800',
  },
};

/**
 * Gets visual icon for transformation states
 */
function getStateIcon(state: TransformationState): string {
  switch (state) {
    case 'initial': return '🔵';
    case 'firstRevisit': return '🟡';
    case 'metaAware': return '🟣';
    default: return '🔵';
  }
}

/**
 * Gets human-readable label for transformation states
 */
function getStateLabel(state: TransformationState): string {
  switch (state) {
    case 'initial': return 'First Visit';
    case 'firstRevisit': return 'Returning';
    case 'metaAware': return 'Meta-Aware';
    default: return 'First Visit';
  }
}

/**
 * Gets icon for connection types
 */
function getConnectionIcon(type: ConnectionType): React.ReactNode {
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
function parseMarkdown(content: string): React.ReactNode {
  // Split into paragraphs
  const paragraphs = content.split('\n\n').filter(p => p.trim());

  return paragraphs.map((paragraph, pIndex) => {
    const currentText = paragraph;
    let key = 0;

    // Process text with bold and italic formatting
    const processedParts: React.ReactNode[] = [];

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
      processedParts.push(
        <strong key={`bold-${key++}`}>{match[2]}</strong>
      );

      lastIndex = (match.index || 0) + match[0].length;
    }

    // Add remaining text
    if (lastIndex < currentText.length) {
      processedParts.push(currentText.slice(lastIndex));
    }

    // Second pass: handle italic text within the processed parts
    const finalParts: React.ReactNode[] = [];

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
            finalParts.push(
              <em key={`italic-${key++}`}>{italicMatch[2]}</em>
            );

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

    return (
      <p key={pIndex} className="mb-4 leading-relaxed">
        {finalParts.filter(part => part !== '')}
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
    visitNode,
    getNodeState,
    selectNode,
    openStoryView,
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

  // Get current content based on transformation state
  const currentContent = useMemo(() => {
    if (!currentNode || !nodeState) return '';
    return currentNode.content[nodeState.currentState];
  }, [currentNode, nodeState]);

  // Get character theme
  const theme = useMemo(() => {
    if (!currentNode) return characterThemes.archaeologist;
    return characterThemes[currentNode.character];
  }, [currentNode]);

  // Connection navigation handler
  const handleConnectionClick = useCallback((targetNodeId: string) => {
    // Close current story view
    closeStoryView();

    // Small delay for smooth transition
    setTimeout(() => {
      // Select the target node
      selectNode(targetNodeId);

      // Visit the target node (triggers state update)
      visitNode(targetNodeId);

      // Open story view for target node
      openStoryView(targetNodeId);
    }, 150);
  }, [closeStoryView, selectNode, visitNode, openStoryView]);

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

  // Keyboard navigation for connections and general controls
  useEffect(() => {
    if (!storyViewOpen) {
      return undefined;
    }

    const handleKeyPress = (e: KeyboardEvent) => {
      const connections = currentNode?.connections || [];

      // Escape key to close
      if (e.key === 'Escape') {
        e.preventDefault();
        closeStoryView();
        return;
      }

      // Number keys 1-9 to select connections
      if (e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key, 10) - 1;
        if (connections[index]) {
          e.preventDefault();
          handleConnectionClick(connections[index].targetId);
        }
        return;
      }

      // Arrow keys for navigation
      if (e.key === 'ArrowRight' && connections[0]) {
        e.preventDefault();
        handleConnectionClick(connections[0].targetId);
        return;
      }

      if (e.key === 'ArrowLeft') {
        // Go back to node map
        e.preventDefault();
        closeStoryView();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [storyViewOpen, currentNode, handleConnectionClick, closeStoryView]);

  // Handle visit tracking when opening
  const handleVisit = useCallback(() => {
    if (selectedNode && !nodeState?.visited) {
      visitNode(selectedNode);
    }
  }, [selectedNode, nodeState?.visited, visitNode]);

  // Auto-visit when story view opens
  useEffect(() => {
    if (storyViewOpen && selectedNode) {
      handleVisit();
    }
  }, [storyViewOpen, selectedNode, handleVisit]);

  if (!storyViewOpen || !currentNode || !nodeState) {
    return null;
  }

  const connections = currentNode.connections || [];

  return (
    <AnimatePresence>
      <motion.div
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
            ${preferences.theme === 'dark' ? 'bg-gray-900' : ''}
            ${preferences.theme === 'light' ? 'bg-white' : ''}
            ${preferences.theme === 'sepia' ? 'bg-amber-50' : ''}
            rounded-xl shadow-2xl
            ${className}
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with character theming */}
          <div className={`
            p-6 border-b
            ${preferences.theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}
            bg-gradient-to-r ${theme.accent}
          `}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Character indicator */}
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold bg-white/20 backdrop-blur-sm">
                  {currentNode.character[0].toUpperCase()}
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {currentNode.title}
                  </h2>
                  <div className="flex items-center space-x-3 text-sm text-white/80 mt-1">
                    <span className="capitalize font-medium">
                      {currentNode.character}
                    </span>
                    <span>•</span>
                    <span>
                      {currentNode.metadata.estimatedReadTime} min read
                    </span>
                    {nodeState.visited && (
                      <>
                        <span>•</span>
                        <span className="font-medium">
                          Visit #{nodeState.visitCount}
                        </span>
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
                <div className={`
                  px-3 py-1.5 rounded-full text-sm font-medium flex items-center space-x-2
                  bg-white/10 backdrop-blur-sm text-white
                `}>
                  <span>{getStateIcon(nodeState.currentState)}</span>
                  <span>{getStateLabel(nodeState.currentState)}</span>
                </div>

                {/* Visit counter */}
                {nodeState.visited && nodeState.visitCount >= 2 && (
                  <div className="text-sm text-white/70">
                    <span className="text-xs">
                      (transformed {nodeState.visitCount - 1}x)
                    </span>
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
                Reading: {formatTime(timeSpentOnNode)} / ~{currentNode.metadata.estimatedReadTime} min
              </div>
            </div>
          </div>

          {/* Content area with improved typography */}
          <div className="flex-1 overflow-y-auto">
            <div className={`
              p-8 max-w-3xl mx-auto
              ${preferences.textSize === 'small' ? 'text-sm' : ''}
              ${preferences.textSize === 'medium' ? 'text-base' : ''}
              ${preferences.textSize === 'large' ? 'text-lg' : ''}
              ${preferences.theme === 'sepia' ? 'bg-amber-50 text-amber-900' : ''}
              ${preferences.theme === 'dark' ? 'bg-gray-900 text-gray-100' : ''}
              ${preferences.theme === 'light' ? 'bg-white text-gray-900' : ''}
            `}>
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

              {/* Enhanced connections with visual feedback */}
              {connections.length > 0 && (
                <div className={`
                  mt-8 pt-6 border-t
                  ${preferences.theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}
                `}>
                  <h3 className={`
                    text-lg font-semibold mb-4
                    ${preferences.theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}
                  `}>
                    Continue to...
                  </h3>
                  <div className="grid gap-3">
                    {connections.map((connection, index) => {
                      const targetNode = nodes.get(connection.targetId);
                      if (!targetNode) return null;

                      const targetNodeState = getNodeState(connection.targetId);
                      const visitedAlready = targetNodeState?.visited || false;
                      const visitCount = targetNodeState?.visitCount || 0;

                      return (
                        <motion.button
                          key={connection.targetId}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          type="button"
                          className={`
                            p-4 text-left rounded-lg border-2 transition-all duration-200
                            hover:shadow-md hover:scale-[1.02] group
                            ${visitedAlready
                              ? `border-gray-300 ${preferences.theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`
                              : `${theme.border} ${theme.bg}`
                            }
                            ${preferences.theme === 'dark' && !visitedAlready ? 'border-gray-600 bg-gray-800' : ''}
                          `}
                          onClick={() => handleConnectionClick(connection.targetId)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className={`
                                font-semibold group-hover:text-blue-600
                                ${preferences.theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}
                              `}>
                                {targetNode.title}
                              </div>
                              {connection.label && (
                                <div className={`
                                  text-sm mt-1 flex items-center space-x-2
                                  ${preferences.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}
                                `}>
                                  <span>{getConnectionIcon(connection.type)}</span>
                                  <span>{connection.label}</span>
                                </div>
                              )}
                              <div className={`
                                text-xs mt-1 capitalize
                                ${preferences.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}
                              `}>
                                {targetNode.character} • {targetNode.metadata.estimatedReadTime} min
                                {visitedAlready && (
                                  <span className="ml-2 text-green-600">
                                    ✓ Visited {visitCount}x
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {/* Connection number for keyboard navigation */}
                              <span className={`
                                text-xs px-1.5 py-0.5 rounded
                                ${preferences.theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}
                              `}>
                                {index + 1}
                              </span>
                              <svg
                                className={`
                                  w-5 h-5 transition-colors group-hover:text-blue-600
                                  ${preferences.theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}
                                `}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Keyboard navigation hints */}
                  <div className={`
                    text-xs mt-4 text-center
                    ${preferences.theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}
                  `}>
                    Press 1-{connections.length} to navigate • ← Back • ESC to close
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced footer */}
          <div className={`
            p-6 border-t
            ${preferences.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}
          `}>
            <div className="flex items-center justify-between">
              <div className={`
                text-sm
                ${preferences.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}
              `}>
                Act {currentNode.metadata.narrativeAct}
                {currentNode.metadata.criticalPath && (
                  <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded">
                    Critical Path
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <div className={`
                  text-sm
                  ${preferences.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}
                `}>
                  Reading: {formatTime(timeSpentOnNode)}
                </div>
                <button
                  type="button"
                  className={`
                    px-4 py-2 rounded-lg transition-colors text-sm font-medium
                    ${preferences.theme === 'dark'
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
    </AnimatePresence>
  );
}