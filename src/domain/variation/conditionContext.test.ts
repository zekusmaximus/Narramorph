import { describe, expect, it } from 'vitest';

import { createInitialProgress } from '@/domain/progress/progressModel';

import { buildConditionContext } from './conditionContext';

describe('buildConditionContext', () => {
  it('builds the default context when no node is selected', () => {
    const progress = createInitialProgress('2026-07-12T12:00:00.000Z');
    progress.temporalAwarenessLevel = 35;
    progress.journeyTracking.currentJourneyPattern = 'started-bounced';
    progress.journeyTracking.dominantPhilosophy = 'mixed';
    progress.journeyTracking.characterVisitPercentages = {
      archaeologist: 50,
      algorithm: 30,
      lastHuman: 20,
    };

    expect(buildConditionContext(progress)).toEqual({
      nodeId: '',
      awareness: 35,
      journeyPattern: 'started-bounced',
      pathPhilosophy: 'mixed',
      visitCount: 0,
      transformationState: 'initial',
      characterVisitPercentages: {
        archaeologist: 50,
        algorithm: 30,
        lastHuman: 20,
      },
    });
  });

  it('includes node-specific visit and transformation state', () => {
    const progress = createInitialProgress('2026-07-12T12:00:00.000Z');
    progress.visitedNodes['arch-L1'] = {
      visitCount: 2,
      visitTimestamps: ['2026-07-12T12:00:00.000Z'],
      currentState: 'firstRevisit',
      timeSpent: 120,
      lastVisited: '2026-07-12T12:00:00.000Z',
      recentVariationIds: ['arch-L1-001'],
    };

    expect(buildConditionContext(progress, 'arch-L1')).toMatchObject({
      nodeId: 'arch-L1',
      visitCount: 2,
      transformationState: 'firstRevisit',
    });
  });

  it('keeps variation history opt-in for de-duplication callers', () => {
    const progress = createInitialProgress('2026-07-12T12:00:00.000Z');
    const recentVariationIds = ['arch-L1-001', 'arch-L1-002'];
    progress.visitedNodes['arch-L1'] = {
      visitCount: 2,
      visitTimestamps: ['2026-07-12T12:00:00.000Z'],
      currentState: 'firstRevisit',
      timeSpent: 120,
      lastVisited: '2026-07-12T12:00:00.000Z',
      recentVariationIds,
    };

    expect(buildConditionContext(progress, 'arch-L1')).not.toHaveProperty('recentVariationIds');
    expect(
      buildConditionContext(progress, 'arch-L1', { includeRecentVariations: true })
        .recentVariationIds,
    ).toBe(recentVariationIds);
  });

  it('uses node defaults when the requested node has not been visited', () => {
    const progress = createInitialProgress('2026-07-12T12:00:00.000Z');

    expect(buildConditionContext(progress, 'algo-L2-resist')).toMatchObject({
      nodeId: 'algo-L2-resist',
      visitCount: 0,
      transformationState: 'initial',
    });
  });
});
