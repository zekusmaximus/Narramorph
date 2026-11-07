import type { UserProgress } from '@/types';
import type { NodeUnlockConfig, UnlockProgress } from '@/types/Unlock';
import {
  evaluateNodeUnlock,
  getUnlockProgress as getUnlockProgressDetails,
} from '@/utils/unlockEvaluator';

export interface UnlockEvaluationResult {
  /** Every default-locked configured node whose conditions are met now, in config order. */
  unlockedNodeIds: string[];
  /** The subset of `unlockedNodeIds` that was locked at the previous evaluation. */
  newlyUnlockedNodeIds: string[];
}

/**
 * Lists the default-locked configured nodes whose unlock conditions `progress` meets.
 * Nodes that are open by default are never "unlocked", so they are never listed.
 */
export function findUnlockedNodes(
  unlockConfigs: Map<string, NodeUnlockConfig>,
  progress: UserProgress,
): string[] {
  const unlockedNodeIds: string[] = [];

  for (const [nodeId, config] of unlockConfigs) {
    if (config.defaultLocked && evaluateNodeUnlock(config, progress)) {
      unlockedNodeIds.push(nodeId);
    }
  }

  return unlockedNodeIds;
}

/**
 * Compares the nodes unlocked now against the nodes unlocked at the previous evaluation
 * and reports only the locked-to-unlocked transitions. The baseline is the derived unlock
 * state, not the notice queue, so dismissing a notice can never re-arm its announcement.
 */
export function findNewlyUnlockedNodes(
  unlockConfigs: Map<string, NodeUnlockConfig>,
  progress: UserProgress,
  previouslyUnlockedNodeIds: readonly string[],
): UnlockEvaluationResult {
  const previouslyUnlocked = new Set(previouslyUnlockedNodeIds);
  const unlockedNodeIds = findUnlockedNodes(unlockConfigs, progress);

  return {
    unlockedNodeIds,
    newlyUnlockedNodeIds: unlockedNodeIds.filter((nodeId) => !previouslyUnlocked.has(nodeId)),
  };
}

export function getNodeUnlockProgress(
  unlockConfigs: Map<string, NodeUnlockConfig>,
  progress: UserProgress,
  nodeId: string,
): UnlockProgress | null {
  const config = unlockConfigs.get(nodeId);

  if (!config) {
    return null;
  }

  return getUnlockProgressDetails(config, progress);
}
