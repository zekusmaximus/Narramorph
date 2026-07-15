export const SELECTION_REASON_CONTRACT = 'org.narramorph.selection-reason' as const;
export const SELECTION_REASON_SCHEMA_VERSION = '1.0.0' as const;

export type SelectionKind = 'passage-variation' | 'l3-section' | 'ending';
export type SelectionOutcome = 'exact' | 'relaxed' | 'fallback' | 'fixed';

export type SelectionReasonTemplateKey =
  | 'selection.first_visit'
  | 'selection.return_visit'
  | 'selection.started_with'
  | 'selection.journey_pattern'
  | 'selection.philosophy'
  | 'selection.awareness'
  | 'selection.combined'
  | 'selection.l3_assembly'
  | 'selection.ending_choice'
  | 'selection.fallback';

export type SelectionTriggerKind =
  | 'transformation-state'
  | 'awareness-range'
  | 'journey-pattern'
  | 'path-philosophy'
  | 'visit-count'
  | 'starting-character'
  | 'fallback-tier'
  | 'l3-section'
  | 'ending-choice';

export type SelectionTriggerValue = string | number | boolean | [number, number];

export interface SelectionTrigger {
  kind: SelectionTriggerKind;
  actual: SelectionTriggerValue;
  expected?: SelectionTriggerValue;
}

export interface SelectionReason {
  contract: typeof SELECTION_REASON_CONTRACT;
  schemaVersion: typeof SELECTION_REASON_SCHEMA_VERSION;
  selectionKind: SelectionKind;
  outcome: SelectionOutcome;
  templateKey: SelectionReasonTemplateKey;
  parameters: Record<string, string | number>;
  triggers: SelectionTrigger[];
}

export type VariationMatchTier =
  | 'exact-journey-philosophy'
  | 'journey'
  | 'philosophy'
  | 'strict'
  | 'state-awareness-relaxed'
  | 'state-relaxed'
  | 'philosophy-relaxed'
  | 'deterministic-any'
  | 'pool-exhausted';
