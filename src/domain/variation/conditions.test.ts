import { describe, expect, it } from 'vitest';

import type { ConditionContext, JourneyConditionExpression } from '@/types';

import { evaluateJourneyCondition } from './conditions';

const context: ConditionContext = {
  nodeId: 'hum-L2-accept',
  awareness: 58,
  journeyPattern: 'started-bounced',
  pathPhilosophy: 'accept',
  visitCount: 2,
  transformationState: 'firstRevisit',
  characterVisitPercentages: { archaeologist: 50, algorithm: 25, lastHuman: 25 },
  readingPath: ['arch-L1', 'algo-L1', 'arch-L2-accept', 'hum-L1', 'hum-L2-accept'],
  visitCounts: {
    'arch-L1': 1,
    'algo-L1': 1,
    'arch-L2-accept': 2,
    'hum-L1': 1,
    'hum-L2-accept': 2,
  },
  startingCharacter: 'archaeologist',
};

describe('evaluateJourneyCondition', () => {
  it.each<[string, JourneyConditionExpression]>([
    ['history start', { kind: 'historyStartsWith', passageIds: ['arch-L1', 'algo-L1'] }],
    ['history end', { kind: 'historyEndsWith', passageIds: ['hum-L1', 'hum-L2-accept'] }],
    ['relative order', { kind: 'orderSeen', passageIds: ['arch-L1', 'arch-L2-accept', 'hum-L1'] }],
    [
      'immediate adjacency',
      {
        kind: 'visitedImmediatelyAfter',
        beforePassageId: 'hum-L1',
        afterPassageId: 'hum-L2-accept',
      },
    ],
    ['recency', { kind: 'withinSteps', passageId: 'arch-L2-accept', steps: 2 }],
    [
      'visit count',
      { kind: 'visitCount', passageId: 'hum-L2-accept', comparison: 'gte', value: 2 },
    ],
    [
      'visit count across passages',
      {
        kind: 'visitedCountAcross',
        passageIds: ['arch-L2-accept', 'hum-L2-accept'],
        comparison: 'eq',
        value: 4,
      },
    ],
  ])('supports %s', (_label, condition) => {
    expect(evaluateJourneyCondition(condition, context).matched).toBe(true);
  });

  it('composes all, any, and not deterministically', () => {
    const visitedHuman: JourneyConditionExpression = {
      kind: 'visitCount',
      passageId: 'hum-L1',
      comparison: 'gte',
      value: 1,
    };
    const missingEnding: JourneyConditionExpression = {
      kind: 'visitCount',
      passageId: 'final-release',
      comparison: 'gte',
      value: 1,
    };

    expect(
      evaluateJourneyCondition(
        {
          kind: 'all',
          conditions: [
            visitedHuman,
            { kind: 'any', conditions: [missingEnding, { kind: 'not', condition: missingEnding }] },
          ],
        },
        context,
      ).matched,
    ).toBe(true);
  });

  it('preserves boolean algebra across every two-condition truth combination', () => {
    for (const leftCount of [0, 1]) {
      for (const rightCount of [0, 1]) {
        const propertyContext = {
          ...context,
          visitCounts: { left: leftCount, right: rightCount },
        };
        const left: JourneyConditionExpression = {
          kind: 'visitCount',
          passageId: 'left',
          comparison: 'gte',
          value: 1,
        };
        const right: JourneyConditionExpression = {
          kind: 'visitCount',
          passageId: 'right',
          comparison: 'gte',
          value: 1,
        };
        const notEither = evaluateJourneyCondition(
          { kind: 'not', condition: { kind: 'any', conditions: [left, right] } },
          propertyContext,
        ).matched;
        const neither = evaluateJourneyCondition(
          {
            kind: 'all',
            conditions: [
              { kind: 'not', condition: left },
              { kind: 'not', condition: right },
            ],
          },
          propertyContext,
        ).matched;
        expect(notEither).toBe(neither);
      }
    }
  });

  it('matches relative order for every permutation of three distinct passages', () => {
    const histories = [
      ['a', 'b', 'c'],
      ['a', 'c', 'b'],
      ['b', 'a', 'c'],
      ['b', 'c', 'a'],
      ['c', 'a', 'b'],
      ['c', 'b', 'a'],
    ];

    for (const readingPath of histories) {
      expect(
        evaluateJourneyCondition(
          { kind: 'orderSeen', passageIds: ['a', 'c'] },
          { ...context, readingPath },
        ).matched,
      ).toBe(readingPath.indexOf('a') < readingPath.indexOf('c'));
    }
  });

  it('handles repeated passages by occurrence and uses the latest visit for recency', () => {
    const repeated = {
      ...context,
      readingPath: ['arch-L1', 'algo-L1', 'arch-L1', 'hum-L1'],
    };

    expect(
      evaluateJourneyCondition(
        { kind: 'orderSeen', passageIds: ['arch-L1', 'algo-L1', 'arch-L1'] },
        repeated,
      ).matched,
    ).toBe(true);
    expect(
      evaluateJourneyCondition({ kind: 'withinSteps', passageId: 'arch-L1', steps: 1 }, repeated)
        .matched,
    ).toBe(true);
  });

  it('fails closed for empty operands, duplicate sums, and negative recency', () => {
    const invalid: JourneyConditionExpression[] = [
      { kind: 'all', conditions: [] },
      { kind: 'any', conditions: [] },
      { kind: 'historyStartsWith', passageIds: [] },
      { kind: 'withinSteps', passageId: 'arch-L1', steps: -1 },
      {
        kind: 'visitedCountAcross',
        passageIds: ['arch-L1', 'arch-L1'],
        comparison: 'gte',
        value: 1,
      },
    ];

    expect(
      invalid.map((condition) => evaluateJourneyCondition(condition, context).matched),
    ).toEqual(invalid.map(() => false));
  });
});
