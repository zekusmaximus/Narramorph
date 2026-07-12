/**
 * Hook for selecting and displaying state-dependent narrative variations
 */

import { useMemo } from 'react';

import { selectVariation } from '@/domain/variation/selection';
import { useStoryStore } from '@/stores/storyStore';
import type { VariationMetadata } from '@/types';
import { findMatchingVariation } from '@/utils/conditionEvaluator';
import { loadVariationFile } from '@/utils/variationLoader';

const isDevEnv = process.env.NODE_ENV !== 'production';

// Render counter to detect StrictMode double-rendering
let renderCount = 0;

const devLog = (...args: unknown[]): void => {
  if (!isDevEnv) {
    return;
  }
  console.warn('[VariationSelection]', ...args);
};
const devWarn = (...args: unknown[]): void => {
  if (!isDevEnv) {
    return;
  }
  console.warn('[VariationSelection:warn]', ...args);
};
const devError = (...args: unknown[]): void => {
  if (!isDevEnv) {
    return;
  }
  console.error('[VariationSelection:error]', ...args);
};
/**
 * Result of variation selection
 */
export interface UseVariationSelectionResult {
  /** The selected variation content */
  content: string;
  /** ID of the selected variation, or null if none selected */
  variationId: string | null;
  /** Metadata of the selected variation, or null if none selected */
  metadata: VariationMetadata | null;
  /** Whether the variation system is currently loading */
  isLoading: boolean;
  /** Error that occurred during selection, or null if no error */
  error: Error | null;
  /** Whether fallback content is being used */
  usedFallback: boolean;
}

/**
 * Hook for selecting and displaying state-dependent narrative variations.
 *
 * Algorithm:
 * 1. Get condition context from store (includes awareness, journey pattern, visit count)
 * 2. Load variation file for current node
 * 3. Call findMatchingVariation() to select appropriate variation
 * 4. Return matched variation content + metadata
 * 5. Fall back to static node content if variation system fails
 *
 * @param nodeId - Current story node ID
 * @param fallbackContent - Static content to use if variation system fails
 * @returns Variation content, metadata, and loading state
 */
export function useVariationSelection(
  nodeId: string | null,
  fallbackContent?: string,
): UseVariationSelectionResult {
  const storyData = useStoryStore((state) => state.storyData);
  const getConditionContext = useStoryStore((state) => state.getConditionContext);

  // Extract reactive values that affect variation selection
  const temporalAwareness = useStoryStore((state) => state.progress.temporalAwarenessLevel);
  const visitCount = useStoryStore((state) =>
    nodeId ? (state.progress.visitedNodes[nodeId]?.visitCount ?? 0) : 0,
  );
  const currentState = useStoryStore((state) =>
    nodeId ? (state.progress.visitedNodes[nodeId]?.currentState ?? 'initial') : 'initial',
  );
  const currentJourneyPattern = useStoryStore(
    (state) => state.progress.journeyTracking?.currentJourneyPattern ?? 'unknown',
  );
  const dominantPhilosophy = useStoryStore(
    (state) => state.progress.journeyTracking?.dominantPhilosophy ?? 'unknown',
  );

  return useMemo(() => {
    // Increment render counter for tracking
    renderCount++;
    const currentRender = renderCount;

    const context = nodeId ? getConditionContext(nodeId, { includeRecentVariations: true }) : null;
    const result = selectVariation(
      {
        storyId: storyData?.metadata?.id || 'eternal-return',
        nodeId,
        fallbackContent,
        context,
      },
      { loadVariationFile, findMatchingVariation },
    );

    if (nodeId) {
      devLog(`🎬 RENDER #${currentRender} for ${nodeId}`);
    }
    if (result.reason === 'missing-variations') {
      devWarn(`⚠️  No variation file for ${nodeId}, using fallback content`);
    } else if (result.reason === 'first-variation-fallback') {
      devWarn(`⚠️  No matching variation for ${nodeId}, using first available`);
    } else if (result.reason === 'selection-error') {
      devError(`❌ Error selecting variation for ${nodeId}: %o`, result.error);
    } else if (result.reason === 'matched') {
      devLog(`📝 CHOICE RECORDED: ${nodeId} → ${result.variationId} [render #${currentRender}]`);
    }

    return { ...result, isLoading: false };
    // State values must be in deps to trigger re-selection when they change,
    // even though they're read indirectly via getConditionContext()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    nodeId,
    storyData?.metadata?.id,
    getConditionContext,
    fallbackContent,
    temporalAwareness,
    visitCount,
    currentState,
    currentJourneyPattern,
    dominantPhilosophy,
  ]);
}
