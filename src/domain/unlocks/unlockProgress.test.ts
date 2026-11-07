import { describe, expect, it } from 'vitest';

import { createInitialProgress } from '@/domain/progress/progressModel';
import type { UserProgress } from '@/types';
import type { NodeUnlockConfig } from '@/types/Unlock';

import { findNewlyUnlockedNodes, findUnlockedNodes, getNodeUnlockProgress } from './unlockProgress';

const createVisitConfig = (
  nodeId: string,
  totalVisits: number,
  defaultLocked = true,
): NodeUnlockConfig => ({
  nodeId,
  layer: 2,
  defaultLocked,
  lockedMessage: 'Locked',
  unlockConditions: [
    {
      id: `${nodeId}-visits`,
      type: 'visitCount',
      params: { totalVisits },
      description: `Visit ${totalVisits} nodes`,
      hint: 'Keep exploring',
    },
  ],
});

function progressWithOneVisit(): UserProgress {
  const progress = createInitialProgress('2026-01-01T00:00:00Z');
  progress.visitedNodes = {
    'arch-L1': {
      visitCount: 1,
      visitTimestamps: ['2026-01-01T00:00:00Z'],
      currentState: 'initial',
      timeSpent: 0,
      lastVisited: '2026-01-01T00:00:00Z',
    },
  };
  return progress;
}

describe('findUnlockedNodes', () => {
  it('lists default-locked nodes whose conditions are met, in config order', () => {
    const configs = new Map([
      ['second-ready', createVisitConfig('second-ready', 1)],
      ['blocked-node', createVisitConfig('blocked-node', 2)],
      ['default-open', createVisitConfig('default-open', 1, false)],
      ['first-ready', createVisitConfig('first-ready', 0)],
    ]);

    expect(findUnlockedNodes(configs, progressWithOneVisit())).toEqual([
      'second-ready',
      'first-ready',
    ]);
    expect(findUnlockedNodes(configs, createInitialProgress('2026-01-01T00:00:00Z'))).toEqual([
      'first-ready',
    ]);
  });
});

describe('findNewlyUnlockedNodes', () => {
  it('returns locked configured nodes whose conditions are now met', () => {
    const result = findNewlyUnlockedNodes(
      new Map([
        ['ready-node', createVisitConfig('ready-node', 1)],
        ['blocked-node', createVisitConfig('blocked-node', 2)],
      ]),
      progressWithOneVisit(),
      [],
    );

    expect(result).toEqual({
      unlockedNodeIds: ['ready-node'],
      newlyUnlockedNodeIds: ['ready-node'],
    });
  });

  it('reports only transitions: nodes unlocked at the previous evaluation are not new', () => {
    const result = findNewlyUnlockedNodes(
      new Map([
        ['already-unlocked', createVisitConfig('already-unlocked', 1)],
        ['just-unlocked', createVisitConfig('just-unlocked', 1)],
        ['default-open', createVisitConfig('default-open', 1, false)],
      ]),
      progressWithOneVisit(),
      ['already-unlocked'],
    );

    expect(result).toEqual({
      unlockedNodeIds: ['already-unlocked', 'just-unlocked'],
      newlyUnlockedNodeIds: ['just-unlocked'],
    });
  });

  it('drops a node that locked again from the baseline, so its next unlock is new', () => {
    const configs = new Map([['relocking', createVisitConfig('relocking', 1)]]);

    const relocked = findNewlyUnlockedNodes(
      configs,
      createInitialProgress('2026-01-01T00:00:00Z'),
      ['relocking'],
    );
    expect(relocked).toEqual({ unlockedNodeIds: [], newlyUnlockedNodeIds: [] });

    const reopened = findNewlyUnlockedNodes(
      configs,
      progressWithOneVisit(),
      relocked.unlockedNodeIds,
    );
    expect(reopened.newlyUnlockedNodeIds).toEqual(['relocking']);
  });
});

describe('getNodeUnlockProgress', () => {
  it('returns null when a node has no unlock config', () => {
    const progress = createInitialProgress('2026-01-01T00:00:00Z');

    expect(getNodeUnlockProgress(new Map(), progress, 'missing')).toBeNull();
  });

  it('returns detailed progress for configured nodes', () => {
    const progress = createInitialProgress('2026-01-01T00:00:00Z');
    const unlockProgress = getNodeUnlockProgress(
      new Map([['configured', createVisitConfig('configured', 1)]]),
      progress,
      'configured',
    );

    expect(unlockProgress).toMatchObject({
      nodeId: 'configured',
      locked: true,
      progress: 0,
      conditionsMet: [],
      conditionsNotMet: ['configured-visits'],
    });
  });
});
