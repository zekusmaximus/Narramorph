import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, type ReactElement } from 'react';

import { useMapInteractionAdapter } from '@/components/map/useMapInteractionAdapter';
import { useDialogFocus } from '@/hooks/useDialogFocus';
import { useReadingTimer } from '@/hooks/useReadingTimer';
import { useVariationSelection } from '@/hooks/useVariationSelection';
import { useStoryStore } from '@/stores';

import { StoryContent } from './StoryContent';
import { StoryFooter } from './StoryFooter';
import { StoryHeader } from './StoryHeader';
import { storyCharacterThemes } from './storyPresentation';
import { VariationDebugPanel } from './VariationDebugPanel';

interface StoryViewProps {
  className?: string;
}

export default function StoryView({ className = '' }: StoryViewProps): ReactElement | null {
  const adapter = useMapInteractionAdapter('2d');
  const nodes = useStoryStore((state) => state.nodes);
  const preferences = useStoryStore((state) => state.preferences);
  const getNodeState = useStoryStore((state) => state.getNodeState);
  const updateActiveVisitVariation = useStoryStore((state) => state.updateActiveVisitVariation);
  const finalizeActiveVisit = useStoryStore((state) => state.finalizeActiveVisit);
  const selectedNode = adapter.selectedNodeId;
  const closeStoryView = adapter.panel.close;
  const dialogRef = useDialogFocus(adapter.panel.open, closeStoryView);
  const timeSpentOnNode = useReadingTimer(adapter.panel.open, selectedNode);

  const currentNode = useMemo(
    () => (selectedNode ? (nodes.get(selectedNode) ?? null) : null),
    [nodes, selectedNode],
  );
  const nodeState = useMemo(
    () => (selectedNode ? getNodeState(selectedNode) : null),
    [getNodeState, selectedNode],
  );
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
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="story-view-title"
          tabIndex={-1}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`relative max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col
            ${preferences.theme === 'dark' ? 'bg-gray-900' : ''}
            ${preferences.theme === 'light' ? 'bg-white' : ''}
            ${preferences.theme === 'sepia' ? 'bg-amber-50' : ''}
            rounded-xl shadow-2xl ${className}`}
          onClick={(event) => event.stopPropagation()}
        >
          <StoryHeader
            node={currentNode}
            nodeState={nodeState}
            theme={theme}
            timeSpent={timeSpentOnNode}
            variationId={variationId}
            variationMetadata={variationMetadata}
            usedFallback={usedFallback}
            variationError={variationError}
            onClose={closeStoryView}
          />
          <StoryContent
            content={currentContent}
            transformationState={nodeState.currentState}
            textSize={preferences.textSize}
            theme={preferences.theme}
          />
          <StoryFooter
            node={currentNode}
            theme={preferences.theme}
            timeSpent={timeSpentOnNode}
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
