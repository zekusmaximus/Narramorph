import type {
  AwarenessLevel,
  ConditionContext,
  L3Assembly,
  L3AssemblySection,
  L3ContentSynthesisPattern,
  L3Variation,
  L3VariationFile,
  L3VariationMatchTier,
  L3VariationSet,
  SynthesisPattern,
} from '@/types';

export interface L3SectionSelection {
  arch: L3Variation;
  algo: L3Variation;
  hum: L3Variation;
  conv: L3Variation;
  matchTiers: Record<'arch' | 'algo' | 'hum' | 'conv', L3VariationMatchTier>;
  awarenessLevel: AwarenessLevel;
  synthesisPattern: SynthesisPattern;
}

export interface L3VariationSelection {
  variation: L3Variation;
  tier: L3VariationMatchTier;
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
  return (
    selectL3VariationWithTier(file, context, awarenessLevel, synthesisPattern)?.variation ?? null
  );
}

/** Selects L3 content and records the criterion that produced the match. */
export function selectL3VariationWithTier(
  file: L3VariationFile,
  context: ConditionContext,
  awarenessLevel: AwarenessLevel,
  synthesisPattern?: SynthesisPattern,
): L3VariationSelection | null {
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
      return { variation: synthesisMatch, tier: 'exact-synthesis' };
    }
  }

  const exactMatch = exactContext[0];
  if (exactMatch) {
    return { variation: exactMatch, tier: 'exact-context' };
  }

  const journeyAndPhilosophy = file.variations.find(
    (variation) =>
      variation.journeyPattern === context.journeyPattern &&
      variation.philosophyDominant === context.pathPhilosophy,
  );
  if (journeyAndPhilosophy) {
    return { variation: journeyAndPhilosophy, tier: 'journey-philosophy' };
  }

  const journeyMatch = file.variations.find(
    (variation) => variation.journeyPattern === context.journeyPattern,
  );
  if (journeyMatch) {
    return { variation: journeyMatch, tier: 'journey' };
  }

  const philosophyMatch = file.variations.find(
    (variation) => variation.philosophyDominant === context.pathPhilosophy,
  );

  if (philosophyMatch) {
    return { variation: philosophyMatch, tier: 'philosophy' };
  }

  const firstVariation = file.variations[0];
  return firstVariation ? { variation: firstVariation, tier: 'deterministic-any' } : null;
}

export function selectL3Sections(
  variations: L3VariationSet,
  context: ConditionContext,
  synthesisPattern: SynthesisPattern,
): L3SectionSelection | null {
  const awarenessLevel = getL3AwarenessLevel(context.awareness);
  const arch = selectL3VariationWithTier(variations.arch, context, awarenessLevel);
  const algo = selectL3VariationWithTier(variations.algo, context, awarenessLevel);
  const hum = selectL3VariationWithTier(variations.hum, context, awarenessLevel);
  const conv = selectL3VariationWithTier(
    variations.conv,
    context,
    awarenessLevel,
    synthesisPattern,
  );

  if (!arch || !algo || !hum || !conv) {
    return null;
  }

  return {
    arch: arch.variation,
    algo: algo.variation,
    hum: hum.variation,
    conv: conv.variation,
    matchTiers: {
      arch: arch.tier,
      algo: algo.tier,
      hum: hum.tier,
      conv: conv.tier,
    },
    awarenessLevel,
    synthesisPattern,
  };
}

function buildSection(
  character: L3AssemblySection['character'],
  variation: L3Variation,
  matchTier: L3VariationMatchTier,
): L3AssemblySection {
  return {
    character,
    variationId: variation.variationId,
    content: variation.content,
    wordCount: variation.metadata.wordCount,
    matchTier,
    metadata: variation.metadata,
  };
}

export function assembleL3Selection(
  selection: L3SectionSelection,
  context: ConditionContext,
): L3Assembly {
  const arch = buildSection('arch', selection.arch, selection.matchTiers.arch);
  const algo = buildSection('algo', selection.algo, selection.matchTiers.algo);
  const hum = buildSection('hum', selection.hum, selection.matchTiers.hum);
  const conv = buildSection('conv', selection.conv, selection.matchTiers.conv);

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
