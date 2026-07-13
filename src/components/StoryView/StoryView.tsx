import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, type ReactElement } from 'react';

import { useMapInteractionAdapter } from '@/components/map/useMapInteractionAdapter';
import { useDialogFocus } from '@/hooks/useDialogFocus';
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';
import { useVariationSelection } from '@/hooks/useVariationSelection';
import { useStoryStore } from '@/stores';

import { StoryContent } from './StoryContent';
import { StoryFooter } from './StoryFooter';
import { StoryHeader } from './StoryHeader';
import {
  formatEstimatedReadingTime,
  getAvailableContinuationNodes,
  storyCharacterThemes,
} from './storyPresentation';
import { VariationDebugPanel } from './VariationDebugPanel';

interface StoryViewProps {
  className?: string;
}

export default function StoryView({ className = '' }: StoryViewProps): ReactElement | null {
  const adapter = useMapInteractionAdapter('2d');
  const nodes = useStoryStore((state) => state.nodes);
  const preferences = useStoryStore((state) => state.preferences);
  const reduceMotion = useReducedMotionPreference();
  const getNodeState = useStoryStore((state) => state.getNodeState);
  const canVisitNode = useStoryStore((state) => state.canVisitNode);
  const openStoryView = useStoryStore((state) => state.openStoryView);
  const updateActiveVisitVariation = useStoryStore((state) => state.updateActiveVisitVariation);
  const finalizeActiveVisit = useStoryStore((state) => state.finalizeActiveVisit);
  const selectedNode = adapter.selectedNodeId;
  const closeStoryView = adapter.panel.close;
  const dialogRef = useDialogFocus(adapter.panel.open, closeStoryView, {
    focusKey: selectedNode,
    initialFocusSelector: '#story-view-title',
    restoreFocus: () =>
      (selectedNode
        ? document.querySelector<HTMLElement>(`.react-flow__node[data-id="${selectedNode}"]`)
        : null) ??
      document.querySelector<HTMLElement>('[role="region"][aria-label="Archive passage map"]'),
  });
  const handleContinue = useCallback(
    (nodeId: string): void => {
      // The 2D store keeps its animation gate raised while the reader is open.
      // Closing first also finalizes the current timed visit before the next begins.
      closeStoryView();
      openStoryView(nodeId);
    },
    [closeStoryView, openStoryView],
  );

  const currentNode = useMemo(
    () => (selectedNode ? (nodes.get(selectedNode) ?? null) : null),
    [nodes, selectedNode],
  );
  const nodeState = selectedNode ? getNodeState(selectedNode) : null;
  const fallbackContent =
    currentNode && nodeState ? currentNode.content[nodeState.currentState] : '';
  const {
    content: currentContent,
    variationId,
    metadata: variationMetadata,
    usedFallback,
    error: variationError,
  } = useVariationSelection(currentNode?.id ?? null, fallbackContent);

  useEffect(() => {
    if (adapter.panel.open && selectedNode && variationId && !usedFallback) {
      updateActiveVisitVariation(variationId);
    }
  }, [adapter.panel.open, selectedNode, updateActiveVisitVariation, usedFallback, variationId]);

  useEffect(
    () => () => {
      finalizeActiveVisit();
    },
    [finalizeActiveVisit],
  );

  if (!adapter.panel.open || !currentNode || !nodeState) {
    return null;
  }

  const theme = storyCharacterThemes[currentNode.character];
  const continuationNodes = getAvailableContinuationNodes(currentNode, nodes, canVisitNode);
  const estimatedReadingTime = formatEstimatedReadingTime(currentContent);
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="story-modal"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={reduceMotion ? undefined : { opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-0 backdrop-blur-sm sm:p-4"
        onClick={closeStoryView}
      >
        <motion.div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="story-view-title"
          data-variation-id={variationId ?? undefined}
          tabIndex={-1}
          initial={reduceMotion ? false : { y: 12, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={reduceMotion ? undefined : { y: 8, opacity: 0 }}
          transition={
            reduceMotion ? { duration: 0 } : { type: 'spring', damping: 25, stiffness: 300 }
          }
          className={`relative flex h-[100dvh] max-h-[100dvh] w-full max-w-4xl flex-col overflow-hidden sm:h-auto sm:max-h-[92vh]
            ${preferences.theme === 'dark' ? 'bg-gray-900' : ''}
            ${preferences.theme === 'light' ? 'bg-white' : ''}
            ${preferences.theme === 'sepia' ? 'bg-amber-50' : ''}
            rounded-none border-white/10 shadow-2xl sm:rounded-xl sm:border ${className}`}
          onClick={(event) => event.stopPropagation()}
        >
          <StoryHeader
            node={currentNode}
            nodeState={nodeState}
            theme={theme}
            estimatedReadingTime={estimatedReadingTime}
            usedFallback={usedFallback && currentNode.layer <= 2}
            variationError={variationError}
            onClose={closeStoryView}
          />
          <StoryContent
            key={`${currentNode.id}-${variationId ?? nodeState.currentState}`}
            content={currentContent}
            transformationState={nodeState.currentState}
            textSize={preferences.textSize}
            theme={preferences.theme}
          />
          <StoryFooter
            theme={preferences.theme}
            continuationNodes={continuationNodes}
            onContinue={handleContinue}
            onClose={closeStoryView}
          />
        </motion.div>
      </motion.div>

      {process.env.NODE_ENV === 'development' && (
        <VariationDebugPanel
          key="variation-debug-panel"
          nodeId={currentNode.id}
          variationId={variationId}
          variationMetadata={variationMetadata}
          usedFallback={usedFallback}
        />
      )}
    </AnimatePresence>
  );
}
