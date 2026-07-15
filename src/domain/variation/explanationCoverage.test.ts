import { describe, expect, it, vi } from 'vitest';

import { assembleL3Selection, selectL3Sections } from '@/domain/l3/assembly';
import type {
  AwarenessLevel,
  ConditionContext,
  JourneyCharacter,
  JourneyPattern,
  L3Assembly,
  L3VariationMatchTier,
  PathPhilosophy,
  SynthesisPattern,
  Variation,
} from '@/types';
import { findMatchingVariation, findMatchingVariationWithReason } from '@/utils/conditionEvaluator';
import { loadStoryContent } from '@/utils/contentLoader';
import { loadL3Variations, loadVariationFile } from '@/utils/variationLoader';

import { auditSelectionReason } from './explanationAudit';
import {
  compileEndingSelectionReason,
  compileL3SelectionReason,
  compileVariationSelectionReason,
  renderSelectionReason,
} from './selectionReason';

const L1_L2_GROUPS = [
  'arch-L1',
  'algo-L1',
  'hum-L1',
  ...['arch', 'algo', 'hum'].flatMap((character) =>
    ['accept', 'resist', 'invest'].map((philosophy) => `${character}-L2-${philosophy}`),
  ),
];
const ENDING_IDS = ['final-preserve', 'final-transform', 'final-release'] as const;
const JOURNEYS: Exclude<JourneyPattern, 'unknown'>[] = [
  'started-stayed',
  'started-bounced',
  'shifted-dominant',
  'began-lightly',
  'met-later',
];
const PHILOSOPHIES: Exclude<PathPhilosophy, 'mixed' | 'unknown'>[] = ['accept', 'resist', 'invest'];
const AWARENESS: Record<AwarenessLevel, number> = { low: 10, medium: 50, high: 80 };
const PERCENTAGES: Record<SynthesisPattern, ConditionContext['characterVisitPercentages']> = {
  'single-dominant': { archaeologist: 70, algorithm: 20, lastHuman: 10 },
  'balanced-dual': { archaeologist: 48, algorithm: 47, lastHuman: 5 },
  'true-triad': { archaeologist: 34, algorithm: 33, lastHuman: 33 },
};

function characterForNode(nodeId: string): JourneyCharacter {
  if (nodeId.startsWith('algo')) {
    return 'algorithm';
  }
  if (nodeId.startsWith('hum')) {
    return 'lastHuman';
  }
  return 'archaeologist';
}

function contextForVariation(nodeId: string, variation: Variation): ConditionContext {
  const [minimum, maximum] = variation.metadata.awarenessRange;
  const visitCount = variation.transformationState === 'initial' ? 1 : 2;
  return {
    nodeId,
    awareness: Math.round((minimum + maximum) / 2),
    journeyPattern: variation.metadata.journeyPattern,
    pathPhilosophy: variation.metadata.philosophyDominant,
    visitCount,
    transformationState: variation.transformationState,
    characterVisitPercentages: PERCENTAGES['true-triad'],
    readingPath: visitCount === 1 ? [nodeId] : [nodeId, 'another-passage', nodeId],
    visitCounts: { [nodeId]: visitCount },
    startingCharacter: characterForNode(nodeId),
  };
}

function l3Context(
  journeyPattern: JourneyPattern,
  pathPhilosophy: PathPhilosophy,
  awarenessLevel: AwarenessLevel,
  synthesisPattern: SynthesisPattern,
): ConditionContext {
  return {
    nodeId: 'arch-L3',
    awareness: AWARENESS[awarenessLevel],
    journeyPattern,
    pathPhilosophy,
    visitCount: 1,
    transformationState: 'initial',
    characterVisitPercentages: PERCENTAGES[synthesisPattern],
    readingPath: ['arch-L1', 'algo-L1', 'hum-L1', 'arch-L3'],
    visitCounts: { 'arch-L1': 1, 'algo-L1': 1, 'hum-L1': 1, 'arch-L3': 1 },
    startingCharacter: 'archaeologist',
  };
}

