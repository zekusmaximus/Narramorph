import { describe, expect, it } from 'vitest';

import type { ConditionContext, Variation } from '@/types';

import { compileVariationSelectionReason, renderSelectionReason } from './selectionReason';

const context: ConditionContext = {
  nodeId: 'arch-L1',
  awareness: 52,
  journeyPattern: 'started-bounced',
  pathPhilosophy: 'accept',
  visitCount: 2,
  transformationState: 'firstRevisit',
  characterVisitPercentages: { archaeologist: 55, algorithm: 25, lastHuman: 20 },
  readingPath: ['arch-L1', 'algo-L1', 'arch-L1'],
  visitCounts: { 'arch-L1': 2, 'algo-L1': 1 },
  startingCharacter: 'archaeologist',
};

const variation: Variation = {
  variationId: 'arch-L1-internal-002',
  schemaVersion: '1.0.0',
  id: 'arch-L1-internal-002',
  sectionType: 'arch-L1',
  transformationState: 'firstRevisit',
  journeyPattern: 'started-bounced',
  philosophyDominant: 'accept',
  awarenessLevel: 'medium',
  content: 'Reader prose',
  metadata: {
    variationId: 'arch-L1-internal-002',
    nodeId: 'arch-L1',
    section: 'L1',
    layer: 1,
    wordCount: 2,
    createdDate: '2026-01-01',
    journeyPattern: 'started-bounced',
    journeyCode: 'SB',
    philosophyDominant: 'accept',
    philosophyCode: 'A',
    awarenessLevel: 'medium',
    awarenessCode: 'M',
    awarenessRange: [35, 69],
    readableLabel: 'Internal label',
    humanDescription: 'Internal description',
  },
};

describe('SelectionReason compiler', () => {
  it('emits versioned machine evidence and safe return language', () => {
    const reason = compileVariationSelectionReason(variation, context, 'exact-journey-philosophy');

    expect(reason).toMatchObject({
      contract: 'org.narramorph.selection-reason',
      schemaVersion: '1.0.0',
      selectionKind: 'passage-variation',
      outcome: 'exact',
      templateKey: 'selection.return_visit',
    });
    expect(reason.triggers.map((trigger) => trigger.kind)).toContain('journey-pattern');
    expect(renderSelectionReason(reason)).toBe(
      'This version appears because you have returned to this passage (visit 2).',
    );
  });

  it('keeps raw identifiers and fallback diagnostics out of reader language', () => {
    const reason = compileVariationSelectionReason(variation, context, 'state-relaxed');
    const rendered = renderSelectionReason(reason);

    expect(reason.triggers).toContainEqual({ kind: 'fallback-tier', actual: 'state-relaxed' });
    expect(rendered).not.toContain('arch-L1');
    expect(rendered).not.toContain('state-relaxed');
    expect(rendered).not.toContain('internal');
  });

  it('uses a stable fallback template without exposing future alternatives', () => {
    const reason = compileVariationSelectionReason(variation, context, 'deterministic-any');

    expect(reason.outcome).toBe('fallback');
    expect(reason.templateKey).toBe('selection.fallback');
    expect(renderSelectionReason(reason)).toBe(
      'This is the stable version used when no more specific path match is available.',
    );
  });
});
