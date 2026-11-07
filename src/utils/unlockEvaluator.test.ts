import { afterEach, describe, expect, it, vi } from 'vitest';

import unlockConfig from '@/data/stories/eternal-return/unlock-config.json';
import type { TransformationState } from '@/types/Node';
import type { L3AssemblyViewRecord, VisitRecord, UserProgress } from '@/types/Store';
import type {
  NodeUnlockConfig,
  UnlockCondition,
  UnlockConditionParams,
  UnlockConditionType,
} from '@/types/Unlock';

import {
  evaluateNodeUnlock,
  evaluateUnlockCondition,
  generateActionableHint,
  getUnlockProgress,
} from './unlockEvaluator';

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
  selectionRecords: [],
  visitEvents: [],
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

const condition = (
  type: UnlockConditionType,
  params: UnlockConditionParams,
  extra: Partial<UnlockCondition> = {},
): UnlockCondition => ({
  id: `${type}-condition`,
  type,
  params,
  description: `${type} description`,
  ...extra,
});

const withTracking = (
  tracking: Partial<JourneyTracking>,
  overrides: Partial<UserProgress> = {},
): UserProgress =>
  createProgress({
    journeyTracking: { ...defaultJourneyTracking, ...tracking },
    ...overrides,
  });

const assemblyView = (
  sectionsRead: L3AssemblyViewRecord['sectionsRead'],
): L3AssemblyViewRecord => ({
  viewedAt: '2025-01-01T00:00:00Z',
  journeyPattern: 'unknown',
  pathPhilosophy: 'accept',
  synthesisPattern: 'single-dominant',
  awarenessLevel: 'low',
  sectionsRead,
});

const allSectionsRead = { arch: true, algo: true, hum: true, conv: true };

afterEach(() => {
  vi.restoreAllMocks();
});

describe('evaluateUnlockCondition dispatch', () => {
  it('rejects an unknown condition type with a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const unknown = condition('mystery' as UnlockConditionType, {});

    expect(evaluateUnlockCondition(unknown, createProgress())).toBe(false);
    expect(warn).toHaveBeenCalledWith('[UnlockEval] Unknown condition type:', 'mystery');
  });

  it('treats a visit-count condition without requirements as satisfied', () => {
    expect(evaluateUnlockCondition(condition('visitCount', {}), createProgress())).toBe(true);
  });
});

describe('visit-count conditions', () => {
  it('requires each listed node to reach its minimum visit count', () => {
    const nodeVisits = condition('visitCount', { nodeVisits: { 'arch-L1': 2, 'algo-L1': 1 } });

    expect(
      evaluateUnlockCondition(
        nodeVisits,
        createProgress({ visitedNodes: { 'arch-L1': createVisitRecord(2) } }),
      ),
    ).toBe(false);
    expect(
      evaluateUnlockCondition(
        nodeVisits,
        createProgress({
          visitedNodes: { 'arch-L1': createVisitRecord(1), 'algo-L1': createVisitRecord(1) },
        }),
      ),
    ).toBe(false);
    expect(
      evaluateUnlockCondition(
        nodeVisits,
        createProgress({
          visitedNodes: { 'arch-L1': createVisitRecord(2), 'algo-L1': createVisitRecord(1) },
        }),
      ),
    ).toBe(true);
  });

  it('requires per-character visit minimums and treats unknown characters as unvisited', () => {
    const progress = createProgress({
      characterNodesVisited: { archaeologist: 3, algorithm: 1, lastHuman: 0 },
    });

    expect(
      evaluateUnlockCondition(
        condition('visitCount', { characterVisits: { archaeologist: 3, algorithm: 1 } }),
        progress,
      ),
    ).toBe(true);
    expect(
      evaluateUnlockCondition(
        condition('visitCount', { characterVisits: { algorithm: 2 } }),
        progress,
      ),
    ).toBe(false);
    expect(
      evaluateUnlockCondition(
        condition('visitCount', { characterVisits: { chronicler: 1 } }),
        progress,
      ),
    ).toBe(false);
  });

  it('counts unique visited nodes per layer', () => {
    const progress = createProgress({
      visitedNodes: {
        'arch-L1': createVisitRecord(4),
        'arch-L2-accept': createVisitRecord(1),
        'algo-L2-resist': createVisitRecord(1),
      },
    });

    expect(
      evaluateUnlockCondition(condition('visitCount', { layerVisits: { 1: 1, 2: 2 } }), progress),
    ).toBe(true);
    expect(
      evaluateUnlockCondition(condition('visitCount', { layerVisits: { 2: 3 } }), progress),
    ).toBe(false);
  });

  it('counts a missing visit count as zero when aggregating revisits', () => {
    const record = { ...createVisitRecord(1), visitCount: undefined } as unknown as VisitRecord;
    const progress = createProgress({ visitedNodes: { 'arch-L1': record } });

    expect(evaluateUnlockCondition(condition('visitCount', { minTotalVisits: 1 }), progress)).toBe(
      false,
    );
  });
});

