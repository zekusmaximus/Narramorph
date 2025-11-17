import { describe, expect, it } from 'vitest';

import unlockConfig from '@/data/stories/eternal-return/unlock-config.json';
import type { TransformationState } from '@/types/Node';
import type { VisitRecord, UserProgress } from '@/types/Store';
import type { NodeUnlockConfig, UnlockCondition } from '@/types/Unlock';

import { evaluateNodeUnlock, evaluateUnlockCondition } from './unlockEvaluator';

type JourneyTracking = UserProgress['journeyTracking'];

type CharacterVisits = UserProgress['characterNodesVisited'];

const createVisitRecord = (
  visitCount: number,
  currentState: TransformationState = 'initial',
): VisitRecord => ({
  visitCount,
  visitTimestamps: Array.from(
    { length: visitCount },
    (_, index) => `2025-01-${String(index + 1).padStart(2, '0')}T00:00:00Z`,
  ),
  currentState,
  timeSpent: 0,
  lastVisited: '2025-01-01T00:00:00Z',
});

const defaultJourneyTracking: JourneyTracking = {
  startingCharacter: null,
  characterVisitPercentages: {
    archaeologist: 0,
    algorithm: 0,
    lastHuman: 0,
  },
  dominantCharacter: null,
  currentJourneyPattern: 'unknown',
  l2Choices: {
    accept: 0,
    resist: 0,
    invest: 0,
  },
  dominantPhilosophy: 'unknown',
  crossCharacterConnections: {
    arch_algo: 0,
    arch_hum: 0,
    algo_hum: 0,
  },
  navigationPattern: 'undetermined',
  lastCharacterVisited: null,
  revisitFrequency: 0,
  explorationMetrics: {
    breadth: 0,
    depth: 0,
  },
};

const defaultCharacterVisits: CharacterVisits = {
  archaeologist: 0,
  algorithm: 0,
  lastHuman: 0,
};

const createProgress = (overrides: Partial<UserProgress> = {}): UserProgress => ({
  visitedNodes: {},
  readingPath: [],
  unlockedConnections: [],
  specialTransformations: [],
  totalTimeSpent: 0,
  lastActiveTimestamp: '2025-01-01T00:00:00Z',
  temporalAwarenessLevel: 0,
  characterNodesVisited: { ...defaultCharacterVisits },
  journeyTracking: { ...defaultJourneyTracking },
  unlockedL2Characters: [],
  l3AssembliesViewed: [],
  l3ConvergenceTriggered: false,
  lockedNodes: [],
  ...overrides,
});

describe('evaluateVisitCountCondition', () => {
  it('respects unique node totals via totalVisits', () => {
    const condition: UnlockCondition = {
      id: 'unique-total',
      type: 'visitCount',
      params: { totalVisits: 2 },
      description: 'Requires two unique nodes',
    };

    const progress = createProgress({
      visitedNodes: {
        'arch-L1': createVisitRecord(3),
        'algo-L2': createVisitRecord(1),
      },
    });

    expect(evaluateUnlockCondition(condition, progress)).toBe(true);

    const harderCondition: UnlockCondition = {
      ...condition,
      params: { totalVisits: 3 },
    };

    expect(evaluateUnlockCondition(harderCondition, progress)).toBe(false);
  });

  it('aggregates repeated visits via minTotalVisits', () => {
    const condition: UnlockCondition = {
      id: 'aggregate-total',
      type: 'visitCount',
      params: { minTotalVisits: 7 },
      description: 'Requires seven total visits including revisits',
    };

    const progress = createProgress({
      visitedNodes: {
        'arch-L1': createVisitRecord(3),
        'algo-L1': createVisitRecord(4),
      },
    });

    expect(evaluateUnlockCondition(condition, progress)).toBe(true);

    const stricterCondition: UnlockCondition = {
      ...condition,
      params: { minTotalVisits: 8 },
    };

    expect(evaluateUnlockCondition(stricterCondition, progress)).toBe(false);
  });
});

describe('Layer 3 unlock configuration', () => {
  it('unlocks when thorough exploration and other gates are met', () => {
    const config = unlockConfig.nodes.find((node) => node.nodeId === 'arch-L3') as
      | NodeUnlockConfig
      | undefined;

    if (!config) {
      throw new Error('arch-L3 unlock config missing');
    }

    const progress = createProgress({
      visitedNodes: {
        'arch-L1': createVisitRecord(2),
        'algo-L1': createVisitRecord(2),
        'hum-L1': createVisitRecord(2),
        'arch-L2-accept': createVisitRecord(3, 'metaAware'),
        'arch-L2-resist': createVisitRecord(1),
        'algo-L2-accept': createVisitRecord(2, 'metaAware'),
        'algo-L2-resist': createVisitRecord(1),
        'hum-L2-accept': createVisitRecord(1),
        'hum-L2-resist': createVisitRecord(1),
      },
      temporalAwarenessLevel: 60,
      journeyTracking: {
        ...defaultJourneyTracking,
        characterVisitPercentages: {
          archaeologist: 34,
          algorithm: 33,
          lastHuman: 33,
        },
        dominantCharacter: 'archaeologist',
        dominantPhilosophy: 'mixed',
        l2Choices: {
          accept: 2,
          resist: 2,
          invest: 2,
        },
      },
    });

    expect(evaluateNodeUnlock(config, progress)).toBe(true);
  });
});
