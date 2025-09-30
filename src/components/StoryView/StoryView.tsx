import { useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStoryStore } from '@/stores';
import type { StoryNode } from '@/types';

interface StoryViewProps {
  className?: string;
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
  } = useStoryStore();

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

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && storyViewOpen) {
        closeStoryView();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [storyViewOpen, closeStoryView]);

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
            relative max-w-4xl w-full max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden
            ${className}
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`
            p-6 border-b border-gray-200 character-${currentNode.character}
          `}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Character indicator */}
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center text-white font-bold
                  bg-${currentNode.character}-500
                `}>
                  {currentNode.character[0].toUpperCase()}
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {currentNode.title}
                  </h2>
                  <div className="flex items-center space-x-3 text-sm text-gray-600 mt-1">
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
                        <span className="text-green-600 font-medium">
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
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close story view"
              >
                <svg
                  className="w-6 h-6 text-gray-400"
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

            {/* Transformation state indicator */}
            <div className="mt-4 flex items-center space-x-2">
              <span className="text-sm text-gray-500">State:</span>
              <span className={`
                px-2 py-1 rounded-full text-xs font-medium
                ${nodeState.currentState === 'initial' ? 'bg-blue-100 text-blue-800' : ''}
                ${nodeState.currentState === 'firstRevisit' ? 'bg-yellow-100 text-yellow-800' : ''}
                ${nodeState.currentState === 'metaAware' ? 'bg-purple-100 text-purple-800' : ''}
              `}>
                {nodeState.currentState === 'initial' && 'First Visit'}
                {nodeState.currentState === 'firstRevisit' && 'Returning'}
                {nodeState.currentState === 'metaAware' && 'Meta-Aware'}
              </span>

              {/* Tags */}
              <div className="flex items-center space-x-1 ml-4">
                {currentNode.metadata.thematicTags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto">
            <div className={`
              p-6
              ${preferences.textSize === 'small' ? 'text-sm' : ''}
              ${preferences.textSize === 'medium' ? 'text-base' : ''}
              ${preferences.textSize === 'large' ? 'text-lg' : ''}
              ${preferences.theme === 'sepia' ? 'bg-amber-50 text-amber-900' : ''}
              ${preferences.theme === 'dark' ? 'bg-gray-900 text-gray-100' : ''}
            `}>
              {/* Content with markdown-like formatting */}
              <motion.div
                key={nodeState.currentState}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="prose prose-gray max-w-none"
              >
                {/* Simple markdown-like rendering */}
                {currentContent.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="mb-4 leading-relaxed">
                    {paragraph.trim()}
                  </p>
                ))}
              </motion.div>

              {/* Connections */}
              {currentNode.connections.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Continue to...
                  </h3>
                  <div className="grid gap-3">
                    {currentNode.connections.map((connection, index) => {
                      const targetNode = nodes.get(connection.targetId);
                      if (!targetNode) return null;

                      return (
                        <motion.button
                          key={connection.targetId}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          type="button"
                          className={`
                            p-4 text-left rounded-lg border-2 transition-all duration-200
                            hover:shadow-md group character-${targetNode.character}
                          `}
                          onClick={() => {
                            // This would navigate to the target node
                            // TODO: Implement navigation to target node
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-gray-900 group-hover:text-gray-700">
                                {targetNode.title}
                              </div>
                              {connection.label && (
                                <div className="text-sm text-gray-600 mt-1">
                                  {connection.label}
                                </div>
                              )}
                              <div className="text-xs text-gray-500 mt-1 capitalize">
                                {connection.type} connection • {targetNode.character}
                              </div>
                            </div>
                            <svg
                              className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors"
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
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Act {currentNode.metadata.narrativeAct}
                {currentNode.metadata.criticalPath && (
                  <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded">
                    Critical Path
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  className="btn-ghost text-sm"
                  onClick={() => {
                    // This would show progress/stats
                    // TODO: Implement progress display
                  }}
                >
                  Progress
                </button>
                <button
                  type="button"
                  className="btn-secondary"
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