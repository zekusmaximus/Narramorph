/**
 * L3 Assembly Builder - constructs 4-section convergence assemblies
 */

import type {
  L3Assembly,
  L3AssemblySection,
  ConditionContext,
  SynthesisPattern,
  VariationFile,
} from '@/types';
import { loadL3Variations } from './variationLoader';
import { findMatchingVariation } from './conditionEvaluator';
import { performanceMonitor } from './performanceMonitor';

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
 * Build a single L3 section for a character
 */
function buildSection(
  character: 'arch' | 'algo' | 'hum' | 'conv',
  variationFile: VariationFile | null,
  context: ConditionContext,
): L3AssemblySection | null {
  if (!variationFile || !variationFile.variations) {
    console.warn(`No variation file found for ${character}`);
    return null;
  }

  const variation = findMatchingVariation(variationFile.variations, context);

  if (!variation) {
    console.warn(`No matching variation found for ${character}`, context);
    // Fallback to first variation if available
    if (variationFile.variations.length > 0) {
      const fallback = variationFile.variations[0];
      return {
        character,
        variationId: fallback.variationId,
        content: fallback.content,
        wordCount: fallback.metadata.wordCount,
        metadata: fallback.metadata,
      };
    }
    return null;
  }

  return {
    character,
    variationId: variation.variationId,
    content: variation.content,
    wordCount: variation.metadata.wordCount,
    metadata: variation.metadata,
  };
}

/**
 * Build a complete L3 assembly with all 4 sections
 */
export function buildL3Assembly(storyId: string, context: ConditionContext): L3Assembly | null {
  const endTimer = performanceMonitor.startTimer('l3Assembly');

  // Load all L3 variation files
  const variations = loadL3Variations(storyId);

  // Build each section
  const archSection = buildSection('arch', variations.arch, context);
  const algoSection = buildSection('algo', variations.algo, context);
  const humSection = buildSection('hum', variations.hum, context);

  // For convergence section, we need to adjust context with synthesis pattern
  const synthesisPattern = calculateSynthesisPattern(context.characterVisitPercentages);
  const convSection = buildSection('conv', variations.conv, context);

  // Ensure all sections are present
  if (!archSection || !algoSection || !humSection || !convSection) {
    console.error('Failed to build all L3 sections');
    endTimer({ success: false });
    return null;
  }

  const totalWordCount =
    archSection.wordCount + algoSection.wordCount + humSection.wordCount + convSection.wordCount;

  const result = {
    arch: archSection,
    algo: algoSection,
    hum: humSection,
    conv: convSection,
    totalWordCount,
    metadata: {
      journeyPattern: context.journeyPattern,
      pathPhilosophy: context.pathPhilosophy,
      awarenessLevel:
        context.awareness < 35
          ? ('low' as const)
          : context.awareness < 70
            ? ('medium' as const)
            : ('high' as const),
      synthesisPattern,
      convergenceAlignment: convSection.metadata.convergenceAlignment,
    },
  };

  endTimer({
    success: true,
    journeyPattern: result.metadata.journeyPattern,
    pathPhilosophy: result.metadata.pathPhilosophy,
    synthesisPattern: result.metadata.synthesisPattern,
  });

  return result;
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
  if (!assembly.arch) errors.push('Missing archaeologist section');
  if (!assembly.algo) errors.push('Missing algorithm section');
  if (!assembly.hum) errors.push('Missing human section');
  if (!assembly.conv) errors.push('Missing convergence section');

  // Check word counts (approximate expected ranges)
  const checkWordCount = (
    section: L3AssemblySection,
    name: string,
    expectedMin: number,
    expectedMax: number,
  ) => {
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

  if (assembly.arch) checkWordCount(assembly.arch, 'Archaeologist', 800, 1000);
  if (assembly.algo) checkWordCount(assembly.algo, 'Algorithm', 800, 1000);
  if (assembly.hum) checkWordCount(assembly.hum, 'Human', 800, 1000);
  if (assembly.conv) checkWordCount(assembly.conv, 'Convergence', 1600, 2000);

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