describe('awareness conditions', () => {
  const bounded = condition('awareness', { minAwareness: 30, maxAwareness: 70 });

  it('accepts awareness inside the inclusive bounds', () => {
    expect(evaluateUnlockCondition(bounded, createProgress({ temporalAwarenessLevel: 30 }))).toBe(
      true,
    );
    expect(evaluateUnlockCondition(bounded, createProgress({ temporalAwarenessLevel: 70 }))).toBe(
      true,
    );
  });

  it('rejects awareness below the minimum or above the maximum', () => {
    expect(evaluateUnlockCondition(bounded, createProgress({ temporalAwarenessLevel: 29 }))).toBe(
      false,
    );
    expect(evaluateUnlockCondition(bounded, createProgress({ temporalAwarenessLevel: 71 }))).toBe(
      false,
    );
  });

  it('treats missing awareness as zero', () => {
    const progress = createProgress({
      temporalAwarenessLevel: undefined as unknown as number,
    });

    expect(evaluateUnlockCondition(condition('awareness', { maxAwareness: 0 }), progress)).toBe(
      true,
    );
    expect(evaluateUnlockCondition(condition('awareness', { minAwareness: 1 }), progress)).toBe(
      false,
    );
  });
});

describe('philosophy conditions', () => {
  it('matches a single required philosophy or any of a list', () => {
    const progress = withTracking({ dominantPhilosophy: 'resist' });

    expect(
      evaluateUnlockCondition(condition('philosophy', { requiredPhilosophy: 'resist' }), progress),
    ).toBe(true);
    expect(
      evaluateUnlockCondition(condition('philosophy', { requiredPhilosophy: 'accept' }), progress),
    ).toBe(false);
    expect(
      evaluateUnlockCondition(
        condition('philosophy', { requiredPhilosophy: ['accept', 'resist'] }),
        progress,
      ),
    ).toBe(true);
    expect(
      evaluateUnlockCondition(
        condition('philosophy', { requiredPhilosophy: ['accept', 'invest'] }),
        progress,
      ),
    ).toBe(false);
  });

  it('sums L2 choices for a minimum choice count', () => {
    const progress = withTracking({ l2Choices: { accept: 1, resist: 1, invest: 1 } });

    expect(
      evaluateUnlockCondition(condition('philosophy', { minPhilosophyCount: 3 }), progress),
    ).toBe(true);
    expect(
      evaluateUnlockCondition(condition('philosophy', { minPhilosophyCount: 4 }), progress),
    ).toBe(false);
  });

  it('treats missing L2 choices as zero choices and skips distribution checks', () => {
    const progress = withTracking({
      l2Choices: undefined,
    });

    expect(
      evaluateUnlockCondition(condition('philosophy', { minPhilosophyCount: 1 }), progress),
    ).toBe(false);
    expect(
      evaluateUnlockCondition(
        condition('philosophy', { philosophyDistribution: { accept: 5 } }),
        progress,
      ),
    ).toBe(true);
  });

  it('requires each listed philosophy to reach its distribution minimum', () => {
    const progress = withTracking({ l2Choices: { accept: 2, resist: 1, invest: 0 } });
    const distribution = (
      philosophyDistribution: UnlockConditionParams['philosophyDistribution'],
    ) => evaluateUnlockCondition(condition('philosophy', { philosophyDistribution }), progress);

    expect(distribution({ accept: 2, resist: 1, invest: 0 })).toBe(true);
    expect(distribution({ accept: 3 })).toBe(false);
    expect(distribution({ resist: 2 })).toBe(false);
    expect(distribution({ invest: 1 })).toBe(false);
  });

  it('treats an absent per-philosophy count as zero', () => {
    const progress = withTracking({
      l2Choices: { accept: 1 } as unknown as JourneyTracking['l2Choices'],
    });

    expect(
      evaluateUnlockCondition(
        condition('philosophy', { philosophyDistribution: { resist: 1 } }),
        progress,
      ),
    ).toBe(false);
    expect(
      evaluateUnlockCondition(
        condition('philosophy', { philosophyDistribution: { invest: 1 } }),
        progress,
      ),
    ).toBe(false);
    expect(
      evaluateUnlockCondition(
        condition('philosophy', { philosophyDistribution: { accept: 1, resist: 0, invest: 0 } }),
        progress,
      ),
    ).toBe(true);
  });
});

