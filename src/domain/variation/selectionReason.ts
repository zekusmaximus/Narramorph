import type {
  AwarenessLevel,
  ConditionContext,
  L3Assembly,
  JourneyCharacter,
  JourneyPattern,
  PathPhilosophy,
  SelectionOutcome,
  SelectionReason,
  SelectionReasonTemplateKey,
  SelectionTrigger,
  Variation,
  VariationMatchTier,
} from '@/types';
import { SELECTION_REASON_CONTRACT, SELECTION_REASON_SCHEMA_VERSION } from '@/types';

const perspectiveLabels: Record<JourneyCharacter, string> = {
  archaeologist: 'the Archaeologist',
  algorithm: 'the Algorithm',
  lastHuman: 'the Last Human',
};

const journeyLabels: Record<JourneyPattern, string> = {
  'started-stayed': 'the perspective you began with remaining central',
  'started-bounced': 'your movement between perspectives',
  'shifted-dominant': 'another perspective becoming central',
  'began-lightly': 'early exploration before a perspective became central',
  'met-later': 'a perspective you encountered later',
  unknown: 'the path you have taken so far',
};

const philosophyLabels: Record<PathPhilosophy, string> = {
  accept: 'acceptance',
  resist: 'resistance',
  invest: 'investigation',
  mixed: 'a mix of approaches',
  unknown: 'the choices made so far',
};

const awarenessLabels: Record<AwarenessLevel, string> = {
  low: 'early pattern awareness',
  medium: 'growing pattern awareness',
  high: 'strong pattern awareness',
};

function outcomeForTier(tier: VariationMatchTier): SelectionOutcome {
  if (
    tier === 'exact-journey-philosophy' ||
    tier === 'journey' ||
    tier === 'philosophy' ||
    tier === 'strict'
  ) {
    return 'exact';
  }
  if (tier === 'deterministic-any' || tier === 'pool-exhausted') {
    return 'fallback';
  }
  return 'relaxed';
}

function templateForSelection(
  variation: Variation,
  context: ConditionContext,
  outcome: SelectionOutcome,
): SelectionReasonTemplateKey {
  if (outcome === 'fallback') {
    return 'selection.fallback';
  }
  if (context.visitCount > 1 || variation.transformationState !== 'initial') {
    return 'selection.return_visit';
  }
  const journeyMatched =
    variation.metadata.journeyPattern !== 'unknown' &&
    variation.metadata.journeyPattern === context.journeyPattern;
  const philosophyMatched =
    variation.metadata.philosophyDominant !== 'unknown' &&
    variation.metadata.philosophyDominant === context.pathPhilosophy;
  if (journeyMatched && philosophyMatched) {
    return 'selection.combined';
  }
  if (philosophyMatched) {
    return 'selection.philosophy';
  }
  if (journeyMatched && context.startingCharacter) {
    return 'selection.started_with';
  }
  if (journeyMatched) {
    return 'selection.journey_pattern';
  }
  if (variation.metadata.awarenessLevel) {
    return 'selection.awareness';
  }
  return 'selection.first_visit';
}

function buildTriggers(
  variation: Variation,
  context: ConditionContext,
  tier: VariationMatchTier,
): SelectionTrigger[] {
  const triggers: SelectionTrigger[] = [
    {
      kind: 'transformation-state',
      actual: context.transformationState,
      expected: variation.transformationState,
    },
    {
      kind: 'awareness-range',
      actual: context.awareness,
      expected: variation.metadata.awarenessRange,
    },
    { kind: 'visit-count', actual: context.visitCount },
  ];

  if (variation.metadata.journeyPattern !== 'unknown') {
    triggers.push({
      kind: 'journey-pattern',
      actual: context.journeyPattern,
      expected: variation.metadata.journeyPattern,
    });
  }
  if (variation.metadata.philosophyDominant !== 'unknown') {
    triggers.push({
      kind: 'path-philosophy',
      actual: context.pathPhilosophy,
      expected: variation.metadata.philosophyDominant,
    });
  }
  if (context.startingCharacter) {
    triggers.push({ kind: 'starting-character', actual: context.startingCharacter });
  }
  if (outcomeForTier(tier) !== 'exact') {
    triggers.push({ kind: 'fallback-tier', actual: tier });
  }
  return triggers;
}

