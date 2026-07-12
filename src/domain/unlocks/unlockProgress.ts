import type { UserProgress } from '@/types';
import type { NodeUnlockConfig, UnlockProgress } from '@/types/Unlock';
import {
  evaluateNodeUnlock,
  getUnlockProgress as getUnlockProgressDetails,
} from '@/utils/unlockEvaluator';

export interface UnlockEvaluationResult {
  newlyUnlockedNodeIds: string[];
}

export function findNewlyUnlockedNodes(
  unlockConfigs: Map<string, NodeUnlockConfig>,
  progress: UserProgress,
  alreadyNotifiedNodeIds: readonly string[],
): UnlockEvaluationResult {
  const alreadyNotified = new Set(alreadyNotifiedNodeIds);
  const newlyUnlockedNodeIds: string[] = [];

  for (const [nodeId, config] of unlockConfigs) {
    if (alreadyNotified.has(nodeId) || !config.defaultLocked) {
      continue;
    }

    if (evaluateNodeUnlock(config, progress)) {
      newlyUnlockedNodeIds.push(nodeId);
    }
  }

  return { newlyUnlockedNodeIds };
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
