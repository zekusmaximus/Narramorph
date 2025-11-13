/**
 * Condition evaluator - evaluates selection matrix conditions against user state
 */

import type {
  SelectionMatrixEntry,
  Variation,
  ConditionContext,
  AwarenessLevel,
  JourneyPattern,
  PathPhilosophy,
} from '@/types';
import { performanceMonitor } from './performanceMonitor';

const isDebugEnv = process.env.NODE_ENV !== 'production';
const debugLog = (...args: unknown[]): void => {
  if (!isDebugEnv) {
    return;
  }
  // eslint-disable-next-line no-console
  console.log(...args);
};

/**
 * Convert numeric awareness to level category
 */
export function getAwarenessLevel(awareness: number): AwarenessLevel {
  if (awareness < 35) return 'low';
  if (awareness < 70) return 'medium';
  return 'high';
}

/**
 * Check if a number is within a range (inclusive)
 */
function isInRange(value: number, range: [number, number] | undefined): boolean {
  if (!range || !Array.isArray(range) || range.length !== 2) {
    console.warn('[ConditionEvaluator] Invalid range provided:', range);
    return false;
  }
  return value >= range[0] && value <= range[1];
}

/**
 * Evaluate if a selection matrix entry's conditions match the current context
 */
export function evaluateConditions(
  entry: SelectionMatrixEntry,
  context: ConditionContext
): boolean {
  const { conditions } = entry;

  // Check awareness level
  if (conditions.awarenessLevel) {
    const currentLevel = getAwarenessLevel(context.awareness);
    if (currentLevel !== conditions.awarenessLevel.toLowerCase() as AwarenessLevel) {
      return false;
    }
  }

  // Check visit count range
  if (conditions.visitCount) {
    if (!isInRange(context.visitCount, conditions.visitCount)) {
      return false;
    }
  }

  // Check journey pattern
  if (conditions.journeyPattern) {
    if (context.journeyPattern !== conditions.journeyPattern) {
      return false;
    }
  }

  // Check path philosophy
  if (conditions.pathPhilosophy) {
    if (context.pathPhilosophy !== conditions.pathPhilosophy) {
      return false;
    }
  }

  return true;
}

/**
 * Find matching variations based on condition context
 */
export function findMatchingVariation(
  variations: Variation[],
  context: ConditionContext
): Variation | null {
  const endTimer = performanceMonitor.startTimer('variationSelection');

  debugLog('[VariationSelection] Finding match for:', {
    nodeId: context.nodeId,
    awareness: context.awareness,
    awarenessLevel: getAwarenessLevel(context.awareness),
    journeyPattern: context.journeyPattern,
    pathPhilosophy: context.pathPhilosophy,
    visitCount: context.visitCount,
    transformationState: context.transformationState,
  });

  debugLog(`[VariationSelection] Evaluating ${variations.length} variations`);

  // Filter variations that match the context
  const matches = variations.filter(variation => {
    const meta = variation.metadata;

    // Skip variations with invalid metadata
    if (!meta) {
      console.warn('[VariationSelection] Variation missing metadata:', variation.variationId || variation.id);
      return false;
    }

    debugLog('[VariationSelection] Checking variation:', {
      variationId: variation.variationId || meta.variationId,
      transformationState: variation.transformationState,
      awarenessRange: meta.awarenessRange,
      requiredJourney: meta.journeyPattern,
      requiredPhilosophy: meta.philosophyDominant,
    });

    // CRITICAL: Check transformation state FIRST
    if (variation.transformationState !== context.transformationState) {
      debugLog('[VariationSelection] ✗ Transformation state mismatch');
      return false;
    }

    // Check awareness range
    if (!isInRange(context.awareness, meta.awarenessRange)) {
      debugLog('[VariationSelection] ✗ Awareness mismatch');
      return false;
    }

    // Check journey pattern
    if (meta.journeyPattern !== 'unknown' && meta.journeyPattern !== context.journeyPattern) {
      debugLog('[VariationSelection] ✗ Journey pattern mismatch');
      return false;
    }

    // Check philosophy
    if (meta.philosophyDominant !== 'unknown' && meta.philosophyDominant !== context.pathPhilosophy) {
      debugLog('[VariationSelection] ✗ Philosophy mismatch');
      return false;
    }

    debugLog('[VariationSelection] ✓ Match found');
    return true;
  });

  debugLog(`[VariationSelection] Found ${matches.length} matching variations`);

  if (matches.length === 0) {
    console.warn('[VariationSelection] No matches found, returning null');
    endTimer({
      nodeId: context.nodeId,
      variationCount: variations.length,
      matchFound: false,
    });
    return null;
  }

  // If multiple matches, prefer exact matches over broader ones
  // Priority: exact journey + exact philosophy > exact journey > exact philosophy > any
  const exactMatches = matches.filter(v =>
    v.metadata.journeyPattern === context.journeyPattern &&
    v.metadata.philosophyDominant === context.pathPhilosophy
  );

  if (exactMatches.length > 0) {
    const selected = exactMatches[0];
    debugLog(`[VariationSelection] Selected exact match: ${selected.variationId}`);
    endTimer({
      nodeId: context.nodeId,
      variationCount: variations.length,
      matchFound: true,
      variationId: selected.variationId,
    });
    return selected;
  }

  const journeyMatches = matches.filter(v =>
    v.metadata.journeyPattern === context.journeyPattern
  );

  if (journeyMatches.length > 0) {
    const selected = journeyMatches[0];
    debugLog(`[VariationSelection] Selected journey match: ${selected.variationId}`);
    endTimer({
      nodeId: context.nodeId,
      variationCount: variations.length,
      matchFound: true,
      variationId: selected.variationId,
    });
    return selected;
  }

  const philosophyMatches = matches.filter(v =>
    v.metadata.philosophyDominant === context.pathPhilosophy
  );

  if (philosophyMatches.length > 0) {
    const selected = philosophyMatches[0];
    debugLog(`[VariationSelection] Selected philosophy match: ${selected.variationId}`);
    endTimer({
      nodeId: context.nodeId,
      variationCount: variations.length,
      matchFound: true,
      variationId: selected.variationId,
    });
    return selected;
  }

  const selected = matches[0];
  debugLog(`[VariationSelection] Selected first match: ${selected.variationId}`);
  endTimer({
    nodeId: context.nodeId,
    variationCount: variations.length,
    matchFound: true,
    variationId: selected.variationId,
  });
  return selected;
}

