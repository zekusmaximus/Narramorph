/**
 * L3 Assembly Builder - constructs 4-section convergence assemblies
 */

import { assembleL3Selection, selectL3Sections } from '@/domain/l3/assembly';
import type { ConditionContext, L3Assembly, SynthesisPattern } from '@/types';

import { performanceMonitor } from './performanceMonitor';
import { loadL3Variations } from './variationLoader';

export interface L3AssemblyProfile {
  loadingMs: number;
  selectionMs: number;
  assemblyMs: number;
  totalMs: number;
  variationCounts: {
    arch: number;
    algo: number;
    hum: number;
    conv: number;
  };
}

export interface ProfiledL3Assembly {
  assembly: L3Assembly;
  profile: L3AssemblyProfile;
}

/**
 * Calculate synthesis pattern based on character visit percentages
 */
export function calculateSynthesisPattern(percentages: {
  archaeologist: number;
  algorithm: number;
  lastHuman: number;
}): SynthesisPattern {
  const { archaeologist, algorithm, lastHuman } = percentages;
  const max = Math.max(archaeologist, algorithm, lastHuman);

  // Single-dominant: One character >60%
  if (max > 60) {
    return 'single-dominant';
  }

  // True-triad: All three characters ~33% each (within 15% of each other)
  const avg = (archaeologist + algorithm + lastHuman) / 3;
  const maxDiff = Math.max(
    Math.abs(archaeologist - avg),
    Math.abs(algorithm - avg),
    Math.abs(lastHuman - avg),
  );

  if (maxDiff < 15) {
    return 'true-triad';
  }

  // Balanced-dual: Two characters ~40-50% each
  return 'balanced-dual';
}

/**
 * Build a complete L3 assembly and expose stage timings for repeatable
 * profiling. Loading is asynchronous because the aggregate JSON is code-split;
 * selection and assembly remain synchronous because both are sub-millisecond.
 */
export async function buildL3AssemblyWithProfile(
  storyId: string,
  context: ConditionContext,
): Promise<ProfiledL3Assembly> {
  const totalStarted = performance.now();

  const loadingStarted = performance.now();
  const variations = await loadL3Variations(storyId);
  const loadingMs = performance.now() - loadingStarted;

  const synthesisPattern = calculateSynthesisPattern(context.characterVisitPercentages);

  const selectionStarted = performance.now();
  const selection = selectL3Sections(variations, context, synthesisPattern);
  const selectionMs = performance.now() - selectionStarted;

  if (!selection) {
    throw new Error(`Unable to select all L3 sections for story "${storyId}"`);
  }

  const assemblyStarted = performance.now();
  const assembly = assembleL3Selection(selection, context);
  const assemblyMs = performance.now() - assemblyStarted;

  const profile: L3AssemblyProfile = {
    loadingMs,
    selectionMs,
    assemblyMs,
    totalMs: performance.now() - totalStarted,
    variationCounts: {
      arch: variations.arch.variations.length,
      algo: variations.algo.variations.length,
      hum: variations.hum.variations.length,
      conv: variations.conv.variations.length,
    },
  };

  const metadata = {
    storyId,
    variationCount: Object.values(profile.variationCounts).reduce(
      (total, count) => total + count,
      0,
    ),
  };
  performanceMonitor.recordDuration('l3.loading', loadingMs, metadata);
  performanceMonitor.recordDuration('l3.selection', selectionMs, metadata);
  performanceMonitor.recordDuration('l3.assembly', assemblyMs, metadata);
  performanceMonitor.recordDuration('l3.total', profile.totalMs, metadata);

  return { assembly, profile };
}

export async function buildL3Assembly(
  storyId: string,
  context: ConditionContext,
): Promise<L3Assembly | null> {
  const endTimer = performanceMonitor.startTimer('l3Assembly');

  try {
    const result = await buildL3AssemblyWithProfile(storyId, context);
    endTimer({
      success: true,
      journeyPattern: result.assembly.metadata.journeyPattern,
      pathPhilosophy: result.assembly.metadata.pathPhilosophy,
      synthesisPattern: result.assembly.metadata.synthesisPattern,
    });
    return result.assembly;
  } catch (error) {
    console.error('Error building L3 assembly:', error);
    endTimer({ success: false });
    return null;
  }
}

/**
 * Get L3 assembly content as separate sections for rendering, in reading order. The
 * `character` values are the keys L3AssemblyView maps to the store's section-read progress.
 */
export function getL3AssemblySections(assembly: L3Assembly): {
  title: string;
  content: string;
  character: string;
  wordCount: number;
}[] {
  return [
    {
      title: 'Archaeologist Perspective',
      content: assembly.arch.content,
      character: 'archaeologist',
      wordCount: assembly.arch.wordCount,
    },
    {
      title: 'Algorithm Perspective',
      content: assembly.algo.content,
      character: 'algorithm',
      wordCount: assembly.algo.wordCount,
    },
    {
      title: 'Last Human Perspective',
      content: assembly.hum.content,
      character: 'lastHuman',
      wordCount: assembly.hum.wordCount,
    },
    {
      title: 'Convergence',
      content: assembly.conv.content,
      character: 'convergence',
      wordCount: assembly.conv.wordCount,
    },
  ];
}