describe('character conditions', () => {
  const progress = withTracking({
    characterVisitPercentages: { archaeologist: 60, algorithm: 40, lastHuman: 0 },
  });

  it('requires every listed character to have been visited', () => {
    expect(
      evaluateUnlockCondition(
        condition('character', { requiredCharacters: ['archaeologist', 'algorithm'] }),
        progress,
      ),
    ).toBe(true);
    expect(
      evaluateUnlockCondition(
        condition('character', { requiredCharacters: ['archaeologist', 'lastHuman'] }),
        progress,
      ),
    ).toBe(false);
  });

  it('counts unique explored characters', () => {
    expect(
      evaluateUnlockCondition(condition('character', { minCharacterCount: 2 }), progress),
    ).toBe(true);
    expect(
      evaluateUnlockCondition(condition('character', { minCharacterCount: 3 }), progress),
    ).toBe(false);
  });

  it('enforces per-character visit percentages and treats unknown characters as zero', () => {
    expect(
      evaluateUnlockCondition(
        condition('character', { minCharacterPercentage: { archaeologist: 50, algorithm: 40 } }),
        progress,
      ),
    ).toBe(true);
    expect(
      evaluateUnlockCondition(
        condition('character', { minCharacterPercentage: { algorithm: 41 } }),
        progress,
      ),
    ).toBe(false);
    expect(
      evaluateUnlockCondition(
        condition('character', { minCharacterPercentage: { chronicler: 1 } }),
        progress,
      ),
    ).toBe(false);
  });
});

describe('transformation conditions', () => {
  const progress = createProgress({
    visitedNodes: {
      'arch-L1': createVisitRecord(3, 'metaAware'),
      'algo-L1': createVisitRecord(2, 'firstRevisit'),
      'hum-L1': createVisitRecord(1),
    },
  });

  it('requires every listed transformation state to have been reached', () => {
    expect(
      evaluateUnlockCondition(
        condition('transformation', { requiredTransformations: ['metaAware', 'firstRevisit'] }),
        progress,
      ),
    ).toBe(true);
    expect(
      evaluateUnlockCondition(
        condition('transformation', {
          requiredTransformations: ['metaAware', 'nope' as TransformationState],
        }),
        progress,
      ),
    ).toBe(false);
  });

  it('counts meta-aware nodes', () => {
    expect(
      evaluateUnlockCondition(condition('transformation', { minMetaAwareNodes: 1 }), progress),
    ).toBe(true);
    expect(
      evaluateUnlockCondition(condition('transformation', { minMetaAwareNodes: 2 }), progress),
    ).toBe(false);
  });
});

