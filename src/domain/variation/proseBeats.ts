import type { ConditionContext, ProseBeat, ProseBeatAlternative, Variation } from '@/types';

import { evaluateJourneyCondition } from './conditions';

/** Paragraph break inserted between resolved beats unless the variation overrides it. */
export const DEFAULT_BEAT_JOINER = '\n\n';

export interface ResolvedProse {
  /** The continuous passage text after beats are composed. */
  content: string;
  /** Ordered IDs of the selected beat alternatives, for the visit-event log. */
  selectedBeatIds: string[];
}

/**
 * Deterministically chooses one alternative for a beat.
 *
 * - An alternative qualifies when it has no condition, or its journey condition matches.
 * - Among qualifying alternatives the highest `priority` wins; ties keep the earliest author order.
 * - When none qualifies, the beat is omitted if `omitWhenUnmatched` is set, otherwise the first
 *   authored alternative is the deterministic fallback.
 */
function chooseAlternative(
  beat: ProseBeat,
  context: ConditionContext,
): ProseBeatAlternative | null {
  const qualifying = beat.alternatives.filter(
    (alternative) =>
      alternative.condition === undefined ||
      evaluateJourneyCondition(alternative.condition, context).matched,
  );

  if (qualifying.length === 0) {
    if (beat.omitWhenUnmatched) {
      return null;
    }
    return beat.alternatives[0] ?? null;
  }

  // Reduce keeps the earliest element on a priority tie because the comparison is strict.
  return qualifying.reduce((best, alternative) =>
    (alternative.priority ?? 0) > (best.priority ?? 0) ? alternative : best,
  );
}

/**
 * Resolves a variation's optional compositional prose beats into one continuous passage.
 *
 * A variation without beats returns its `content` byte-for-byte unchanged, so selection remains
 * invariant for every passage that has not opted into beats. Beats are composed in ascending
 * ordinal order (stable on equal ordinals) and joined by the variation's `beatJoiner`.
 *
 * The function is pure: identical `(variation, context)` inputs always produce identical output,
 * so a resolved passage is reproducible and never influences which variation was selected.
 */
export function resolveProseBeats(variation: Variation, context: ConditionContext): ResolvedProse {
  const beats = variation.proseBeats;
  if (!beats || beats.length === 0) {
    return { content: variation.content, selectedBeatIds: [] };
  }

  const ordered = [...beats].sort((left, right) => left.ordinal - right.ordinal);
  const parts: string[] = [];
  const selectedBeatIds: string[] = [];

  for (const beat of ordered) {
    const chosen = chooseAlternative(beat, context);
    if (!chosen) {
      continue;
    }
    parts.push(chosen.content);
    selectedBeatIds.push(chosen.id);
  }

  const joiner = variation.beatJoiner ?? DEFAULT_BEAT_JOINER;
  return { content: parts.join(joiner), selectedBeatIds };
}
