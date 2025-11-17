import { describe, expect, it } from 'vitest';

import type { ConditionContext, Variation, VariationMetadata } from '@/types/Variation';

import { findMatchingVariation } from './conditionEvaluator';

const createVariation = (
  overrides: Partial<Omit<Variation, 'metadata'>> & {
    variationId: string;
    metadata?: Partial<VariationMetadata>;
  },
): Variation => {
  const { metadata: metadataOverrides, variationId, ...variationOverrides } = overrides;

  const metadata: VariationMetadata = {
    nodeId: 'arch-L1',
    section: 'l1',
    layer: 1,
    wordCount: 100,
    createdDate: '2025-01-01',
    journeyPattern: 'started-stayed',
    journeyCode: 'SS',
    philosophyDominant: 'accept',
    philosophyCode: 'A',
    awarenessLevel: 'low',
    awarenessCode: 'L',
    awarenessRange: [0, 100] as [number, number],
    readableLabel: 'Test variation',
    humanDescription: 'Test variation description',
    ...metadataOverrides,
    variationId,
  };

  return {
    variationId,
    schemaVersion: '1.0',
    id: variationId,
    sectionType: 'l1',
    transformationState: 'initial',
    journeyPattern: 'started-stayed',
    philosophyDominant: 'accept',
    awarenessLevel: 'low',
    content: `${variationId}-content`,
    ...variationOverrides,
    metadata,
  };
};

const baseContext: ConditionContext = {
  nodeId: 'arch-L1',
  awareness: 50,
  journeyPattern: 'shifted-dominant',
  pathPhilosophy: 'invest',
  visitCount: 2,
  transformationState: 'initial',
  characterVisitPercentages: {
    archaeologist: 40,
    algorithm: 30,
    lastHuman: 30,
  },
};

describe('findMatchingVariation fallback selection', () => {
  it('rotates relaxed matches when strict filters fail', () => {
    const variations: Variation[] = [
      createVariation({
        variationId: 'arch-L1-001',
        metadata: {
          journeyPattern: 'started-stayed',
          philosophyDominant: 'accept',
        },
      }),
      createVariation({
        variationId: 'arch-L1-002',
        metadata: {
          journeyPattern: 'met-later',
          philosophyDominant: 'resist',
        },
      }),
    ];

    const first = findMatchingVariation(variations, baseContext);
    expect(first?.variationId).toBe('arch-L1-001');

    const second = findMatchingVariation(variations, {
      ...baseContext,
      recentVariationIds: ['arch-L1-001'],
    });

    expect(second?.variationId).toBe('arch-L1-002');
  });

  it('prioritizes same transformation state before philosophy-only fallbacks', () => {
    const variations: Variation[] = [
      createVariation({
        variationId: 'arch-L1-010',
        metadata: { awarenessRange: [0, 20] },
      }),
      createVariation({
        variationId: 'arch-L1-999',
        transformationState: 'metaAware',
        philosophyDominant: 'accept',
        metadata: {
          journeyPattern: 'met-later',
          philosophyDominant: 'accept',
          awarenessRange: [40, 90],
        },
      }),
    ];

    const selection = findMatchingVariation(variations, {
      ...baseContext,
      awareness: 80,
      pathPhilosophy: 'accept',
    });

    expect(selection?.variationId).toBe('arch-L1-010');
  });
});