describe('L3 assembly conditions', () => {
  it('requires a minimum number of viewed assemblies', () => {
    const viewedOnce = createProgress({ l3AssembliesViewed: [assemblyView(allSectionsRead)] });
    const minTwo = condition('l3Assembly', { minL3Assemblies: 2 });

    expect(evaluateUnlockCondition(minTwo, viewedOnce)).toBe(false);
    expect(
      evaluateUnlockCondition(
        minTwo,
        createProgress({
          l3AssembliesViewed: [assemblyView(allSectionsRead), assemblyView(allSectionsRead)],
        }),
      ),
    ).toBe(true);
  });

  it('treats missing assembly history as no assemblies viewed', () => {
    const progress = createProgress({ l3AssembliesViewed: undefined });

    expect(evaluateUnlockCondition(condition('l3Assembly', { minL3Assemblies: 1 }), progress)).toBe(
      false,
    );
  });

  it('requires every section of the latest assembly to be read', () => {
    const completion = condition('l3Assembly', { requiredL3Completion: true });

    expect(
      evaluateUnlockCondition(
        completion,
        createProgress({
          l3AssembliesViewed: [
            assemblyView(allSectionsRead),
            assemblyView({ ...allSectionsRead, conv: false }),
          ],
        }),
      ),
    ).toBe(false);
    expect(
      evaluateUnlockCondition(
        completion,
        createProgress({
          l3AssembliesViewed: [
            assemblyView({ ...allSectionsRead, hum: false }),
            assemblyView(allSectionsRead),
          ],
        }),
      ),
    ).toBe(true);
  });

  it('rejects completion when the latest assembly entry is missing', () => {
    const progress = createProgress({
      l3AssembliesViewed: [undefined] as unknown as L3AssemblyViewRecord[],
    });

    expect(
      evaluateUnlockCondition(condition('l3Assembly', { requiredL3Completion: true }), progress),
    ).toBe(false);
  });

  it('does not apply the completion check before any assembly is viewed', () => {
    expect(
      evaluateUnlockCondition(
        condition('l3Assembly', { requiredL3Completion: true }),
        createProgress(),
      ),
    ).toBe(true);
  });
});

describe('compound conditions', () => {
  const met = condition('awareness', { minAwareness: 0 });
  const unmet = condition('awareness', { minAwareness: 100 });
  const progress = createProgress({ temporalAwarenessLevel: 50 });

  it('applies AND, OR, and NOT across nested conditions', () => {
    const compound = (operator: UnlockConditionParams['operator'], conditions: UnlockCondition[]) =>
      evaluateUnlockCondition(condition('compound', { operator, conditions }), progress);

    expect(compound('AND', [met, met])).toBe(true);
    expect(compound('AND', [met, unmet])).toBe(false);
    expect(compound('OR', [unmet, met])).toBe(true);
    expect(compound('OR', [unmet, unmet])).toBe(false);
    expect(compound('NOT', [unmet, unmet])).toBe(true);
    expect(compound('NOT', [unmet, met])).toBe(false);
  });

  it('rejects compound conditions without nested conditions', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(evaluateUnlockCondition(condition('compound', { operator: 'AND' }), progress)).toBe(
      false,
    );
    expect(
      evaluateUnlockCondition(condition('compound', { operator: 'OR', conditions: [] }), progress),
    ).toBe(false);
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('rejects an unknown compound operator', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(
      evaluateUnlockCondition(
        condition('compound', {
          operator: 'XOR' as UnlockConditionParams['operator'],
          conditions: [met],
        }),
        progress,
      ),
    ).toBe(false);
    expect(warn).toHaveBeenCalledWith('[UnlockEval] Unknown compound operator:', 'XOR');
  });
});

describe('evaluateNodeUnlock', () => {
  const lockedConfig = (unlockConditions: UnlockCondition[]): NodeUnlockConfig => ({
    nodeId: 'arch-L3',
    layer: 3,
    defaultLocked: true,
    unlockConditions,
    lockedMessage: 'Locked',
  });

  it('always opens nodes that are not locked by default', () => {
    const config = {
      ...lockedConfig([condition('awareness', { minAwareness: 100 })]),
      defaultLocked: false,
    };

    expect(evaluateNodeUnlock(config, createProgress())).toBe(true);
  });

  it('keeps a locked node closed until every condition is met', () => {
    const config = lockedConfig([
      condition('awareness', { minAwareness: 10 }),
      condition('visitCount', { totalVisits: 1 }),
    ]);

    expect(evaluateNodeUnlock(config, createProgress({ temporalAwarenessLevel: 10 }))).toBe(false);
    expect(
      evaluateNodeUnlock(
        config,
        createProgress({
          temporalAwarenessLevel: 10,
          visitedNodes: { 'arch-L1': createVisitRecord(1) },
        }),
      ),
    ).toBe(true);
  });
});

