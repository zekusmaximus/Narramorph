/**
 * Hook for selecting and displaying state-dependent narrative variations
 */

import { useMemo } from 'react';
import { useStoryStore } from '@/stores/storyStore';
import { loadVariationFile } from '@/utils/variationLoader';
import { findMatchingVariation } from '@/utils/conditionEvaluator';
import type { VariationMetadata } from '@/types';

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
  fallbackContent?: string
): UseVariationSelectionResult {
  const storyData = useStoryStore(state => state.storyData);
  const getConditionContext = useStoryStore(state => state.getConditionContext);

  // Extract reactive values that affect variation selection
  const temporalAwareness = useStoryStore(state => state.progress.temporalAwarenessLevel);
  const visitRecord = useStoryStore(state => nodeId ? state.progress.visitedNodes[nodeId] : undefined);
  const journeyTracking = useStoryStore(state => state.progress.journeyTracking);

  return useMemo(() => {
    // Early return if no node
    if (!nodeId) {
      return {
        content: '',
        variationId: null,
        metadata: null,
        isLoading: false,
        error: null,
        usedFallback: false,
      };
    }

    try {
      // Step 1: Get current reader state
      const context = getConditionContext(nodeId);

      // Step 2: Load variation file
      const storyId = storyData?.metadata?.id || 'eternal-return';
      const variationFile = loadVariationFile(storyId, nodeId);

      if (!variationFile || !variationFile.variations || variationFile.variations.length === 0) {
        // No variations available - use fallback
        if (fallbackContent) {
          console.warn(`[VariationSelection] No variations found for ${nodeId}, using fallback`);
          return {
            content: fallbackContent,
            variationId: null,
            metadata: null,
            isLoading: false,
            error: null,
            usedFallback: true,
          };
        }

        throw new Error(`No variation file found for node: ${nodeId}`);
      }

      // Step 3: Select matching variation
      const matchedVariation = findMatchingVariation(variationFile.variations, context);

      if (!matchedVariation) {
        // No match found - use first variation as fallback
        console.warn(`[VariationSelection] No matching variation for ${nodeId}, using first available`);
        const firstVariation = variationFile.variations[0];

        return {
          content: firstVariation.content,
          variationId: firstVariation.variationId,
          metadata: firstVariation.metadata,
          isLoading: false,
          error: null,
          usedFallback: true,
        };
      }

      // Step 4: Return matched variation
      console.log(`[VariationSelection] Selected ${matchedVariation.variationId} for ${nodeId}`);
      return {
        content: matchedVariation.content,
        variationId: matchedVariation.variationId,
        metadata: matchedVariation.metadata,
        isLoading: false,
        error: null,
        usedFallback: false,
      };

    } catch (error) {
      console.error('[VariationSelection] Error selecting variation:', error);

      return {
        content: fallbackContent || '',
        variationId: null,
        metadata: null,
        isLoading: false,
        error: error as Error,
        usedFallback: true,
      };
    }
  }, [nodeId, storyData?.metadata?.id, getConditionContext, fallbackContent, temporalAwareness, visitRecord?.visitCount, visitRecord?.currentState, journeyTracking?.currentJourneyPattern, journeyTracking?.dominantPhilosophy]);
}
