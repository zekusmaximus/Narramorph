import { describe, expect, it } from 'vitest';

import type { SelectionReason, SelectionReasonTemplateKey, SelectionRecord } from '@/types';
import { SELECTION_REASON_CONTRACT, SELECTION_REASON_SCHEMA_VERSION } from '@/types';

import { auditSelectionReason, auditSelectionRecord } from './explanationAudit';

const parameters: Record<SelectionReasonTemplateKey, Record<string, string | number>> = {
  'selection.first_visit': { visitCount: 1 },
  'selection.return_visit': { visitCount: 2 },
  'selection.started_with': { perspective: 'the Archaeologist' },
  'selection.journey_pattern': { journey: 'your movement between perspectives' },
  'selection.philosophy': { philosophy: 'acceptance' },
  'selection.awareness': { awareness: 'growing pattern awareness' },
  'selection.combined': { journey: 'the path taken', philosophy: 'investigation' },
  'selection.l3_assembly': { journey: 'the path taken', philosophy: 'resistance' },
  'selection.ending_choice': { ending: 'Release into the Pattern' },
  'selection.fallback': {},
};

function reason(templateKey: SelectionReasonTemplateKey): SelectionReason {
  const selectionKind =
    templateKey === 'selection.l3_assembly'
      ? 'l3-section'
      : templateKey === 'selection.ending_choice'
        ? 'ending'
        : 'passage-variation';
  const outcome =
    templateKey === 'selection.fallback'
      ? 'fallback'
      : templateKey === 'selection.ending_choice'
        ? 'fixed'
        : 'exact';
  return {
    contract: SELECTION_REASON_CONTRACT,
    schemaVersion: SELECTION_REASON_SCHEMA_VERSION,
    selectionKind,
    outcome,
    templateKey,
    parameters: parameters[templateKey],
    triggers: [],
  };
}

function record(overrides: Partial<SelectionRecord> = {}): SelectionRecord {
  return {
    sequence: 1,
    nodeId: 'internal-node',
    passageTitle: 'A Reader-Facing Passage',
    excerpt: 'A bounded excerpt from the passage.',
    variationId: 'internal-variation',
    fragmentLabel: undefined,
    selectedAt: '2026-07-15T12:00:00.000Z',
    visitNumber: 1,
    reason: reason('selection.first_visit'),
    explanation: 'This version meets you on your first visit to this passage.',
    ...overrides,
  };
}

describe('explanation audit', () => {
  it.each(Object.keys(parameters) as SelectionReasonTemplateKey[])(
    'accepts a complete, reader-safe %s explanation',
    (templateKey) => {
      expect(auditSelectionReason(reason(templateKey))).toEqual([]);
    },
  );

  it('detects missing explanations and parameters', () => {
    const incomplete = reason('selection.combined');
    incomplete.parameters = { journey: '' };

    expect(auditSelectionReason(incomplete).map((finding) => finding.code)).toContain(
      'missing-explanation',
    );
    expect(
      auditSelectionRecord(record({ explanation: '' })).map((finding) => finding.code),
    ).toContain('missing-explanation');
  });

  it.each([
    ['internal-id', 'Chosen because arch-L2-accept matched.'],
    ['raw-condition-data', 'Chosen because {"kind":"visitCount","actual":2} matched.'],
    ['spoiler-leak', 'Chosen before the hidden ascension is revealed.'],
  ] as const)('detects %s in reader-visible ledger fields', (expectedCode, explanation) => {
    const findings = auditSelectionRecord(record({ explanation }), {
      forbiddenTerms: ['hidden ascension'],
    });

    expect(findings.map((finding) => finding.code)).toContain(expectedCode);
  });

  it('detects template/outcome and visit-number contradictions', () => {
    const ending = reason('selection.ending_choice');
    ending.selectionKind = 'passage-variation';
    const returnVisit = reason('selection.return_visit');
    returnVisit.parameters.visitCount = 1;

    expect(auditSelectionReason(ending).map((finding) => finding.code)).toContain('contradiction');
    expect(auditSelectionReason(returnVisit).map((finding) => finding.code)).toContain(
      'contradiction',
    );
  });

  it('audits only reader-visible fields and permits machine IDs in private evidence', () => {
    expect(auditSelectionRecord(record())).toEqual([]);
  });
});
