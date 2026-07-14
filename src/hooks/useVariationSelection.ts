/**
 * Hook for selecting and displaying state-dependent narrative variations
 */

import { useCallback, useEffect, useState } from 'react';

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
  /** Retry the exact passage import after an error */
  retry: () => void;
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

  const [requestVersion, setRequestVersion] = useState(0);
  const retry = useCallback(() => setRequestVersion((version) => version + 1), []);
  const [result, setResult] = useState<Omit<UseVariationSelectionResult, 'retry'>>({
    content: '',
    variationId: null,
    metadata: null,
    isLoading: false,
    error: null,
    usedFallback: false,
  });

  useEffect(() => {
    let active = true;
    renderCount++;
    const currentRender = renderCount;

    if (!nodeId) {
      setResult({
        content: '',
        variationId: null,
        metadata: null,
        isLoading: false,
        error: null,
        usedFallback: false,
      });
      return () => {
        active = false;
      };
    }

    const storyId = storyData?.metadata?.id || 'eternal-return';
    const context = getConditionContext(nodeId, { includeRecentVariations: true });
    setResult((previous) => ({ ...previous, isLoading: true, error: null }));
    devLog(`🎬 ASYNC LOAD #${currentRender} for ${nodeId}`);

    void loadVariationFile(storyId, nodeId)
      .then((variationFile) => {
        const selection = selectVariation(
          { storyId, nodeId, fallbackContent, context },
          { loadVariationFile: () => variationFile, findMatchingVariation },
        );
        if (!active) {
          return;
        }

        if (selection.reason === 'missing-variations') {
          devWarn(`⚠️  No variation file for ${nodeId}, using fallback content`);
        } else if (selection.reason === 'first-variation-fallback') {
          devWarn(`⚠️  No matching variation for ${nodeId}, using first available`);
        } else if (selection.reason === 'selection-error') {
          devError(`❌ Error selecting variation for ${nodeId}: %o`, selection.error);
        } else if (selection.reason === 'matched') {
          devLog(
            `📝 CHOICE RECORDED: ${nodeId} → ${selection.variationId} [load #${currentRender}]`,
          );
        }
        setResult({ ...selection, isLoading: false });
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }
        const normalizedError = error instanceof Error ? error : new Error(String(error));
        devError(`❌ Error loading variation for ${nodeId}: %o`, normalizedError);
        setResult({
          content: fallbackContent ?? '',
          variationId: null,
          metadata: null,
          isLoading: false,
          error: normalizedError,
          usedFallback: true,
        });
      });

    return () => {
      active = false;
    };
    // State values trigger re-selection even though they are read through
    // getConditionContext inside the effect.
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
    requestVersion,
  ]);

  return { ...result, retry };
}
