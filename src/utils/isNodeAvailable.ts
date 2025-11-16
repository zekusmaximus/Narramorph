import { evaluateNodeUnlock } from './unlockEvaluator';

import type { UserProgress } from '@/types';
import type { NodeUnlockConfig } from '@/types/Unlock';

/**
 * Determines if a node is available for navigation
 *
 * A node is unavailable if:
 * 1. It's locked by L3 convergence (in progress.lockedNodes), OR
 * 2. It has unlock conditions that haven't been met
 */
export function isNodeAvailable(nodeId: string, progress: UserProgress, unlockConfig?: NodeUnlockConfig): boolean {
  // Check L3 convergence lock
  if (progress.lockedNodes?.includes(nodeId)) {
    return false;
  }

  // Check unlock conditions if config exists
  if (unlockConfig) {
    return evaluateNodeUnlock(unlockConfig, progress);
  }

  // No restrictions, node is available
  return true;
}