/**
 * Find all selection matrix entries for a given node
 */
export function findMatrixEntriesForNode(
  matrix: SelectionMatrixEntry[],
  nodeId: string
): SelectionMatrixEntry[] {
  return matrix.filter(entry => entry.fromNode === nodeId);
}

/**
 * Select the best target node from matrix based on context
 */
export function selectTargetNode(
  matrix: SelectionMatrixEntry[],
  fromNode: string,
  context: ConditionContext
): SelectionMatrixEntry | null {
  const candidates = findMatrixEntriesForNode(matrix, fromNode);

  if (candidates.length === 0) {
    return null;
  }

  // Filter by matching conditions
  const matches = candidates.filter(entry => evaluateConditions(entry, context));

  if (matches.length === 0) {
    // No exact match, return first candidate as fallback
    return candidates[0];
  }

  // Return first matching entry
  return matches[0];
}

/**
 * Calculate journey pattern based on character visit percentages
 */
export function calculateJourneyPattern(
  startingCharacter: 'archaeologist' | 'algorithm' | 'lastHuman' | undefined,
  percentages: { archaeologist: number; algorithm: number; lastHuman: number }
): JourneyPattern {
  if (!startingCharacter) {
    return 'unknown';
  }

  const startingPercentage = percentages[startingCharacter];
  const maxPercentage = Math.max(
    percentages.archaeologist,
    percentages.algorithm,
    percentages.lastHuman
  );

  // Find which character is currently dominant
  let dominantCharacter: 'archaeologist' | 'algorithm' | 'lastHuman' = 'archaeologist';
  if (percentages.algorithm === maxPercentage) {
    dominantCharacter = 'algorithm';
  } else if (percentages.lastHuman === maxPercentage) {
    dominantCharacter = 'lastHuman';
  }

  // Started-stayed: Started with one, stayed dominant (>60%)
  if (dominantCharacter === startingCharacter && startingPercentage > 60) {
    return 'started-stayed';
  }

  // Shifted-dominant: Started with one, shifted to another as dominant
  if (dominantCharacter !== startingCharacter && maxPercentage > 50) {
    return 'shifted-dominant';
  }

  // Started-bounced: Started with one, explored others significantly
  if (startingPercentage < 60 && startingPercentage > 40) {
    return 'started-bounced';
  }

  // Began-lightly: Started with light exploration before committing
  if (startingPercentage < 40 && maxPercentage > 50) {
    return 'began-lightly';
  }

  // Met-later: Encountered character later in journey
  // This is harder to detect automatically, may need explicit tracking
  // For now, use as fallback for unusual patterns
  return 'met-later';
}

/**
 * Calculate dominant path philosophy from L2 choice counts
 */
export function calculatePathPhilosophy(choices: {
  accept: number;
  resist: number;
  invest: number;
}): PathPhilosophy {
  const total = choices.accept + choices.resist + choices.invest;

  if (total === 0) {
    return 'unknown';
  }

  const acceptPercent = (choices.accept / total) * 100;
  const resistPercent = (choices.resist / total) * 100;
  const investPercent = (choices.invest / total) * 100;

  // Dominant if >50%
  if (acceptPercent > 50) return 'accept';
  if (resistPercent > 50) return 'resist';
  if (investPercent > 50) return 'invest';

  // If no clear dominant (all within 20% of each other)
  const max = Math.max(acceptPercent, resistPercent, investPercent);
  const min = Math.min(acceptPercent, resistPercent, investPercent);

  if (max - min < 20) {
    return 'mixed';
  }

  // Return the highest
  if (acceptPercent === max) return 'accept';
  if (resistPercent === max) return 'resist';
  return 'invest';
}
