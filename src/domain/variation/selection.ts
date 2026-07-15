import type {
  ConditionContext,
  Variation,
  VariationFile,
  VariationMetadata,
  VisitRecord,
  SelectionReason,
} from '@/types';
import type { VariationMatchResult } from '@/utils/conditionEvaluator';

import { compileVariationSelectionReason } from './selectionReason';

export type VariationSelectionReason =
  | 'matched'
  | 'no-node'
  | 'missing-variations'
  | 'first-variation-fallback'
  | 'selection-error';

export interface VariationSelectionResult {
  content: string;
  variationId: string | null;
  metadata: VariationMetadata | null;
  error: Error | null;
  usedFallback: boolean;
  reason: VariationSelectionReason;
  selectionReason: SelectionReason | null;
}

export interface VariationSelectionDependencies {
  loadVariationFile: (storyId: string, nodeId: string) => VariationFile | null;
  findMatchingVariation: (
    variations: Variation[],
    context: ConditionContext,
  ) => VariationMatchResult | null;
}

export interface VariationSelectionRequest {
  storyId: string;
  nodeId: string | null;
  fallbackContent?: string;
  context: ConditionContext | null;
}

function getVariationId(variation: Variation): string {
  return variation.variationId || variation.id || variation.metadata?.variationId || 'unknown';
}

function asError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

/**
 * Coordinates runtime variation loading, matching, and deterministic fallbacks.
 * Loader and matcher dependencies are injected so this behavior can be tested
 * without React, Zustand, or Vite's module-glob boundary.
 */
export function selectVariation(
  request: VariationSelectionRequest,
  dependencies: VariationSelectionDependencies,
): VariationSelectionResult {
  const { storyId, nodeId, fallbackContent = '', context } = request;

  if (!nodeId) {
    return {
      content: '',
      variationId: null,
      metadata: null,
      error: null,
      usedFallback: false,
      reason: 'no-node',
      selectionReason: null,
    };
  }

  try {
    if (!context) {
      throw new Error(`Condition context unavailable for node: ${nodeId}`);
    }

    const variationFile = dependencies.loadVariationFile(storyId, nodeId);
    if (!variationFile?.variations?.length) {
      if (fallbackContent) {
        return {
          content: fallbackContent,
          variationId: null,
          metadata: null,
          error: null,
          usedFallback: true,
          reason: 'missing-variations',
          selectionReason: null,
        };
      }

      throw new Error(`No variation file found for node: ${nodeId}`);
    }

    const match = dependencies.findMatchingVariation(variationFile.variations, context);
    if (!match) {
      const firstVariation = variationFile.variations[0];
      if (!firstVariation) {
        throw new Error('No variations available');
      }

      return {
        content: firstVariation.content,
        variationId: getVariationId(firstVariation),
        metadata: firstVariation.metadata,
        error: null,
        usedFallback: true,
        reason: 'first-variation-fallback',
        selectionReason: compileVariationSelectionReason(
          firstVariation,
          context,
          'deterministic-any',
        ),
      };
    }

    const matchedVariation = match.variation;

    return {
      content: matchedVariation.content,
      variationId: getVariationId(matchedVariation),
      metadata: matchedVariation.metadata,
      error: null,
      usedFallback: false,
      reason: 'matched',
      selectionReason: compileVariationSelectionReason(matchedVariation, context, match.tier),
    };
  } catch (error) {
    return {
      content: fallbackContent,
      variationId: null,
      metadata: null,
      error: asError(error),
      usedFallback: true,
      reason: 'selection-error',
      selectionReason: null,
    };
  }
}

/**
 * Records the selected variation while preserving absolute per-node history.
 * Re-recording the same selection is idempotent and the input is not mutated.
 */
export function recordVariationSelection(
  visitRecord: VisitRecord,
  variationId: string,
): VisitRecord {
  const recentVariationIds = visitRecord.recentVariationIds ?? [];
  return {
    ...visitRecord,
    variationId,
    recentVariationIds: recentVariationIds.includes(variationId)
      ? [...recentVariationIds]
      : [...recentVariationIds, variationId],
  };
}
