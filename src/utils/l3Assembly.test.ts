import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { selectL3Sections } from '@/domain/l3/assembly';
import type * as L3DomainModule from '@/domain/l3/assembly';
import type { ConditionContext } from '@/types';

import {
  buildL3Assembly,
  buildL3AssemblyWithProfile,
  calculateSynthesisPattern,
  getL3AssemblySections,
} from './l3Assembly';
import { performanceMonitor } from './performanceMonitor';
import { clearVariationCache, loadL3Variations } from './variationLoader';

// Real selection by default; one test forces the "no complete selection" result.
vi.mock('@/domain/l3/assembly', async (importOriginal) => {
  const actual = await importOriginal<typeof L3DomainModule>();
  return { ...actual, selectL3Sections: vi.fn(actual.selectL3Sections) };
});

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
  readingPath: ['arch-L1', 'arch-L2-accept', 'arch-L3'],
  visitCounts: { 'arch-L1': 1, 'arch-L2-accept': 1, 'arch-L3': 1 },
  startingCharacter: 'archaeologist',
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

  it('needs strictly more than 60% for a single dominant perspective', () => {
    expect(calculateSynthesisPattern({ archaeologist: 60, algorithm: 20, lastHuman: 20 })).toBe(
      'balanced-dual',
    );
    expect(calculateSynthesisPattern({ archaeologist: 20, algorithm: 20, lastHuman: 61 })).toBe(
      'single-dominant',
    );
  });

  it('needs every perspective strictly within 15 points of the mean for a true triad', () => {
    // Mean 30: deviations of 14, 0, and 14.
    expect(calculateSynthesisPattern({ archaeologist: 44, algorithm: 30, lastHuman: 16 })).toBe(
      'true-triad',
    );
    // Mean 30: a deviation of exactly 15 is no longer a triad.
    expect(calculateSynthesisPattern({ archaeologist: 45, algorithm: 30, lastHuman: 15 })).toBe(
      'balanced-dual',
    );
  });
});

describe('buildL3Assembly', () => {
  beforeEach(() => {
    clearVariationCache();
    performanceMonitor.clear();
    vi.mocked(selectL3Sections).mockClear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const timerRecords = () =>
    performanceMonitor.exportMetrics().filter((metric) => metric.operation === 'l3Assembly');

  it('returns the assembly and records a successful build with its journey', async () => {
    const assembly = await buildL3Assembly('eternal-return', context);

    expect(assembly?.metadata).toMatchObject({
      journeyPattern: 'started-stayed',
      pathPhilosophy: 'accept',
      synthesisPattern: 'single-dominant',
    });
    expect(timerRecords()).toEqual([
      expect.objectContaining({
        metadata: {
          success: true,
          journeyPattern: 'started-stayed',
          pathPhilosophy: 'accept',
          synthesisPattern: 'single-dominant',
        },
      }),
    ]);
  });

  it('tags each stage timing with the story and its variation count', async () => {
    await buildL3AssemblyWithProfile('eternal-return', context);

    const stages = performanceMonitor
      .exportMetrics()
      .filter((metric) => metric.operation.startsWith('l3.'));
    expect(stages.map((metric) => metric.operation)).toEqual([
      'l3.loading',
      'l3.selection',
      'l3.assembly',
      'l3.total',
    ]);
    for (const stage of stages) {
      expect(stage.metadata).toEqual({ storyId: 'eternal-return', variationCount: 270 });
    }
  });

  it('returns null, logs, and records a failed build when the story has no L3 content', async () => {
    await expect(buildL3AssemblyWithProfile('no-such-story', context)).rejects.toThrow(
      'Incomplete L3 variation set for story "no-such-story"',
    );

    await expect(buildL3Assembly('no-such-story', context)).resolves.toBeNull();

    expect(console.error).toHaveBeenCalledWith('Error building L3 assembly:', expect.any(Error));
    expect(timerRecords()).toEqual([expect.objectContaining({ metadata: { success: false } })]);
  });

  it('fails the build rather than assembling a partial convergence', async () => {
    vi.mocked(selectL3Sections).mockReturnValueOnce(null);
    await expect(buildL3AssemblyWithProfile('eternal-return', context)).rejects.toThrow(
      'Unable to select all L3 sections for story "eternal-return"',
    );

    vi.mocked(selectL3Sections).mockReturnValueOnce(null);
    await expect(buildL3Assembly('eternal-return', context)).resolves.toBeNull();
    expect(timerRecords()).toEqual([expect.objectContaining({ metadata: { success: false } })]);
  });
});

describe('getL3AssemblySections', () => {
  it('returns the four sections in reading order with the keys the view tracks', async () => {
    const { assembly } = await buildL3AssemblyWithProfile('eternal-return', context);

    const sections = getL3AssemblySections(assembly);

    // L3AssemblyView maps these characters to the store's arch/algo/hum/conv read flags and
    // throws on any other value, so the names and order are a contract.
    expect(sections.map(({ title, character }) => ({ title, character }))).toEqual([
      { title: 'Archaeologist Perspective', character: 'archaeologist' },
      { title: 'Algorithm Perspective', character: 'algorithm' },
      { title: 'Last Human Perspective', character: 'lastHuman' },
      { title: 'Convergence', character: 'convergence' },
    ]);
    expect(sections.map(({ content, wordCount }) => ({ content, wordCount }))).toEqual(
      [assembly.arch, assembly.algo, assembly.hum, assembly.conv].map(({ content, wordCount }) => ({
        content,
        wordCount,
      })),
    );
  });
});
