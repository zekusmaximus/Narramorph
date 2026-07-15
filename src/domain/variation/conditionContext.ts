import type { ConditionContext, UserProgress } from '@/types';

export interface ConditionContextOptions {
  includeRecentVariations?: boolean;
}

/**
 * Builds the reader-state snapshot consumed by variation selection.
 * Recent variation IDs remain opt-in because L3 assembly and other callers do
 * not need de-duplication history in their selection context.
 */
export function buildConditionContext(
  progress: UserProgress,
  nodeId?: string,
  options?: ConditionContextOptions,
): ConditionContext {
  const tracking = progress.journeyTracking;
  const visitRecord = nodeId ? progress.visitedNodes[nodeId] : undefined;
  const context: ConditionContext = {
    nodeId: nodeId || '',
    awareness: progress.temporalAwarenessLevel,
    journeyPattern: tracking.currentJourneyPattern,
    pathPhilosophy: tracking.dominantPhilosophy,
    visitCount: visitRecord?.visitCount || 0,
    transformationState: visitRecord?.currentState || 'initial',
    characterVisitPercentages: tracking.characterVisitPercentages,
    readingPath: [...progress.readingPath],
    visitCounts: Object.fromEntries(
      Object.entries(progress.visitedNodes).map(([visitedNodeId, record]) => [
        visitedNodeId,
        record.visitCount,
      ]),
    ),
    startingCharacter: tracking.startingCharacter,
  };

  if (options?.includeRecentVariations && visitRecord?.recentVariationIds) {
    context.recentVariationIds = visitRecord.recentVariationIds;
  }

  return context;
}
