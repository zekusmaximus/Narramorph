import { describe, expect, it, vi } from 'vitest';

vi.unmock('@/utils/validation');

import { createInitialPreferences, createInitialProgress } from '@/domain/progress/progressModel';
import { CURRENT_STORY_PACKAGE } from '@/domain/progress/storyPackageIdentity';
import type { StoryNode, UserProgress } from '@/types';

import {
  buildSavedState,
  CURRENT_APP_VERSION,
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
  it('builds and serializes the 1.1.0 save envelope with exact story-package identity', () => {
    const progress = createInitialProgress();
    const preferences = createInitialPreferences();
    const timestamp = '2026-07-12T12:00:00.000Z';

    const savedState = buildSavedState(progress, preferences, timestamp);

    expect(savedState).toEqual({
      version: CURRENT_SAVE_VERSION,
      appVersion: CURRENT_APP_VERSION,
      storyPackage: CURRENT_STORY_PACKAGE,
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

  it('migrates missing legacy progress fields without mutating the input object', () => {
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

  it('migrates a 1.0.0 journey to the current Eternal Return package identity', () => {
    const current = buildSavedState(
      createInitialProgress(),
      createInitialPreferences(),
      '2026-07-12T12:00:00.000Z',
    );
    const legacy = { ...current, version: '1.0.0' } as Partial<typeof current>;
    delete legacy.appVersion;
    delete legacy.storyPackage;

    const result = prepareSavedState(legacy, new Map());

    expect(result?.migrations).toEqual(['app-version', 'story-package-identity']);
    expect(result?.savedState.version).toBe(CURRENT_SAVE_VERSION);
    expect(result?.savedState.appVersion).toBe(CURRENT_APP_VERSION);
    expect(result?.savedState.storyPackage).toEqual(CURRENT_STORY_PACKAGE);
    expect(legacy.storyPackage).toBeUndefined();
    expect(legacy.appVersion).toBeUndefined();
  });

  it('migrates the exact pre-release package identity without losing journey progress', () => {
    const progress = createInitialProgress();
    addVisit(progress, 'arch-L1', 2);
    const predecessor = buildSavedState(
      progress,
      createInitialPreferences(),
      '2026-07-12T12:00:00.000Z',
      {
        storyId: 'eternal-return',
        storyVersion: '1.0.0',
        schemaVersion: '1.0.0',
        contentHash: 'f5239eceba8d443e74ed7ffa70ee1a28a4886bc54cdc5b2a428b4ed705d07e02',
      },
    );

    const result = prepareSavedState(predecessor, new Map());

    expect(result?.migrations).toEqual(['story-package-provenance']);
    expect(result?.savedState.storyPackage).toEqual(CURRENT_STORY_PACKAGE);
    expect(result?.savedState.progress).toEqual(progress);
    expect(predecessor.storyPackage.storyVersion).toBe('1.0.0');
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
