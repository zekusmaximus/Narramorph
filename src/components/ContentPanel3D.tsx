import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useMemo, type ReactElement } from 'react';

import { useMapInteractionAdapter } from '@/components/map/useMapInteractionAdapter';
import { MarkdownContent } from '@/components/StoryView/MarkdownContent';
import { useDialogFocus } from '@/hooks/useDialogFocus';
import { useReadingTimer } from '@/hooks/useReadingTimer';
import { useVariationSelection } from '@/hooks/useVariationSelection';
import { useStoryStore } from '@/stores';
import type { CharacterType, StoryNode } from '@/types';

/**
 * Character theming configuration
 */
const characterThemes: Record<CharacterType, { accent: string }> = {
  archaeologist: { accent: 'from-blue-500 to-blue-600' },
  algorithm: { accent: 'from-green-500 to-green-600' },
  'last-human': { accent: 'from-red-500 to-red-600' },
  'multi-perspective': { accent: 'from-purple-500 to-purple-600' },
};

/**
 * Content panel for 3D mode
 * Fixed-position overlay that slides in from the right
 */
export default function ContentPanel3D(): ReactElement | null {
  const adapter = useMapInteractionAdapter('3d');
  const nodes = useStoryStore((state) => state.nodes);
  const getNodeState = useStoryStore((state) => state.getNodeState);
  const updateActiveVisitVariation = useStoryStore((state) => state.updateActiveVisitVariation);
  const selectedNode = adapter.selectedNodeId;
  const storyViewOpen = adapter.panel.open;
  const closeStoryView = adapter.panel.close;
  const dialogRef = useDialogFocus(storyViewOpen, closeStoryView);
  const timeSpent = useReadingTimer(storyViewOpen, selectedNode);

  const currentNode: StoryNode | null = useMemo(() => {
    if (!selectedNode) {
      return null;
    }
    return nodes.get(selectedNode) || null;
  }, [nodes, selectedNode]);

  const nodeState = useMemo(() => {
    if (!selectedNode) {
      return null;
    }
    return getNodeState(selectedNode);
  }, [selectedNode, getNodeState]);

  // Get fallback content
  const fallbackContent = useMemo(() => {
    if (!currentNode || !nodeState) {
      return '';
    }
    return currentNode.content[nodeState.currentState];
  }, [currentNode, nodeState]);

  // Use variation selection
  const {
    content: currentContent,
    variationId,
    usedFallback,
    error: variationError,
  } = useVariationSelection(currentNode?.id || null, fallbackContent);

  // Get theme
  const theme = useMemo(() => {
    if (!currentNode) {
      return characterThemes.archaeologist;
    }
    return characterThemes[currentNode.character];
  }, [currentNode]);

  // Update variation ID
  useEffect(() => {
    if (storyViewOpen && selectedNode && variationId && !usedFallback) {
      updateActiveVisitVariation(variationId);
    }
  }, [storyViewOpen, selectedNode, variationId, usedFallback, updateActiveVisitVariation]);

  if (!storyViewOpen || !currentNode || !nodeState) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="content-panel-title"
        tabIndex={-1}
        key={`content-panel-${selectedNode}`}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col pointer-events-auto"
      >
        {/* Header */}
        <div className={`p-6 border-b border-gray-200 bg-gradient-to-r ${theme.accent}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold bg-white/20">
                {currentNode.character[0]?.toUpperCase() ?? '?'}
              </div>
              <div>
                <h2 id="content-panel-title" className="text-2xl font-bold text-white">
                  {currentNode.title}
                </h2>
                <div className="flex items-center space-x-3 text-sm text-white/80 mt-1">
                  <span className="capitalize font-medium">{currentNode.character}</span>
                  <span>•</span>
                  <span>{currentNode.metadata.estimatedReadTime} min read</span>
                  {nodeState.visited && (
                    <>
                      <span>•</span>
                      <span>Visit #{nodeState.visitCount}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={closeStoryView}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors text-white"
              aria-label="Close content panel"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Error banner if variation content failed to load */}
          {variationError && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Dynamic content unavailable. Showing fallback content.
              </p>
              {usedFallback && (
                <p className="text-xs text-yellow-600 mt-1">Using static variation instead.</p>
              )}
            </div>
          )}

          <div className="prose prose-lg max-w-none">
            <MarkdownContent content={currentContent} />
          </div>

          {/* Reading time tracker */}
          <div className="mt-8 pt-4 border-t border-gray-200 text-sm text-gray-500">
            Time spent: {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
