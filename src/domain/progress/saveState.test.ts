import { describe, expect, it, vi } from 'vitest';

vi.unmock('@/utils/validation');

import { createInitialPreferences, createInitialProgress } from '@/domain/progress/progressModel';
import type { StoryNode, UserProgress } from '@/types';

import {
  buildSavedState,
  CURRENT_SAVE_VERSION,
  prepareSavedState,
  serializeSavedState,
} from './saveState';

function createNode(
  id: string,
  character: StoryNode['character'],
  layer: StoryNode['layer'],
): StoryNode {
  return {
    id,
    character,
    layer,
    title: id,
    position: { x: 0, y: 0 },
    content: { initial: '', firstRevisit: '', metaAware: '' },
    connections: [],
    visualState: { defaultColor: '#000000', size: 30 },
    metadata: {
      estimatedReadTime: 1,
      thematicTags: [],
      narrativeAct: 1,
      criticalPath: false,
    },
  };
}

function addVisit(progress: UserProgress, nodeId: string, visitCount = 1): void {
  const timestamp = '2026-07-12T12:00:00.000Z';
  progress.visitedNodes[nodeId] = {
    visitCount,
    visitTimestamps: Array.from({ length: visitCount }, () => timestamp),
    currentState: 'initial',
    timeSpent: 0,
    lastVisited: timestamp,
  };
  progress.readingPath.push(...Array.from({ length: visitCount }, () => nodeId));
}

describe('saved-state persistence boundary', () => {
  it('builds and serializes the existing 1.0.0 save envelope', () => {
    const progress = createInitialProgress();
    const preferences = createInitialPreferences();
    const timestamp = '2026-07-12T12:00:00.000Z';

    const savedState = buildSavedState(progress, preferences, timestamp);

    expect(savedState).toEqual({
      version: CURRENT_SAVE_VERSION,
      timestamp,
      progress,
      preferences,
    });
    expect(JSON.parse(serializeSavedState(savedState))).toEqual(savedState);
  });

  it.each([
    null,
    {},
    {
      version: CURRENT_SAVE_VERSION,
      timestamp: '2026-07-12T12:00:00.000Z',
      progress: {},
      preferences: { theme: 'dark', textSize: 'medium' },
    },
    {
      version: CURRENT_SAVE_VERSION,
      timestamp: '2026-07-12T12:00:00.000Z',
      progress: {
        visitedNodes: {},
        readingPath: [],
        unlockedConnections: [],
        specialTransformations: [],
      },
      preferences: { theme: 'invalid', textSize: 'medium' },
    },
  ])('rejects malformed persisted data: %j', (data) => {
    expect(prepareSavedState(data, new Map())).toBeNull();
  });

  it('migrates missing legacy fields without changing the schema version or input object', () => {
    const progress = createInitialProgress();
    addVisit(progress, 'arch-L1', 2);
    addVisit(progress, 'algo-L1', 1);
    addVisit(progress, 'hum-L2-accept', 1);
    addVisit(progress, 'removed-L1', 1);

    const legacyProgress = progress as Partial<UserProgress>;
    delete legacyProgress.temporalAwarenessLevel;
    delete legacyProgress.characterNodesVisited;
    delete legacyProgress.unlockedL2Characters;
    delete legacyProgress.l3ConvergenceTriggered;
    delete legacyProgress.lockedNodes;

    const legacySave = buildSavedState(
      progress,
      createInitialPreferences(),
      '2026-07-12T12:00:00.000Z',
    );
    const nodes = new Map<string, StoryNode>([
      ['arch-L1', createNode('arch-L1', 'archaeologist', 1)],
      ['algo-L1', createNode('algo-L1', 'algorithm', 1)],
      ['hum-L2-accept', createNode('hum-L2-accept', 'last-human', 2)],
    ]);

    const result = prepareSavedState(legacySave, nodes);

    expect(result).not.toBeNull();
    expect(result?.migrations).toEqual(['temporal-awareness', 'l2-unlocks', 'l3-convergence']);
    expect(result?.savedState.version).toBe(CURRENT_SAVE_VERSION);
    expect(result?.savedState.progress.characterNodesVisited).toEqual({
      archaeologist: 1,
      algorithm: 1,
      lastHuman: 1,
    });
    expect(result?.savedState.progress.temporalAwarenessLevel).toBe(72);
    expect(result?.savedState.progress.unlockedL2Characters).toEqual([
      'archaeologist',
      'algorithm',
    ]);
    expect(result?.savedState.progress.l3ConvergenceTriggered).toBe(false);
    expect(result?.savedState.progress.lockedNodes).toEqual([]);
    expect(legacyProgress.temporalAwarenessLevel).toBeUndefined();
    expect(legacyProgress.unlockedL2Characters).toBeUndefined();
  });

  it('leaves current saved-state values intact when no migration is needed', () => {
    const savedState = buildSavedState(
      createInitialProgress(),
      createInitialPreferences(),
      '2026-07-12T12:00:00.000Z',
    );

    const result = prepareSavedState(savedState, new Map());

    expect(result).toEqual({ savedState, migrations: [] });
  });
});
