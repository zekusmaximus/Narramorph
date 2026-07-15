import { describe, expect, it } from 'vitest';

import type {
  ConditionContext,
  L3Variation,
  L3VariationFile,
  L3VariationSet,
  SynthesisPattern,
} from '@/types';

import {
  assembleL3Selection,
  getL3AwarenessLevel,
  selectL3Sections,
  selectL3Variation,
  selectL3VariationWithTier,
  toContentSynthesisPattern,
} from './assembly';

const context: ConditionContext = {
  nodeId: 'arch-L3',
  awareness: 82,
  journeyPattern: 'started-stayed',
  pathPhilosophy: 'accept',
  visitCount: 1,
  transformationState: 'initial',
  characterVisitPercentages: {
    archaeologist: 70,
    algorithm: 20,
    lastHuman: 10,
  },
  readingPath: ['arch-L1', 'arch-L2-accept', 'arch-L3'],
  visitCounts: { 'arch-L1': 1, 'arch-L2-accept': 1, 'arch-L3': 1 },
  startingCharacter: 'archaeologist',
};

function createVariation(variationId: string, overrides: Partial<L3Variation> = {}): L3Variation {
  return {
    variationId,
    content: `${variationId} content`,
    journeyPattern: 'started-stayed',
    philosophyDominant: 'accept',
    awarenessLevel: 'high',
    metadata: {
      wordCount: 100,
    },
    ...overrides,
  };
}

function createFile(nodeId: string, variations: readonly L3Variation[]): L3VariationFile {
  return { nodeId, variations };
}

function createVariationSet(synthesisPattern: SynthesisPattern): L3VariationSet {
  const contentSynthesis = toContentSynthesisPattern(synthesisPattern);

  return {
    arch: createFile('arch-L3', [createVariation('arch-exact')]),
    algo: createFile('algo-L3', [createVariation('algo-exact')]),
    hum: createFile('hum-L3', [createVariation('hum-exact')]),
    conv: createFile('conv-L3', [
      createVariation('conv-other', {
        metadata: { wordCount: 180, synthesisPattern: 'single-dominant' },
      }),
      createVariation('conv-exact', {
        metadata: { wordCount: 200, synthesisPattern: contentSynthesis },
      }),
    ]),
  };
}

describe('L3 assembly domain', () => {
  it('maps runtime synthesis names to the content contract', () => {
    expect(toContentSynthesisPattern('single-dominant')).toBe('single-dominant');
    expect(toContentSynthesisPattern('balanced-dual')).toBe('dual-balanced');
    expect(toContentSynthesisPattern('true-triad')).toBe('triple-balanced');
  });

  it('selects exact context and synthesis matches', () => {
    const file = createVariationSet('true-triad').conv;

    expect(selectL3Variation(file, context, 'high', 'true-triad')?.variationId).toBe('conv-exact');
  });

  it('uses deterministic fallbacks for incomplete legacy combinations', () => {
    const file = createFile('arch-L3', [
      createVariation('first', { philosophyDominant: 'resist' }),
      createVariation('journey-and-philosophy', {
        awarenessLevel: 'low',
      }),
    ]);

    expect(selectL3Variation(file, context, 'medium')?.variationId).toBe('journey-and-philosophy');
    expect(selectL3VariationWithTier(file, context, 'medium')?.tier).toBe('journey-philosophy');
  });

  it.each([
    [
      'journey',
      createVariation('journey', {
        philosophyDominant: 'resist',
        awarenessLevel: 'low',
      }),
    ],
    [
      'philosophy',
      createVariation('philosophy', {
        journeyPattern: 'met-later',
        awarenessLevel: 'low',
      }),
    ],
    [
      'deterministic-any',
      createVariation('any', {
        journeyPattern: 'met-later',
        philosophyDominant: 'resist',
        awarenessLevel: 'low',
      }),
    ],
  ] as const)('reports the %s L3 fallback criterion', (expectedTier, candidate) => {
    const result = selectL3VariationWithTier(createFile('arch-L3', [candidate]), context, 'medium');

    expect(result?.tier).toBe(expectedTier);
  });

  it('assembles the selected source content without transforming it', () => {
    const variations = createVariationSet('balanced-dual');
    const selection = selectL3Sections(variations, context, 'balanced-dual');

    expect(selection).not.toBeNull();
    if (!selection) {
      return;
    }

    const assembly = assembleL3Selection(selection, context);

    expect(assembly.arch.content).toBe('arch-exact content');
    expect(assembly.conv.variationId).toBe('conv-exact');
    expect(assembly.conv.matchTier).toBe('exact-synthesis');
    expect(assembly.totalWordCount).toBe(500);
    expect(assembly.metadata).toMatchObject({
      awarenessLevel: getL3AwarenessLevel(context.awareness),
      synthesisPattern: 'balanced-dual',
    });
  });
});