describe('getUnlockProgress', () => {
  const awarenessCondition = condition(
    'awareness',
    { minAwareness: 10 },
    { id: 'awareness', hint: 'Read across perspectives' },
  );
  const visitCondition = condition(
    'visitCount',
    { totalVisits: 2 },
    { id: 'visits', description: 'Visit two passages' },
  );
  const config: NodeUnlockConfig = {
    nodeId: 'arch-L3',
    layer: 3,
    defaultLocked: true,
    unlockConditions: [awarenessCondition, visitCondition],
    lockedMessage: 'Locked',
  };

  it('reports partial progress and the next unmet condition by its description', () => {
    const result = getUnlockProgress(config, createProgress({ temporalAwarenessLevel: 20 }));

    expect(result).toEqual({
      nodeId: 'arch-L3',
      locked: true,
      progress: 50,
      conditionsMet: ['awareness'],
      conditionsNotMet: ['visits'],
      nextCondition: visitCondition,
      nextConditionHint: 'Visit two passages',
    });
  });

  it('prefers an explicit hint for the next unmet condition', () => {
    const result = getUnlockProgress(config, createProgress());

    expect(result.progress).toBe(0);
    expect(result.nextCondition).toBe(awarenessCondition);
    expect(result.nextConditionHint).toBe('Read across perspectives');
  });

  it('reports a fully met configuration as unlocked', () => {
    const result = getUnlockProgress(
      config,
      createProgress({
        temporalAwarenessLevel: 20,
        visitedNodes: { 'arch-L1': createVisitRecord(1), 'algo-L1': createVisitRecord(1) },
      }),
    );

    expect(result.locked).toBe(false);
    expect(result.progress).toBe(100);
    expect(result.nextCondition).toBeUndefined();
    expect(result.nextConditionHint).toBe('All conditions met!');
  });

  it('treats a configuration without conditions as complete', () => {
    const result = getUnlockProgress({ ...config, unlockConditions: [] }, createProgress());

    expect(result.progress).toBe(100);
    expect(result.locked).toBe(false);
  });
});

