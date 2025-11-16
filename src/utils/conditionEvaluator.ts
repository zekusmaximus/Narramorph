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
 * Pick a non-repeating variation from candidates using ABSOLUTE de-duplication
 *
 * Algorithm:
 * 1. If no history → return first candidate
 * 2. Filter candidates to exclude ALL previously shown variations
 * 3. If any never-shown variations exist → return first
 * 4. Else (all variations have been shown) → return null to indicate exhaustion
 *
 * @param candidates - Array of variations to choose from
 * @param shownIds - ALL variation IDs ever shown for this node
 * @returns Selected variation, or null if all have been shown
 */
export function pickNonRepeatingVariation<T extends { variationId?: string; id?: string }>(
  candidates: T[],
  shownIds?: string[],
): T | null {
  if (candidates.length === 0) {
    return null;
  }

  // If no history, return first candidate
  if (!shownIds || shownIds.length === 0) {
    const selected = candidates[0];
    if (!selected) {
      return null;
    }
    debugLog(
      `[Dedupe] 🆕 First selection from pool of ${candidates.length}: ${selected.variationId || selected.id}`,
    );
    return selected;
  }

  const candidateIds = candidates.map((c) => c.variationId || c.id);

  // Filter out candidates that have EVER been shown
  const neverShown = candidates.filter((candidate) => {
    const candidateId = candidate.variationId || candidate.id;
    return !shownIds.includes(candidateId || '');
  });

  // If we have variations that have never been shown, return the first one
  if (neverShown.length > 0) {
    const selected = neverShown[0];
    if (!selected) {
      return null;
    }
    const excludedCount = candidates.length - neverShown.length;
    debugLog(
      `[Dedupe] ✓ Selected fresh variation: ${selected.variationId || selected.id} (excluded ${excludedCount}/${candidates.length} shown)`,
    );
    return selected;
  }

  // All candidates have been shown - return null to indicate pool exhaustion
  debugLog(
    `[Dedupe] ⚠️  Pool exhausted: All ${candidates.length} candidates already shown [${candidateIds.join(', ')}]`,
  );
  return null;
}

/**
 * Convert numeric awareness to level category
 */
