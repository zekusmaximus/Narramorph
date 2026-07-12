import { describe, expect, it } from 'vitest';

import { createInitialProgress } from '@/domain/progress/progressModel';
import type { NodeUnlockConfig } from '@/types/Unlock';

import { findNewlyUnlockedNodes, getNodeUnlockProgress } from './unlockProgress';

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

describe('findNewlyUnlockedNodes', () => {
  it('returns locked configured nodes whose conditions are now met', () => {
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

    const result = findNewlyUnlockedNodes(
      new Map([
        ['ready-node', createVisitConfig('ready-node', 1)],
        ['blocked-node', createVisitConfig('blocked-node', 2)],
      ]),
      progress,
      [],
    );

    expect(result.newlyUnlockedNodeIds).toEqual(['ready-node']);
  });

  it('skips nodes already queued for notification and nodes that are unlocked by default', () => {
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

    const result = findNewlyUnlockedNodes(
      new Map([
        ['already-notified', createVisitConfig('already-notified', 1)],
        ['default-open', createVisitConfig('default-open', 1, false)],
      ]),
      progress,
      ['already-notified'],
    );

    expect(result.newlyUnlockedNodeIds).toEqual([]);
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
