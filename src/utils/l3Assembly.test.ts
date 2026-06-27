import { beforeEach, describe, expect, it } from 'vitest';

import type { ConditionContext } from '@/types';

import { buildL3AssemblyWithProfile, calculateSynthesisPattern } from './l3Assembly';
import { performanceMonitor } from './performanceMonitor';
import { clearVariationCache, loadL3Variations } from './variationLoader';

const context: ConditionContext = {
  nodeId: 'arch-L3',
  awareness: 80,
  journeyPattern: 'started-stayed',
  pathPhilosophy: 'accept',
  visitCount: 1,
  transformationState: 'initial',
  characterVisitPercentages: {
    archaeologist: 70,
    algorithm: 20,
    lastHuman: 10,
  },
};

describe('L3 assembly integration', () => {
  beforeEach(() => {
    clearVariationCache();
    performanceMonitor.clear();
  });

  it('lazily loads and caches the four aggregate variation arrays', async () => {
    const first = await loadL3Variations('eternal-return');
    const second = await loadL3Variations('eternal-return');

    expect(first).toBe(second);
    expect({
      arch: first.arch.variations.length,
      algo: first.algo.variations.length,
      hum: first.hum.variations.length,
      conv: first.conv.variations.length,
    }).toEqual({
      arch: 45,
      algo: 45,
      hum: 45,
      conv: 135,
    });
  });

  it('selects and assembles the expected source variations', async () => {
    const variations = await loadL3Variations('eternal-return');
    const { assembly, profile } = await buildL3AssemblyWithProfile('eternal-return', context);

    expect({
      arch: assembly.arch.variationId,
      algo: assembly.algo.variationId,
      hum: assembly.hum.variationId,
      conv: assembly.conv.variationId,
    }).toEqual({
      arch: 'arch-L3-001',
      algo: 'algo-L3-001',
      hum: 'hum-L3-001',
      conv: 'conv-L3-001',
    });
    expect(assembly.arch.content).toBe(variations.arch.variations[0]?.content);
    expect(assembly.totalWordCount).toBe(
      assembly.arch.wordCount +
        assembly.algo.wordCount +
        assembly.hum.wordCount +
        assembly.conv.wordCount,
    );
    expect(profile.variationCounts).toEqual({
      arch: 45,
      algo: 45,
      hum: 45,
      conv: 135,
    });
    expect(profile.loadingMs).toBeGreaterThanOrEqual(0);
    expect(profile.selectionMs).toBeGreaterThanOrEqual(0);
    expect(profile.assemblyMs).toBeGreaterThanOrEqual(0);
    expect(performanceMonitor.getOperations()).toEqual(
      expect.arrayContaining(['l3.loading', 'l3.selection', 'l3.assembly', 'l3.total']),
    );
  });

  it('keeps synthesis calculation deterministic at boundary values', () => {
    expect(
      calculateSynthesisPattern({
        archaeologist: 61,
        algorithm: 20,
        lastHuman: 19,
      }),
    ).toBe('single-dominant');
    expect(
      calculateSynthesisPattern({
        archaeologist: 34,
        algorithm: 33,
        lastHuman: 33,
      }),
    ).toBe('true-triad');
    expect(
      calculateSynthesisPattern({
        archaeologist: 50,
        algorithm: 45,
        lastHuman: 5,
      }),
    ).toBe('balanced-dual');
  });
});