describe('repository-wide explanation coverage', () => {
  it('audits every authored L1/L2 group without changing deterministic selection', async () => {
    const debugLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const story = await loadStoryContent('eternal-return');
    const endingTitles = story.nodes
      .filter((node) => ENDING_IDS.includes(node.id as (typeof ENDING_IDS)[number]))
      .map((node) => node.title);
    let auditedSelections = 0;

    for (const nodeId of L1_L2_GROUPS) {
      const file = await loadVariationFile('eternal-return', nodeId);
      expect(file?.variations.length, nodeId).toBeGreaterThan(0);

      for (const variation of file?.variations ?? []) {
        const context = contextForVariation(nodeId, variation);
        const reason = compileVariationSelectionReason(variation, context, 'strict');
        expect(auditSelectionReason(reason, { forbiddenTerms: endingTitles })).toEqual([]);
        auditedSelections += 1;
      }

      const representative = file?.variations[0];
      expect(representative).toBeDefined();
      if (!representative) {
        continue;
      }
      const context = contextForVariation(nodeId, representative);
      const beforeExplanation = findMatchingVariationWithReason(file.variations, context);
      expect(beforeExplanation, nodeId).not.toBeNull();
      if (!beforeExplanation) {
        continue;
      }
      const legacySelection = findMatchingVariation(file.variations, context);
      renderSelectionReason(
        compileVariationSelectionReason(
          beforeExplanation.variation,
          context,
          beforeExplanation.tier,
        ),
      );
      const afterExplanation = findMatchingVariationWithReason(file.variations, context);

      expect(afterExplanation).toEqual(beforeExplanation);
      expect(legacySelection?.variationId).toBe(beforeExplanation.variation.variationId);
    }

    expect(L1_L2_GROUPS).toHaveLength(12);
    expect(auditedSelections).toBeGreaterThan(100);
    debugLog.mockRestore();
  });

  it('audits every authored L3 variation through its exact assembly criteria', async () => {
    const variations = await loadL3Variations('eternal-return');
    const validTiers: L3VariationMatchTier[] = [
      'exact-synthesis',
      'exact-context',
      'journey-philosophy',
      'journey',
      'philosophy',
      'deterministic-any',
    ];
    const seen = {
      arch: new Set<string>(),
      algo: new Set<string>(),
      hum: new Set<string>(),
      conv: new Set<string>(),
    };

    for (const [key, file] of Object.entries(variations) as [
      keyof typeof variations,
      (typeof variations)[keyof typeof variations],
    ][]) {
      for (const variation of file.variations) {
        const assembly = {
          metadata: {
            journeyPattern: variation.journeyPattern,
            pathPhilosophy: variation.philosophyDominant,
            awarenessLevel: variation.awarenessLevel,
            synthesisPattern: 'true-triad',
          },
        } as L3Assembly;
        const tier =
          key === 'conv' && variation.metadata.synthesisPattern
            ? 'exact-synthesis'
            : 'exact-context';

        expect(
          auditSelectionReason(compileL3SelectionReason(assembly, `${key} perspective`, tier)),
          variation.variationId,
        ).toEqual([]);
      }
    }

    for (const journey of JOURNEYS) {
      for (const philosophy of PHILOSOPHIES) {
        for (const awareness of ['low', 'medium', 'high'] as const) {
          for (const synthesis of ['single-dominant', 'balanced-dual', 'true-triad'] as const) {
            const context = l3Context(journey, philosophy, awareness, synthesis);
            const first = selectL3Sections(variations, context, synthesis);
            const second = selectL3Sections(variations, context, synthesis);
            expect(first).not.toBeNull();
            expect(second).toEqual(first);
            if (!first) {
              continue;
            }

            const assembly = assembleL3Selection(first, context);
            for (const [key, label] of [
              ['arch', 'Archaeologist Perspective'],
              ['algo', 'Algorithm Perspective'],
              ['hum', 'Last Human Perspective'],
              ['conv', 'Convergence'],
            ] as const) {
              const section = assembly[key];
              seen[key].add(section.variationId);
              const reason = compileL3SelectionReason(assembly, label, section.matchTier);
              expect(auditSelectionReason(reason)).toEqual([]);
              expect(validTiers).toContain(section.matchTier);
            }
          }
        }
      }
    }

    expect({
      arch: variations.arch.variations.length,
      algo: variations.algo.variations.length,
      hum: variations.hum.variations.length,
      conv: variations.conv.variations.length,
    }).toEqual({ arch: 45, algo: 45, hum: 45, conv: 135 });
    expect(Object.values(seen).every((group) => group.size > 0)).toBe(true);
  });

  it('audits all ending titles and fixed outcomes without leaking alternate endings', async () => {
    const story = await loadStoryContent('eternal-return');
    const endingNodes = story.nodes.filter((node) =>
      ENDING_IDS.includes(node.id as (typeof ENDING_IDS)[number]),
    );

    expect(endingNodes).toHaveLength(3);
    for (const node of endingNodes) {
      const ending = await loadVariationFile('eternal-return', node.id);
      const reason = compileEndingSelectionReason(node.title);
      const alternateTitles = endingNodes
        .filter((candidate) => candidate.id !== node.id)
        .map((candidate) => candidate.title);

      expect(ending?.variations).toHaveLength(1);
      expect(auditSelectionReason(reason, { forbiddenTerms: alternateTitles })).toEqual([]);
      expect(reason).toMatchObject({ selectionKind: 'ending', outcome: 'fixed' });
    }
  });
});