export function getAwarenessLevel(awareness: number): AwarenessLevel {
  if (awareness < 35) {
    return 'low';
  }
  if (awareness < 70) {
    return 'medium';
  }
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
  const [min, max] = range;
  if (min === undefined || max === undefined) {
    console.warn('[ConditionEvaluator] Range values are undefined:', range);
    return false;
  }
  return value >= min && value <= max;
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

  // Summary log: context and what we're looking for
  debugLog(
    `[VariationSelection] 🔍 ${context.nodeId}: state=${context.transformationState}, awareness=${context.awareness}/${getAwarenessLevel(context.awareness)}, journey=${context.journeyPattern}, philosophy=${context.pathPhilosophy}`,
  );

  // Track matching stats for summary
  let stateMatches = 0;
  let awarenessMatches = 0;
  let journeyMatchCount = 0;
  let philosophyMatchCount = 0;

  // Filter variations that match the context
  const matches = variations.filter((variation, index) => {
    const meta = variation.metadata;

    // Skip variations with invalid metadata
    if (!meta) {
      console.warn(
        '[VariationSelection] Variation missing metadata:',
        variation.variationId || variation.id,
      );
      return false;
    }

    // CRITICAL: Check transformation state FIRST
    if (variation.transformationState !== context.transformationState) {
      return false;
    }
    stateMatches++;

    // Check awareness range
    if (!isInRange(context.awareness, meta.awarenessRange)) {
      return false;
    }
    awarenessMatches++;

    // Check journey pattern
    if (meta.journeyPattern !== 'unknown' && meta.journeyPattern !== context.journeyPattern) {
      return false;
    }
    journeyMatchCount++;

    // Check philosophy
    if (
      meta.philosophyDominant !== 'unknown' &&
      meta.philosophyDominant !== context.pathPhilosophy
    ) {
      return false;
    }
    philosophyMatchCount++;

    // Log only the match (not every rejection)
    debugLog(
      `[VariationSelection] ✓ Match #${philosophyMatchCount}: ${variation.variationId || meta.variationId} (position ${index + 1}/${variations.length})`,
    );
    return true;
  });

  // Summary of matching process
  debugLog(
    `[VariationSelection] 📊 Summary: checked ${variations.length} → state:${stateMatches} → awareness:${awarenessMatches} → journey:${journeyMatchCount} → philosophy:${philosophyMatchCount} MATCHES`,
  );

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

  // Show deduplication context if there are recent IDs
  if (recentIds && recentIds.length > 0) {
    debugLog(
      `[VariationSelection] 🔄 Deduplication active: ${recentIds.length} variations already shown [${recentIds.join(', ')}]`,
    );
  }

  const exactMatches = matches.filter(
    (v) =>
      v.metadata.journeyPattern === context.journeyPattern &&
      v.metadata.philosophyDominant === context.pathPhilosophy,
  );

  if (exactMatches.length > 0) {
    const selected = pickNonRepeatingVariation(exactMatches, recentIds);
    if (selected) {
      debugLog(
        `[VariationSelection] ✅ SELECTED: ${selected.variationId} (exact match: journey+philosophy)`,
      );
      endTimer({
        nodeId: context.nodeId,
        variationCount: variations.length,
        matchFound: true,
        variationId: selected.variationId,
      });
      return selected;
    }
    debugLog('[VariationSelection] ⚠️  Exact matches all shown, trying journey matches...');
  }

  const journeyMatches = matches.filter(
    (v) => v.metadata.journeyPattern === context.journeyPattern,
  );

  if (journeyMatches.length > 0) {
    const selected = pickNonRepeatingVariation(journeyMatches, recentIds);
    if (selected) {
      debugLog(`[VariationSelection] ✅ SELECTED: ${selected.variationId} (journey match)`);
      endTimer({
        nodeId: context.nodeId,
        variationCount: variations.length,
        matchFound: true,
        variationId: selected.variationId,
      });
      return selected;
    }
    debugLog('[VariationSelection] ⚠️  Journey matches all shown, trying philosophy matches...');
  }

  const philosophyMatches = matches.filter(
    (v) => v.metadata.philosophyDominant === context.pathPhilosophy,
  );

  if (philosophyMatches.length > 0) {
    const selected = pickNonRepeatingVariation(philosophyMatches, recentIds);
    if (selected) {
      debugLog(`[VariationSelection] ✅ SELECTED: ${selected.variationId} (philosophy match)`);
      endTimer({
        nodeId: context.nodeId,
        variationCount: variations.length,
        matchFound: true,
        variationId: selected.variationId,
      });
      return selected;
    }
    debugLog('[VariationSelection] ⚠️  Philosophy matches all shown, trying any match...');
  }

  // Fallback: apply de-duplication to all matches
  const selected = pickNonRepeatingVariation(matches, recentIds);
  if (selected) {
    debugLog(`[VariationSelection] ✅ SELECTED: ${selected.variationId} (any match)`);
    endTimer({
      nodeId: context.nodeId,
      variationCount: variations.length,
      matchFound: true,
      variationId: selected.variationId,
    });
    return selected;
  }

  // All variations for this transformation state have been shown - repeat first match
  // This happens when the reader has exhausted all unique variations for this state
  const fallback = matches[0];
  if (!fallback) {
    // Should not happen as we checked matches.length > 0, but guard anyway
    return null;
  }
  debugLog(
    `[VariationSelection] 🔁 POOL EXHAUSTED: All ${matches.length} variations for state '${context.transformationState}' shown. Repeating: ${fallback.variationId}`,
  );
  endTimer({
    nodeId: context.nodeId,
    variationCount: variations.length,
    matchFound: true,
    variationId: fallback.variationId,
    exhausted: true,
  });
  return fallback;
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
    const fallback = candidates[0];
    return fallback ?? null;
  }

  // Return first matching entry
  const match = matches[0];
  return match ?? null;
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
  if (acceptPercent > 50) {
    return 'accept';
  }
  if (resistPercent > 50) {
    return 'resist';
  }
  if (investPercent > 50) {
    return 'invest';
  }

  // If no clear dominant (all within 20% of each other)
  const max = Math.max(acceptPercent, resistPercent, investPercent);
  const min = Math.min(acceptPercent, resistPercent, investPercent);

  if (max - min < 20) {
    return 'mixed';
  }

  // Return the highest
  if (acceptPercent === max) {
    return 'accept';
  }
  if (resistPercent === max) {
    return 'resist';
  }
  return 'invest';
}
