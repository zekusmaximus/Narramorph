/**
 * L3 Assembly Builder - constructs 4-section convergence assemblies
 */

import { assembleL3Selection, selectL3Sections } from '@/domain/l3/assembly';
import type { L3Assembly, L3AssemblySection, ConditionContext, SynthesisPattern } from '@/types';

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
 * Get L3 assembly content as a single combined string
 */
export function getL3AssemblyContent(assembly: L3Assembly): string {
  const sections = [
    `# Archaeologist Perspective\n\n${assembly.arch.content}`,
    `\n\n---\n\n# Algorithm Perspective\n\n${assembly.algo.content}`,
    `\n\n---\n\n# Last Human Perspective\n\n${assembly.hum.content}`,
    `\n\n---\n\n# Convergence\n\n${assembly.conv.content}`,
  ];

  return sections.join('');
}

/**
 * Get L3 assembly content as separate sections for rendering
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

/**
 * Validate L3 assembly for completeness and expected word counts
 */
export function validateL3Assembly(assembly: L3Assembly): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check section presence
  if (!assembly.arch) {
    errors.push('Missing archaeologist section');
  }
  if (!assembly.algo) {
    errors.push('Missing algorithm section');
  }
  if (!assembly.hum) {
    errors.push('Missing human section');
  }
  if (!assembly.conv) {
    errors.push('Missing convergence section');
  }

  // Check word counts (approximate expected ranges)
  const checkWordCount = (
    section: L3AssemblySection,
    name: string,
    expectedMin: number,
    expectedMax: number,
  ): void => {
    if (section.wordCount < expectedMin) {
      warnings.push(
        `${name} section word count (${section.wordCount}) below expected minimum (${expectedMin})`,
      );
    }
    if (section.wordCount > expectedMax) {
      warnings.push(
        `${name} section word count (${section.wordCount}) above expected maximum (${expectedMax})`,
      );
    }
  };

  if (assembly.arch) {
    checkWordCount(assembly.arch, 'Archaeologist', 800, 1000);
  }
  if (assembly.algo) {
    checkWordCount(assembly.algo, 'Algorithm', 800, 1000);
  }
  if (assembly.hum) {
    checkWordCount(assembly.hum, 'Human', 800, 1000);
  }
  if (assembly.conv) {
    checkWordCount(assembly.conv, 'Convergence', 1600, 2000);
  }

  // Check total word count
  const expectedTotal = 4200; // Approximate expected total
  const tolerance = 500;
  if (Math.abs(assembly.totalWordCount - expectedTotal) > tolerance) {
    warnings.push(
      `Total word count (${assembly.totalWordCount}) differs from expected (~${expectedTotal})`,
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
