import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactElement } from 'react';

import { useMapInteractionAdapter } from '@/components/map/useMapInteractionAdapter';
import { MarkdownContent } from '@/components/StoryView/MarkdownContent';
import { getCharacterLabel } from '@/components/StoryView/storyPresentation';
import { useDialogFocus } from '@/hooks/useDialogFocus';
import { useReadingTimer } from '@/hooks/useReadingTimer';
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';
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

function get3DMapReturnTarget(): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    '[role="application"][aria-label="Three-dimensional story node map"]',
  );
}

/**
 * Content panel for 3D mode
 * Fixed-position overlay that slides in from the right
 */
export default function ContentPanel3D(): ReactElement | null {
  const adapter = useMapInteractionAdapter('3d');
  const nodes = useStoryStore((state) => state.nodes);
  const getNodeState = useStoryStore((state) => state.getNodeState);
  const preferences = useStoryStore((state) => state.preferences);
  const updateActiveVisitVariation = useStoryStore((state) => state.updateActiveVisitVariation);
  const selectedNode = adapter.selectedNodeId;
  const storyViewOpen = adapter.panel.open;
  const closeStoryView = adapter.panel.close;
  const [modalPanel, setModalPanel] = useState(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(max-width: 1023px)').matches,
  );
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      return undefined;
    }
    const panelQuery = window.matchMedia('(max-width: 1023px)');
    const updatePanelMode = (): void => setModalPanel(panelQuery.matches);
    updatePanelMode();
    panelQuery.addEventListener('change', updatePanelMode);
    return () => panelQuery.removeEventListener('change', updatePanelMode);
  }, []);
  const dialogRef = useDialogFocus(storyViewOpen, closeStoryView, {
    focusKey: selectedNode,
    initialFocusSelector: '#content-panel-title',
    modal: modalPanel,
    restoreFocus: get3DMapReturnTarget,
  });
  const reduceMotion = useReducedMotionPreference();
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
    <motion.div
      ref={dialogRef}
      role="dialog"
      aria-modal={modalPanel ? 'true' : undefined}
      aria-labelledby="content-panel-title"
      aria-describedby="content-panel-description"
      tabIndex={-1}
      initial={reduceMotion ? false : { x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ duration: reduceMotion ? 0 : 0.3, ease: 'easeInOut' }}
      className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-2xl min-w-0 flex-col overflow-hidden shadow-2xl pointer-events-auto ${
        preferences.theme === 'dark'
          ? 'bg-[#0b1015] text-slate-200'
          : preferences.theme === 'sepia'
            ? 'bg-[#f3ead7] text-[#382f25]'
            : 'bg-white text-slate-900'
      }`}
    >
      <p id="content-panel-description" className="sr-only">
        Experimental three-dimensional reading panel. Close this panel to return to the spatial map.
      </p>
      {/* Header */}
      <div className={`border-b border-gray-200 bg-gradient-to-r p-4 sm:p-6 ${theme.accent}`}>
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
            <div
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 font-bold text-white sm:h-12 sm:w-12"
            >
              {currentNode.character[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0">
              <h2
                id="content-panel-title"
                tabIndex={-1}
                className="break-words text-xl font-bold text-white sm:text-2xl"
              >
                {currentNode.title}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/80">
                <span className="font-medium">{getCharacterLabel(currentNode.character)}</span>
                <span aria-hidden="true">•</span>
                <span>{currentNode.metadata.estimatedReadTime} min read</span>
                {nodeState.visited && (
                  <>
                    <span aria-hidden="true">•</span>
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
            className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg p-2 text-white transition-colors hover:bg-white/20"
            aria-label="Close content panel"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        role="region"
        aria-label="Story passage"
        tabIndex={0}
        className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6"
      >
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

        <div
          className={`max-w-none break-words font-serif [overflow-wrap:anywhere] ${
            preferences.textSize === 'small'
              ? 'text-base leading-[1.8]'
              : preferences.textSize === 'large'
                ? 'text-xl leading-[1.9]'
                : 'text-lg leading-[1.85]'
          }`}
        >
          <MarkdownContent content={currentContent} />
        </div>

        {/* Reading time tracker */}
        <div className="mt-8 pt-4 border-t border-gray-200 text-sm text-gray-500">
          Time spent: {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}
        </div>
      </div>
    </motion.div>
  );
}
