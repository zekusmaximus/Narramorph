import type {
  AwarenessLevel,
  ConditionContext,
  L3Assembly,
  L3AssemblySection,
  L3ContentSynthesisPattern,
  L3Variation,
  L3VariationFile,
  L3VariationSet,
  SynthesisPattern,
} from '@/types';

export interface L3SectionSelection {
  arch: L3Variation;
  algo: L3Variation;
  hum: L3Variation;
  conv: L3Variation;
  awarenessLevel: AwarenessLevel;
  synthesisPattern: SynthesisPattern;
}

export function getL3AwarenessLevel(awareness: number): AwarenessLevel {
  if (awareness < 35) {
    return 'low';
  }
  if (awareness < 70) {
    return 'medium';
  }
  return 'high';
}

export function toContentSynthesisPattern(
  synthesisPattern: SynthesisPattern,
): L3ContentSynthesisPattern {
  if (synthesisPattern === 'balanced-dual') {
    return 'dual-balanced';
  }
  if (synthesisPattern === 'true-triad') {
    return 'triple-balanced';
  }
  return synthesisPattern;
}

/**
 * Select an L3 variation using the dimensions encoded by the aggregate files.
 * The ordered fallbacks preserve a deterministic result when legacy content
 * has an incomplete combination.
 */
export function selectL3Variation(
  file: L3VariationFile,
  context: ConditionContext,
  awarenessLevel: AwarenessLevel,
  synthesisPattern?: SynthesisPattern,
): L3Variation | null {
  const exactContext = file.variations.filter(
    (variation) =>
      variation.journeyPattern === context.journeyPattern &&
      variation.philosophyDominant === context.pathPhilosophy &&
      variation.awarenessLevel === awarenessLevel,
  );

  if (synthesisPattern) {
    const contentPattern = toContentSynthesisPattern(synthesisPattern);
    const synthesisMatch = exactContext.find(
      (variation) => variation.metadata.synthesisPattern === contentPattern,
    );
    if (synthesisMatch) {
      return synthesisMatch;
    }
  }

  const exactMatch = exactContext[0];
  if (exactMatch) {
    return exactMatch;
  }

  const journeyAndPhilosophy = file.variations.find(
    (variation) =>
      variation.journeyPattern === context.journeyPattern &&
      variation.philosophyDominant === context.pathPhilosophy,
  );
  if (journeyAndPhilosophy) {
    return journeyAndPhilosophy;
  }

  const journeyMatch = file.variations.find(
    (variation) => variation.journeyPattern === context.journeyPattern,
  );
  if (journeyMatch) {
    return journeyMatch;
  }

  const philosophyMatch = file.variations.find(
    (variation) => variation.philosophyDominant === context.pathPhilosophy,
  );

  return philosophyMatch ?? file.variations[0] ?? null;
}

export function selectL3Sections(
  variations: L3VariationSet,
  context: ConditionContext,
  synthesisPattern: SynthesisPattern,
): L3SectionSelection | null {
  const awarenessLevel = getL3AwarenessLevel(context.awareness);
  const arch = selectL3Variation(variations.arch, context, awarenessLevel);
  const algo = selectL3Variation(variations.algo, context, awarenessLevel);
  const hum = selectL3Variation(variations.hum, context, awarenessLevel);
  const conv = selectL3Variation(variations.conv, context, awarenessLevel, synthesisPattern);

  if (!arch || !algo || !hum || !conv) {
    return null;
  }

  return {
    arch,
    algo,
    hum,
    conv,
    awarenessLevel,
    synthesisPattern,
  };
}

function buildSection(
  character: L3AssemblySection['character'],
  variation: L3Variation,
): L3AssemblySection {
  return {
    character,
    variationId: variation.variationId,
    content: variation.content,
    wordCount: variation.metadata.wordCount,
    metadata: variation.metadata,
  };
}

export function assembleL3Selection(
  selection: L3SectionSelection,
  context: ConditionContext,
): L3Assembly {
  const arch = buildSection('arch', selection.arch);
  const algo = buildSection('algo', selection.algo);
  const hum = buildSection('hum', selection.hum);
  const conv = buildSection('conv', selection.conv);

  return {
    arch,
    algo,
    hum,
    conv,
    totalWordCount: arch.wordCount + algo.wordCount + hum.wordCount + conv.wordCount,
    metadata: {
      journeyPattern: context.journeyPattern,
      pathPhilosophy: context.pathPhilosophy,
      awarenessLevel: selection.awarenessLevel,
      synthesisPattern: selection.synthesisPattern,
      convergenceAlignment: conv.metadata.convergenceAlignment,
    },
  };
}