describe('generateActionableHint', () => {
  it('names the remaining nodes for a short layer requirement', () => {
    const progress = createProgress({ visitedNodes: { 'arch-L2-accept': createVisitRecord(1) } });

    expect(
      generateActionableHint(condition('visitCount', { layerVisits: { 2: 2 } }), progress),
    ).toBe('Visit 1 more Layer 2 node');
    expect(
      generateActionableHint(condition('visitCount', { layerVisits: { 2: 3 } }), progress),
    ).toBe('Visit 2 more Layer 2 nodes');
  });

  it('names the remaining character visits', () => {
    const progress = createProgress({
      characterNodesVisited: { archaeologist: 1, algorithm: 0, lastHuman: 0 },
    });

    expect(
      generateActionableHint(
        condition('visitCount', { characterVisits: { archaeologist: 2 } }),
        progress,
      ),
    ).toBe('Explore 1 more archaeologist node');
    expect(
      generateActionableHint(
        condition('visitCount', { characterVisits: { algorithm: 3 } }),
        progress,
      ),
    ).toBe('Explore 3 more algorithm nodes');
    expect(
      generateActionableHint(
        condition('visitCount', { characterVisits: { chronicler: 2 } }),
        progress,
      ),
    ).toBe('Explore 2 more chronicler nodes');
  });

  it('falls back to a generic visit hint when visit requirements are met', () => {
    const progress = createProgress({
      visitedNodes: { 'arch-L1': createVisitRecord(1) },
      characterNodesVisited: { archaeologist: 1, algorithm: 0, lastHuman: 0 },
    });

    expect(
      generateActionableHint(
        condition('visitCount', { layerVisits: { 1: 1 }, characterVisits: { archaeologist: 1 } }),
        progress,
      ),
    ).toBe('Continue exploring nodes');
  });

  it('describes the awareness still needed', () => {
    const minimum = condition('awareness', { minAwareness: 50 });

    expect(generateActionableHint(minimum, createProgress({ temporalAwarenessLevel: 20 }))).toBe(
      'Increase temporal awareness by 30% (explore multiple characters)',
    );
    expect(
      generateActionableHint(
        minimum,
        createProgress({ temporalAwarenessLevel: undefined as unknown as number }),
      ),
    ).toBe('Increase temporal awareness by 50% (explore multiple characters)');
    expect(generateActionableHint(minimum, createProgress({ temporalAwarenessLevel: 50 }))).toBe(
      'Reach required awareness level',
    );
  });

  it('describes the L2 choices still needed', () => {
    const progress = withTracking({ l2Choices: { accept: 1, resist: 0, invest: 0 } });

    expect(
      generateActionableHint(condition('philosophy', { minPhilosophyCount: 2 }), progress),
    ).toBe('Make 1 more Layer 2 choice');
    expect(
      generateActionableHint(condition('philosophy', { minPhilosophyCount: 3 }), progress),
    ).toBe('Make 2 more Layer 2 choices');
    expect(
      generateActionableHint(condition('philosophy', { minPhilosophyCount: 1 }), progress),
    ).toBe('Make required philosophy choices');
    expect(
      generateActionableHint(
        condition('philosophy', { minPhilosophyCount: 1 }),
        withTracking({ l2Choices: undefined }),
      ),
    ).toBe('Make 1 more Layer 2 choice');
    expect(
      generateActionableHint(
        condition('philosophy', { minPhilosophyCount: 1 }),
        createProgress({ journeyTracking: undefined as unknown as JourneyTracking }),
      ),
    ).toBe('Make 1 more Layer 2 choice');
    expect(
      generateActionableHint(condition('philosophy', { requiredPhilosophy: 'accept' }), progress),
    ).toBe('Make required philosophy choices');
  });

  it('describes the character perspectives still needed', () => {
    const progress = withTracking({
      characterVisitPercentages: { archaeologist: 100, algorithm: 0, lastHuman: 0 },
    });
    const noTracking = createProgress({
      journeyTracking: undefined as unknown as JourneyTracking,
    });

    expect(generateActionableHint(condition('character', { minCharacterCount: 2 }), progress)).toBe(
      'Explore 1 more character perspective',
    );
    expect(generateActionableHint(condition('character', { minCharacterCount: 3 }), progress)).toBe(
      'Explore 2 more character perspectives',
    );
    expect(
      generateActionableHint(condition('character', { minCharacterCount: 1 }), noTracking),
    ).toBe('Explore 1 more character perspective');
    expect(
      generateActionableHint(
        condition('character', { requiredCharacters: ['archaeologist', 'lastHuman'] }),
        progress,
      ),
    ).toBe('Explore the lastHuman perspective');
    expect(
      generateActionableHint(
        condition('character', { requiredCharacters: ['algorithm'] }),
        noTracking,
      ),
    ).toBe('Explore the algorithm perspective');
    expect(
      generateActionableHint(
        condition('character', { minCharacterCount: 1, requiredCharacters: ['archaeologist'] }),
        progress,
      ),
    ).toBe('Explore required characters');
  });

  it('uses fixed or descriptive hints for the remaining condition types', () => {
    expect(generateActionableHint(condition('l3Assembly', {}), createProgress())).toBe(
      'Complete a Layer 3 convergence assembly',
    );
    expect(
      generateActionableHint(
        condition(
          'transformation',
          { minMetaAwareNodes: 1 },
          { description: 'Reach meta-awareness' },
        ),
        createProgress(),
      ),
    ).toBe('Reach meta-awareness');
  });
});
