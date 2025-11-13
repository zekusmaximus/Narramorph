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
 * Pick a non-repeating variation from candidates using sliding window de-duplication
 *
 * Algorithm:
 * 1. If no recent history → return first candidate
 * 2. Get last N (windowSize) variationIds from recent history
 * 3. Filter candidates to exclude those in window
 * 4. If any unused → return first unused
 * 5. Else (all recently used) → return LRU (earliest in window)
 * 6. Fallback → first candidate
 *
 * @param candidates - Array of variations to choose from
 * @param recentIds - Recent variation IDs (sliding window)
 * @param windowSize - Size of deduplication window (default: 3)
 * @returns Selected variation
 */
export function pickNonRepeatingVariation<T extends { variationId?: string; id?: string }>(
  candidates: T[],
  recentIds?: string[],
  windowSize: number = 3,
): T | null {
  if (candidates.length === 0) {
    return null;
  }

  // If no recent history, return first candidate
  if (!recentIds || recentIds.length === 0) {
    return candidates[0];
  }

  // Get last N variation IDs from window
  const recentWindow = recentIds.slice(-windowSize);

  debugLog('[Dedupe] Recent window:', recentWindow);
  debugLog('[Dedupe] Candidates:', candidates.map((c) => c.variationId || c.id));

  // Filter out candidates that were recently used
  const unused = candidates.filter((candidate) => {
    const candidateId = candidate.variationId || candidate.id;
    return !recentWindow.includes(candidateId || '');
  });

  debugLog('[Dedupe] Unused candidates:', unused.length);

  // If we have unused candidates, return the first one
  if (unused.length > 0) {
    return unused[0];
  }

  // All candidates were recently used - use LRU (Least Recently Used)
  // Find the candidate that appears earliest in the recent window
  let lruCandidate = candidates[0];
  let earliestIndex = recentWindow.length;

  for (const candidate of candidates) {
    const candidateId = candidate.variationId || candidate.id;
    const index = recentWindow.indexOf(candidateId || '');

    if (index !== -1 && index < earliestIndex) {
      earliestIndex = index;
      lruCandidate = candidate;
    }
  }

  debugLog('[Dedupe] All candidates recently used, selecting LRU:', lruCandidate.variationId || lruCandidate.id);

  return lruCandidate;
}

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
  context: ConditionContext,
): boolean {
  const { conditions } = entry;

  // Check awareness level
  if (conditions.awarenessLevel) {
    const currentLevel = getAwarenessLevel(context.awareness);
    if (currentLevel !== (conditions.awarenessLevel.toLowerCase() as AwarenessLevel)) {
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
  context: ConditionContext,
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
  const matches = variations.filter((variation) => {
    const meta = variation.metadata;

    // Skip variations with invalid metadata
    if (!meta) {
      console.warn(
        '[VariationSelection] Variation missing metadata:',
        variation.variationId || variation.id,
      );
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
    if (
      meta.philosophyDominant !== 'unknown' &&
      meta.philosophyDominant !== context.pathPhilosophy
    ) {
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
  // Apply de-duplication at each tier using sliding window
  const recentIds = context.recentVariationIds;

  const exactMatches = matches.filter(
    (v) =>
      v.metadata.journeyPattern === context.journeyPattern &&
      v.metadata.philosophyDominant === context.pathPhilosophy,
  );

  if (exactMatches.length > 0) {
    const selected = pickNonRepeatingVariation(exactMatches, recentIds);
    if (selected) {
      debugLog(`[VariationSelection] Selected exact match with dedupe: ${selected.variationId}`);
      endTimer({
        nodeId: context.nodeId,
        variationCount: variations.length,
        matchFound: true,
        variationId: selected.variationId,
      });
      return selected;
    }
  }

  const journeyMatches = matches.filter(
    (v) => v.metadata.journeyPattern === context.journeyPattern,
  );

  if (journeyMatches.length > 0) {
    const selected = pickNonRepeatingVariation(journeyMatches, recentIds);
    if (selected) {
      debugLog(`[VariationSelection] Selected journey match with dedupe: ${selected.variationId}`);
      endTimer({
        nodeId: context.nodeId,
        variationCount: variations.length,
        matchFound: true,
        variationId: selected.variationId,
      });
      return selected;
    }
  }

  const philosophyMatches = matches.filter(
    (v) => v.metadata.philosophyDominant === context.pathPhilosophy,
  );

  if (philosophyMatches.length > 0) {
    const selected = pickNonRepeatingVariation(philosophyMatches, recentIds);
    if (selected) {
      debugLog(`[VariationSelection] Selected philosophy match with dedupe: ${selected.variationId}`);
      endTimer({
        nodeId: context.nodeId,
        variationCount: variations.length,
        matchFound: true,
        variationId: selected.variationId,
      });
      return selected;
    }
  }

  // Fallback: apply de-duplication to all matches
  const selected = pickNonRepeatingVariation(matches, recentIds);
  if (selected) {
    debugLog(`[VariationSelection] Selected any match with dedupe: ${selected.variationId}`);
    endTimer({
      nodeId: context.nodeId,
      variationCount: variations.length,
      matchFound: true,
      variationId: selected.variationId,
    });
    return selected;
  }

  // Should never reach here, but return first match as ultimate fallback
  return matches[0];
}

/**
 * Find all selection matrix entries for a given node
 */
export function findMatrixEntriesForNode(
  matrix: SelectionMatrixEntry[],
  nodeId: string,
): SelectionMatrixEntry[] {
  return matrix.filter((entry) => entry.fromNode === nodeId);
}

/**
 * Select the best target node from matrix based on context
 */
export function selectTargetNode(
  matrix: SelectionMatrixEntry[],
  fromNode: string,
  context: ConditionContext,
): SelectionMatrixEntry | null {
  const candidates = findMatrixEntriesForNode(matrix, fromNode);

  if (candidates.length === 0) {
    return null;
  }

  // Filter by matching conditions
  const matches = candidates.filter((entry) => evaluateConditions(entry, context));

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
  startingCharacter: 'archaeologist' | 'algorithm' | 'lastHuman' | null,
  percentages: { archaeologist: number; algorithm: number; lastHuman: number },
): JourneyPattern {
  if (startingCharacter === null) {
    return 'unknown';
  }

  const startingPercentage = percentages[startingCharacter];
  const maxPercentage = Math.max(
    percentages.archaeologist,
    percentages.algorithm,
    percentages.lastHuman,
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
