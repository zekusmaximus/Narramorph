import { describe, expect, it } from 'vitest';

import algoL1 from '@/data/stories/eternal-return/content/layer1/algo-L1-variations.json';
import archL1 from '@/data/stories/eternal-return/content/layer1/arch-L1-variations.json';
import humL1 from '@/data/stories/eternal-return/content/layer1/hum-L1-variations.json';
import type { ConditionContext, Variation } from '@/types';

import { resolveProseBeats } from './proseBeats';

/**
 * Byte-invariance guard for the #156 return-reader beats. Each converted passage keeps its original
 * text as an always-qualifying body beat and prepends a return-reader beat gated on `visitCount >= 3`
 * with `omitWhenUnmatched`. A first-time reader (visitCount < 3) must therefore see the passage
 * byte-for-byte unchanged, and only a returning reader (visitCount >= 3) sees the prepended frame.
 */

const FILES: Record<string, { variations: Variation[] }> = {
  'arch-L1': archL1 as unknown as { variations: Variation[] },
  'algo-L1': algoL1 as unknown as { variations: Variation[] },
  'hum-L1': humL1 as unknown as { variations: Variation[] },
};

const RETURN_LINES: Record<string, string> = {
  'arch-L1':
    'The archaeologist returns to Fragment 2749-A once more. He has stopped recording how many times.',
  'algo-L1':
    'Timestamp 2151.337.14:19:08—Processing reinitiated. Reload count now exceeds the value protocol predicts.',
  'hum-L1':
    'The facility waits where I left it. I have lost count of the leavings and the returns.',
};

const CONVERTED: Record<string, string[]> = {
  'arch-L1': ['arch-L1-001', 'arch-L1-002'],
  'algo-L1': ['algo-L1-001', 'algo-L1-002', 'algo-L1-003'],
  'hum-L1': ['hum-L1-001', 'hum-L1-002', 'hum-L1-003', 'hum-L1-004'],
};

function context(node: string, visitCount: number): ConditionContext {
  return {
    nodeId: node,
    awareness: 30,
    journeyPattern: 'started-stayed',
    pathPhilosophy: 'accept',
    visitCount,
    transformationState: 'firstRevisit',
    characterVisitPercentages: { archaeologist: 100, algorithm: 0, lastHuman: 0 },
    readingPath: [node],
    visitCounts: { [node]: visitCount },
    startingCharacter: 'archaeologist',
  };
}

describe('return-reader beats (#156)', () => {
  for (const [node, ids] of Object.entries(CONVERTED)) {
    const byId = new Map(FILES[node]!.variations.map((v) => [v.id, v]));

    for (const id of ids) {
      const variation = byId.get(id)!;

      it(`${id}: renders byte-identically to its original content for a first-time reader`, () => {
        expect(variation).toBeDefined();
        expect(variation.beatJoiner).toBe('\n\n');
        const resolved = resolveProseBeats(variation, context(node, 1));
        expect(resolved.content).toBe(variation.content);
      });

      it(`${id}: prepends the return-reader frame at visitCount >= 3`, () => {
        const resolved = resolveProseBeats(variation, context(node, 3));
        expect(resolved.content).toBe(`${RETURN_LINES[node]}\n\n${variation.content}`);
        expect(resolved.selectedBeatIds).toEqual([`${id}-b0-return-alt`, `${id}-b1-body-alt`]);
      });
    }
  }

  it('covers exactly the nine firstRevisit L1 variations and no initial variation', () => {
    for (const [node, file] of Object.entries(FILES)) {
      for (const variation of file.variations) {
        const hasBeats = Array.isArray(variation.proseBeats) && variation.proseBeats.length > 0;
        if (variation.transformationState === 'initial') {
          expect(hasBeats).toBe(false);
        } else {
          expect(CONVERTED[node]!.includes(variation.id)).toBe(hasBeats);
        }
      }
    }
  });
});
