import { describe, expect, it } from 'vitest';

import type { Connection, StoryNode, VisitRecord } from '@/types';

import {
  checkSpecialTransformations,
  classifyNavigationPattern,
  createInitialProgress,
  determineTransformationState,
  findNewlyRevealedConnectionIds,
  getConnectionKey,
  shouldRevealConnection,
} from './progressModel';

const createVisitRecord = (visitCount: number): VisitRecord => ({
  visitCount,
  visitTimestamps: [],
  currentState: 'initial',
  timeSpent: 0,
  lastVisited: '2026-06-26T00:00:00.000Z',
});

const createConnection = (overrides: Partial<Connection> = {}): Connection => ({
  id: 'source-target',
  sourceId: 'source',
  targetId: 'target',
  type: 'temporal',
  bidirectional: false,
  visualProperties: { color: '#fff', weight: 1, animated: false },
  ...overrides,
});

const createStoryNode = (overrides: Partial<StoryNode> = {}): StoryNode => ({
  id: 'target',
  character: 'archaeologist',
  layer: 1,
  title: 'Target',
  position: { x: 0, y: 0 },
  content: { initial: '', firstRevisit: '', metaAware: '' },
  connections: [],
  visualState: { defaultColor: '#fff', size: 1 },
  metadata: {
    estimatedReadTime: 1,
    thematicTags: [],
    narrativeAct: 1,
    criticalPath: false,
  },
  ...overrides,
});

describe('progress model', () => {
  it('creates independent initial progress objects', () => {
    const first = createInitialProgress('2026-06-26T00:00:00.000Z');
    const second = createInitialProgress('2026-06-26T00:00:00.000Z');

    first.readingPath.push('arch-L1');
    first.journeyTracking.l2Choices.accept = 1;

    expect(second.readingPath).toEqual([]);
    expect(second.journeyTracking.l2Choices.accept).toBe(0);
  });

  it.each([
    [1, 0, 'initial'],
    [2, 0, 'firstRevisit'],
    [3, 0, 'metaAware'],
    [0, 75, 'metaAware'],
  ] as const)('maps %i visits and %i awareness to %s', (visitCount, awareness, expectedState) => {
    expect(
      determineTransformationState('arch-L1', createVisitRecord(visitCount), [], awareness),
    ).toBe(expectedState);
  });

  it('prioritizes an unlocked special transformation', () => {
    expect(
      determineTransformationState(
        'arch-L1',
        createVisitRecord(1),
        [
          {
            nodeId: 'arch-L1',
            transformationId: 'special',
            unlockedAt: '2026-06-26T00:00:00.000Z',
          },
        ],
        0,
      ),
    ).toBe('metaAware');
  });

  it('reveals a guarded connection only after visits and sequence match', () => {
    const progress = createInitialProgress('2026-06-26T00:00:00.000Z');
    const connection = createConnection({
      revealConditions: {
        requiredVisits: { 'arch-L1': 2 },
        requiredSequence: ['arch-L1', 'algo-L1'],
      },
    });

    expect(shouldRevealConnection(connection, progress)).toBe(false);

    progress.visitedNodes['arch-L1'] = createVisitRecord(2);
    progress.readingPath = ['arch-L1', 'algo-L1'];
    expect(shouldRevealConnection(connection, progress)).toBe(true);
  });

  it('finds newly revealed connections without returning already unlocked ids', () => {
    const progress = createInitialProgress('2026-06-26T00:00:00.000Z');
    progress.visitedNodes['arch-L1'] = createVisitRecord(2);
    progress.readingPath = ['arch-L1', 'algo-L1'];
    progress.unlockedConnections = ['always-visible'];

    const connections = new Map([
      ['always-visible', createConnection({ id: 'always-visible' })],
      [
        'guarded-visible',
        createConnection({
          id: 'guarded-visible',
          revealConditions: {
            requiredVisits: { 'arch-L1': 2 },
            requiredSequence: ['arch-L1', 'algo-L1'],
          },
        }),
      ],
      [
        'guarded-hidden',
        createConnection({
          id: 'guarded-hidden',
          revealConditions: { requiredVisits: { missing: 1 } },
        }),
      ],
    ]);

    expect(findNewlyRevealedConnectionIds(connections, progress)).toEqual(['guarded-visible']);
  });

  it('unlocks a special transformation with deterministic timing', () => {
    const progress = createInitialProgress('2026-06-26T00:00:00.000Z');
    progress.visitedNodes['arch-L1'] = createVisitRecord(1);
    progress.readingPath = ['arch-L1', 'algo-L1'];
    const node = createStoryNode({
      unlockConditions: {
        specialTransforms: [
          {
            id: 'convergence',
            requiredPriorNodes: ['arch-L1'],
            requiredSequence: ['arch-L1', 'algo-L1'],
            transformText: 'Unlocked',
          },
        ],
      },
    });

    expect(
      checkSpecialTransformations('algo-L1', [node], progress, '2026-06-26T12:00:00.000Z'),
    ).toEqual([
      {
        nodeId: 'target',
        transformationId: 'convergence',
        unlockedAt: '2026-06-26T12:00:00.000Z',
      },
    ]);
  });

  it('keeps cross-character keys bidirectional', () => {
    expect(getConnectionKey('algorithm', 'archaeologist')).toBe('arch_algo');
    expect(getConnectionKey('archaeologist', 'algorithm')).toBe('arch_algo');
    expect(getConnectionKey('algorithm', 'algorithm')).toBeNull();
  });

  it('characterizes recursive navigation', () => {
    const tracking = createInitialProgress().journeyTracking;
    tracking.revisitFrequency = 50;
    tracking.explorationMetrics = { breadth: 30, depth: 3 };

    expect(classifyNavigationPattern(tracking)).toBe('recursive');
  });
});
