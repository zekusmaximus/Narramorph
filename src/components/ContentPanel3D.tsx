import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

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
 * Parses markdown content for story display
 * Supports bold, italic, and paragraph formatting
 */
function parseMarkdown(content: string): ReactNode {
  // Split into paragraphs
  let paragraphs = content.split('\n\n').filter((p) => p.trim());
  if (paragraphs.length === 1) {
    paragraphs = content.split('\n').filter((p) => p.trim());
  }

  return paragraphs.map((paragraph, pIndex) => {
    const parts: ReactNode[] = [];
    let lastIndex = 0;

    // Process bold text (**text**)
    const boldRegex = /\*\*(.*?)\*\*/g;
    let match;

    while ((match = boldRegex.exec(paragraph)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push(paragraph.slice(lastIndex, match.index));
      }
      // Add bold text
      parts.push(<strong key={`bold-${pIndex}-${match.index}`}>{match[1]}</strong>);
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < paragraph.length) {
      parts.push(paragraph.slice(lastIndex));
    }

    return (
      <p key={`p-${pIndex}`} className="mb-4 leading-relaxed">
        {parts.length > 0 ? parts : paragraph}
      </p>
    );
  });
}

/**
 * Content panel for 3D mode
 * Fixed-position overlay that slides in from the right
 */
export default function ContentPanel3D() {
  const nodes = useStoryStore((state) => state.nodes);
  const selectedNode = useStoryStore((state) => state.selectedNode);
  const storyViewOpen = useStoryStore((state) => state.storyViewOpen);
  const closeStoryView = useStoryStore((state) => state.closeStoryView);
  const getNodeState = useStoryStore((state) => state.getNodeState);
  const updateActiveVisitVariation = useStoryStore((state) => state.updateActiveVisitVariation);

  const [timeSpent, setTimeSpent] = useState(0);

  const currentNode: StoryNode | null = useMemo(() => {
    if (!selectedNode) return null;
    return nodes.get(selectedNode) || null;
  }, [nodes, selectedNode]);

  const nodeState = useMemo(() => {
    if (!selectedNode) return null;
    return getNodeState(selectedNode);
  }, [selectedNode, getNodeState]);

  // Get fallback content
  const fallbackContent = useMemo(() => {
    if (!currentNode || !nodeState) return '';
    return currentNode.content[nodeState.currentState];
  }, [currentNode, nodeState]);

  // Use variation selection
  const {
    content: currentContent,
    variationId,
    usedFallback,
  } = useVariationSelection(currentNode?.id || null, fallbackContent);

  // Get theme
  const theme = useMemo(() => {
    if (!currentNode) return characterThemes.archaeologist;
    return characterThemes[currentNode.character];
  }, [currentNode]);

  // Track reading time
  useEffect(() => {
    if (!storyViewOpen || !selectedNode) return undefined;

    const startTime = Date.now();
    const interval = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => {
      clearInterval(interval);
      setTimeSpent(0);
    };
  }, [storyViewOpen, selectedNode]);

  // Update variation ID
  useEffect(() => {
    if (storyViewOpen && selectedNode && variationId && !usedFallback) {
      updateActiveVisitVariation(variationId);
    }
  }, [storyViewOpen, selectedNode, variationId, usedFallback, updateActiveVisitVariation]);

  // Close on Escape
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && storyViewOpen) {
        closeStoryView();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [storyViewOpen, closeStoryView]);

  if (!storyViewOpen || !currentNode || !nodeState) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
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
          <div className="prose prose-lg max-w-none">
            {parseMarkdown(currentContent)}
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
