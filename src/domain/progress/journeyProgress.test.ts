import { describe, expect, it } from 'vitest';

import type { JourneyTracking, StoryNode } from '@/types';

import {
  calculateCharacterVisitPercentages,
  calculateJourneyTrackingSnapshot,
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
});
