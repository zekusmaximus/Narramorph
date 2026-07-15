import { describe, expect, it, vi } from 'vitest';

import type {
  ConditionContext,
  Variation,
  VariationFile,
  VariationMetadata,
  VisitRecord,
} from '@/types';

import { recordVariationSelection, selectVariation } from './selection';

const metadata: VariationMetadata = {
  variationId: 'arch-L1-001',
  nodeId: 'arch-L1',
  section: 'L1',
  layer: 1,
  wordCount: 2,
  createdDate: '2026-01-01',
  journeyPattern: 'unknown',
  journeyCode: 'UK',
  philosophyDominant: 'unknown',
  philosophyCode: 'UK',
  awarenessLevel: 'low',
  awarenessCode: 'L',
  awarenessRange: [0, 100],
  readableLabel: 'Test',
  humanDescription: 'Test variation',
};

const variation: Variation = {
  variationId: 'arch-L1-001',
  schemaVersion: '1.0.0',
  id: 'arch-L1-001',
  sectionType: 'arch-L1',
  transformationState: 'initial',
  journeyPattern: 'unknown',
  philosophyDominant: 'unknown',
  awarenessLevel: 'low',
  content: 'Selected content',
  metadata,
};

const context: ConditionContext = {
  nodeId: 'arch-L1',
  awareness: 0,
  journeyPattern: 'unknown',
  pathPhilosophy: 'unknown',
  visitCount: 1,
  transformationState: 'initial',
  characterVisitPercentages: { archaeologist: 100, algorithm: 0, lastHuman: 0 },
  readingPath: ['arch-L1'],
  visitCounts: { 'arch-L1': 1 },
  startingCharacter: 'archaeologist',
};

function dependencies(file: VariationFile | null, match: Variation | null = variation) {
  return {
    loadVariationFile: vi.fn(() => file),
    findMatchingVariation: vi.fn(() =>
      match ? { variation: match, tier: 'strict' as const, poolExhausted: false } : null,
    ),
  };
}

describe('selectVariation', () => {
  it('returns a normal matched selection', () => {
    const result = selectVariation(
      { storyId: 'eternal-return', nodeId: 'arch-L1', context },
      dependencies({ nodeId: 'arch-L1', variations: [variation] }),
    );

    expect(result).toMatchObject({
      content: 'Selected content',
      variationId: 'arch-L1-001',
      metadata,
      error: null,
      usedFallback: false,
      reason: 'matched',
      selectionReason: {
        contract: 'org.narramorph.selection-reason',
        schemaVersion: '1.0.0',
        selectionKind: 'passage-variation',
      },
    });
  });

  it('returns the static fallback for a missing or empty variation file', () => {
    const result = selectVariation(
      {
        storyId: 'eternal-return',
        nodeId: 'arch-L1',
        fallbackContent: 'Static content',
        context,
      },
      dependencies({ nodeId: 'arch-L1', variations: [] }),
    );

    expect(result).toMatchObject({
      content: 'Static content',
      variationId: null,
      error: null,
      usedFallback: true,
      reason: 'missing-variations',
      selectionReason: null,
    });
  });

  it('uses the first variation when the matcher returns no result', () => {
    const result = selectVariation(
      { storyId: 'eternal-return', nodeId: 'arch-L1', context },
      dependencies({ nodeId: 'arch-L1', variations: [variation] }, null),
    );

    expect(result).toMatchObject({
      content: 'Selected content',
      variationId: 'arch-L1-001',
      error: null,
      usedFallback: true,
      reason: 'first-variation-fallback',
      selectionReason: { outcome: 'fallback', templateKey: 'selection.fallback' },
    });
  });

  it('contains loader and malformed-context failures without throwing', () => {
    const result = selectVariation(
      {
        storyId: 'eternal-return',
        nodeId: 'arch-L1',
        fallbackContent: 'Static content',
        context,
      },
      {
        loadVariationFile: () => {
          throw new Error('Malformed runtime variation');
        },
        findMatchingVariation: vi.fn(),
      },
    );

    expect(result).toMatchObject({
      content: 'Static content',
      variationId: null,
      usedFallback: true,
      reason: 'selection-error',
      selectionReason: null,
    });
    expect(result.error?.message).toBe('Malformed runtime variation');
  });

  it('returns an error when no variations and no static fallback exist', () => {
    const result = selectVariation(
      { storyId: 'eternal-return', nodeId: 'arch-L1', context },
      dependencies(null),
    );

    expect(result.reason).toBe('selection-error');
    expect(result.error?.message).toBe('No variation file found for node: arch-L1');
  });
});

describe('recordVariationSelection', () => {
  const visitRecord: VisitRecord = {
    visitCount: 1,
    visitTimestamps: ['2026-01-01T00:00:00.000Z'],
    currentState: 'initial',
    timeSpent: 0,
    lastVisited: '2026-01-01T00:00:00.000Z',
    recentVariationIds: ['arch-L1-001'],
  };

  it('appends a fresh selection without mutating saved history', () => {
    const updated = recordVariationSelection(visitRecord, 'arch-L1-002');

    expect(updated.variationId).toBe('arch-L1-002');
    expect(updated.recentVariationIds).toEqual(['arch-L1-001', 'arch-L1-002']);
    expect(visitRecord.recentVariationIds).toEqual(['arch-L1-001']);
  });

  it('deduplicates a selection that has already been recorded', () => {
    const updated = recordVariationSelection(visitRecord, 'arch-L1-001');

    expect(updated.recentVariationIds).toEqual(['arch-L1-001']);
  });
});
