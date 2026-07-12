import { describe, expect, it } from 'vitest';

import type { JourneyTracking, StoryNode } from '@/types';

import {
  calculateCharacterVisitPercentages,
  calculateJourneyTrackingSnapshot,
  calculateProgressAfterNodeVisit,
  calculateProgressionAfterNodeVisit,
  calculateTemporalAwarenessLevel,
  determineDominantCharacter,
} from './journeyProgress';
import { createInitialProgress } from './progressModel';

const createStoryNode = (id: string, character: StoryNode['character']): StoryNode => ({
  id,
  character,
  layer: 1,
  title: id,
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
});

describe('journey progress domain helpers', () => {
  it.each([
    [{ archaeologist: 0, algorithm: 0, lastHuman: 0 }, 0],
    [{ archaeologist: 1, algorithm: 0, lastHuman: 0 }, 24],
    [{ archaeologist: 1, algorithm: 1, lastHuman: 0 }, 48],
    [{ archaeologist: 10, algorithm: 10, lastHuman: 10 }, 100],
  ] as const)('calculates temporal awareness for %o', (counts, expected) => {
    expect(calculateTemporalAwarenessLevel(counts)).toBe(expected);
  });

  it('calculates character visit percentages with a zero-visit guard', () => {
    expect(
      calculateCharacterVisitPercentages({ archaeologist: 0, algorithm: 0, lastHuman: 0 }),
    ).toEqual({ archaeologist: 0, algorithm: 0, lastHuman: 0 });

    expect(
      calculateCharacterVisitPercentages({ archaeologist: 2, algorithm: 1, lastHuman: 1 }),
    ).toEqual({ archaeologist: 50, algorithm: 25, lastHuman: 25 });
  });

  it('preserves dominant character tie-breaking order from the store', () => {
    expect(determineDominantCharacter({ archaeologist: 50, algorithm: 50, lastHuman: 0 })).toBe(
      'archaeologist',
    );
    expect(determineDominantCharacter({ archaeologist: 0, algorithm: 50, lastHuman: 50 })).toBe(
      'algorithm',
    );
    expect(determineDominantCharacter({ archaeologist: 0, algorithm: 0, lastHuman: 0 })).toBeNull();
  });

  it('calculates a journey tracking snapshot while preserving unrelated metrics', () => {
    const progress = createInitialProgress('2026-06-26T00:00:00.000Z');
    progress.characterNodesVisited = { archaeologist: 1, algorithm: 3, lastHuman: 0 };
    progress.readingPath = ['arch-001', 'algo-001'];
    progress.journeyTracking.l2Choices.accept = 2;
    progress.journeyTracking.crossCharacterConnections.arch_algo = 1;
    progress.journeyTracking.revisitFrequency = 25;
    progress.journeyTracking.explorationMetrics = { breadth: 10, depth: 2 };

    const nodes = new Map<string, StoryNode>([
      ['arch-001', createStoryNode('arch-001', 'archaeologist')],
      ['algo-001', createStoryNode('algo-001', 'algorithm')],
    ]);

    const snapshot = calculateJourneyTrackingSnapshot({
      currentTracking: progress.journeyTracking,
      characterNodesVisited: progress.characterNodesVisited,
      readingPath: progress.readingPath,
      nodes,
    });

    expect(snapshot).toMatchObject<Partial<JourneyTracking>>({
      startingCharacter: 'archaeologist',
      characterVisitPercentages: { archaeologist: 25, algorithm: 75, lastHuman: 0 },
      dominantCharacter: 'algorithm',
      dominantPhilosophy: 'accept',
      crossCharacterConnections: { arch_algo: 1, arch_hum: 0, algo_hum: 0 },
      revisitFrequency: 25,
      explorationMetrics: { breadth: 10, depth: 2 },
    });
  });

  it('does not infer a starting character from multi-perspective first visits', () => {
    const progress = createInitialProgress('2026-06-26T00:00:00.000Z');
    progress.characterNodesVisited = { archaeologist: 1, algorithm: 0, lastHuman: 0 };
    progress.readingPath = ['multi-001'];

    const snapshot = calculateJourneyTrackingSnapshot({
      currentTracking: progress.journeyTracking,
      characterNodesVisited: progress.characterNodesVisited,
      readingPath: progress.readingPath,
      nodes: new Map([['multi-001', createStoryNode('multi-001', 'multi-perspective')]]),
    });

    expect(snapshot.startingCharacter).toBeNull();
  });
  it('records first visits with character counters and exploration metrics', () => {
    const progress = createInitialProgress('2026-06-26T00:00:00.000Z');

    const result = calculateProgressAfterNodeVisit({
      progress,
      node: createStoryNode('arch-001', 'archaeologist'),
      nodeId: 'arch-001',
      totalNodes: 4,
      now: '2026-06-26T12:00:00.000Z',
    });

    expect(result.previousVisitCount).toBeNull();
    expect(result.visitCount).toBe(1);
    expect(result.characterSwitch).toBeNull();
    expect(result.progress.visitedNodes['arch-001']).toMatchObject({
      visitCount: 1,
      visitTimestamps: ['2026-06-26T12:00:00.000Z'],
      currentState: 'initial',
      timeSpent: 0,
      lastVisited: '2026-06-26T12:00:00.000Z',
    });
    expect(result.progress.characterNodesVisited).toEqual({
      archaeologist: 1,
      algorithm: 0,
      lastHuman: 0,
    });
    expect(result.progress.journeyTracking.lastCharacterVisited).toBe('archaeologist');
    expect(result.progress.journeyTracking.explorationMetrics).toEqual({ breadth: 25, depth: 1 });
    expect(result.progress.journeyTracking.revisitFrequency).toBe(0);
    expect(result.progress.readingPath).toEqual(['arch-001']);
    expect(result.progress.lastActiveTimestamp).toBe('2026-06-26T12:00:00.000Z');
  });

  it('records revisits without resetting transformation state', () => {
    const progress = createInitialProgress('2026-06-26T00:00:00.000Z');
    progress.visitedNodes['algo-001'] = {
      visitCount: 1,
      visitTimestamps: ['2026-06-26T10:00:00.000Z'],
      currentState: 'metaAware',
      timeSpent: 42,
      lastVisited: '2026-06-26T10:00:00.000Z',
    };
    progress.characterNodesVisited.algorithm = 1;
    progress.readingPath = ['algo-001'];
    progress.journeyTracking.lastCharacterVisited = 'algorithm';

    const result = calculateProgressAfterNodeVisit({
      progress,
      node: createStoryNode('algo-001', 'algorithm'),
      nodeId: 'algo-001',
      totalNodes: 2,
      now: '2026-06-26T12:00:00.000Z',
    });

    expect(result.previousVisitCount).toBe(1);
    expect(result.visitCount).toBe(2);
    expect(result.progress.visitedNodes['algo-001']).toMatchObject({
      visitCount: 2,
      visitTimestamps: ['2026-06-26T10:00:00.000Z', '2026-06-26T12:00:00.000Z'],
      currentState: 'metaAware',
      timeSpent: 42,
      lastVisited: '2026-06-26T12:00:00.000Z',
    });
    expect(result.progress.characterNodesVisited.algorithm).toBe(2);
    expect(result.progress.journeyTracking.revisitFrequency).toBe(100);
    expect(result.progress.journeyTracking.explorationMetrics).toEqual({ breadth: 50, depth: 2 });
    expect(result.progress.readingPath).toEqual(['algo-001', 'algo-001']);
  });

  it('tracks cross-character switches and keeps multi-perspective visit counter behavior', () => {
    const progress = createInitialProgress('2026-06-26T00:00:00.000Z');
    progress.visitedNodes['arch-001'] = {
      visitCount: 1,
      visitTimestamps: ['2026-06-26T10:00:00.000Z'],
      currentState: 'initial',
      timeSpent: 0,
      lastVisited: '2026-06-26T10:00:00.000Z',
    };
    progress.characterNodesVisited.archaeologist = 1;
    progress.readingPath = ['arch-001'];
    progress.journeyTracking.lastCharacterVisited = 'archaeologist';

    const algorithmResult = calculateProgressAfterNodeVisit({
      progress,
      node: createStoryNode('algo-001', 'algorithm'),
      nodeId: 'algo-001',
      totalNodes: 3,
      now: '2026-06-26T12:00:00.000Z',
    });

    expect(algorithmResult.characterSwitch).toEqual({ from: 'archaeologist', to: 'algorithm' });
    expect(algorithmResult.progress.journeyTracking.crossCharacterConnections.arch_algo).toBe(1);
    expect(algorithmResult.progress.characterNodesVisited).toEqual({
      archaeologist: 1,
      algorithm: 1,
      lastHuman: 0,
    });

    const multiResult = calculateProgressAfterNodeVisit({
      progress: algorithmResult.progress,
      node: createStoryNode('multi-001', 'multi-perspective'),
      nodeId: 'multi-001',
      totalNodes: 3,
      now: '2026-06-26T13:00:00.000Z',
    });

    expect(multiResult.progress.characterNodesVisited).toEqual({
      archaeologist: 1,
      algorithm: 1,
      lastHuman: 0,
    });
    // Preserve existing normalizeCharacter behavior: multi-perspective falls back to archaeologist.
    expect(multiResult.characterSwitch).toEqual({ from: 'algorithm', to: 'archaeologist' });
    expect(multiResult.progress.journeyTracking.crossCharacterConnections.arch_algo).toBe(2);
  });

  it('calculates L2 character unlocking and philosophy choice side effects after visits', () => {
    const progress = createInitialProgress('2026-06-26T00:00:00.000Z');

    const l1Result = calculateProgressionAfterNodeVisit({
      progress,
      node: createStoryNode('arch-L1', 'archaeologist'),
      nodeId: 'arch-L1',
      nodePhilosophy: null,
    });

    expect(l1Result.shouldClearL3AssemblyCache).toBe(false);
    expect(l1Result.progress.unlockedL2Characters).toEqual(['archaeologist']);

    const l2Result = calculateProgressionAfterNodeVisit({
      progress: l1Result.progress,
      node: createStoryNode('arch-L2-accept', 'archaeologist'),
      nodeId: 'arch-L2-accept',
      nodePhilosophy: 'accept',
    });

    expect(l2Result.shouldClearL3AssemblyCache).toBe(true);
    expect(l2Result.progress.unlockedL2Characters).toEqual(['archaeologist']);
    expect(l2Result.progress.journeyTracking.l2Choices).toEqual({
      accept: 1,
      resist: 0,
      invest: 0,
    });
  });

  it('ignores non-core philosophy labels when calculating visit progression', () => {
    const progress = createInitialProgress('2026-06-26T00:00:00.000Z');

    const result = calculateProgressionAfterNodeVisit({
      progress,
      node: createStoryNode('arch-L2-other', 'archaeologist'),
      nodeId: 'arch-L2-other',
      nodePhilosophy: 'other',
    });

    expect(result.progress.journeyTracking.l2Choices).toEqual({
      accept: 0,
      resist: 0,
      invest: 0,
    });
  });
});