/** Builds a stable explanation object without influencing selection. */
export function compileVariationSelectionReason(
  variation: Variation,
  context: ConditionContext,
  tier: VariationMatchTier,
): SelectionReason {
  const outcome = outcomeForTier(tier);
  return {
    contract: SELECTION_REASON_CONTRACT,
    schemaVersion: SELECTION_REASON_SCHEMA_VERSION,
    selectionKind: 'passage-variation',
    outcome,
    templateKey: templateForSelection(variation, context, outcome),
    parameters: {
      visitCount: context.visitCount,
      perspective: context.startingCharacter
        ? perspectiveLabels[context.startingCharacter]
        : 'the first perspective you encountered',
      journey: journeyLabels[context.journeyPattern],
      philosophy: philosophyLabels[context.pathPhilosophy],
      awareness: awarenessLabels[variation.metadata.awarenessLevel],
    },
    triggers: buildTriggers(variation, context, tier),
  };
}

/** Builds an explanation for one L3 section without exposing its variation ID. */
export function compileL3SelectionReason(
  assembly: L3Assembly,
  fragmentLabel: string,
): SelectionReason {
  return {
    contract: SELECTION_REASON_CONTRACT,
    schemaVersion: SELECTION_REASON_SCHEMA_VERSION,
    selectionKind: 'l3-section',
    outcome: 'exact',
    templateKey: 'selection.l3_assembly',
    parameters: {
      journey: journeyLabels[assembly.metadata.journeyPattern],
      philosophy: philosophyLabels[assembly.metadata.pathPhilosophy],
    },
    triggers: [
      { kind: 'l3-section', actual: fragmentLabel },
      { kind: 'journey-pattern', actual: assembly.metadata.journeyPattern },
      { kind: 'path-philosophy', actual: assembly.metadata.pathPhilosophy },
    ],
  };
}

/** Builds a fixed, reader-safe explanation for a reached ending. */
export function compileEndingSelectionReason(endingTitle: string): SelectionReason {
  return {
    contract: SELECTION_REASON_CONTRACT,
    schemaVersion: SELECTION_REASON_SCHEMA_VERSION,
    selectionKind: 'ending',
    outcome: 'fixed',
    templateKey: 'selection.ending_choice',
    parameters: { ending: endingTitle },
    triggers: [{ kind: 'ending-choice', actual: endingTitle }],
  };
}

function stringParameter(reason: SelectionReason, key: string): string {
  const value = reason.parameters[key];
  return typeof value === 'string' ? value : '';
}

function numberParameter(reason: SelectionReason, key: string): number {
  const value = reason.parameters[key];
  return typeof value === 'number' ? value : 0;
}

/** Renders only closed, reader-safe templates; machine evidence is never interpolated. */
export function renderSelectionReason(reason: SelectionReason): string {
  switch (reason.templateKey) {
    case 'selection.first_visit':
      return 'This version meets you on your first visit to this passage.';
    case 'selection.return_visit':
      return `This version appears because you have returned to this passage (visit ${numberParameter(reason, 'visitCount')}).`;
    case 'selection.started_with':
      return `This version reflects that you began with ${stringParameter(reason, 'perspective')}.`;
    case 'selection.journey_pattern':
      return `This version reflects ${stringParameter(reason, 'journey')}.`;
    case 'selection.philosophy':
      return `This version reflects choices that have leaned toward ${stringParameter(reason, 'philosophy')}.`;
    case 'selection.awareness':
      return `This version reflects your ${stringParameter(reason, 'awareness')}.`;
    case 'selection.combined':
      return `This version reflects ${stringParameter(reason, 'journey')} and choices leaning toward ${stringParameter(reason, 'philosophy')}.`;
    case 'selection.l3_assembly':
      return `This part of the convergence reflects ${stringParameter(reason, 'journey')} and ${stringParameter(reason, 'philosophy')}.`;
    case 'selection.ending_choice':
      return `This is the ending you chose: ${stringParameter(reason, 'ending')}.`;
    case 'selection.fallback':
      return 'This is the stable version used when no more specific path match is available.';
  }
}
