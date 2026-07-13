import type { ReadingStats, StoryNode, UserPreferences, UserProgress } from '@/types';

export interface LayoutPresentationModel {
  visitedCount: number;
  totalNodes: number;
  progressPercent: number;
  progressLabel: string;
}

export interface LayoutAdapterState {
  preferences: UserPreferences;
  progress: UserProgress;
  stats: ReadingStats;
  nodes: ReadonlyMap<string, StoryNode>;
  reduceMotion: boolean;
  shell: LayoutPresentationModel;
}

export function buildLayoutPresentation(params: {
  visitedNodes: Readonly<Record<string, unknown>>;
  totalNodes: number;
}): LayoutPresentationModel {
  const visitedCount = Object.keys(params.visitedNodes).length;
  const progressPercent =
    params.totalNodes > 0 ? Math.round((visitedCount / params.totalNodes) * 100) : 0;

  return {
    visitedCount,
    totalNodes: params.totalNodes,
    progressPercent,
    progressLabel: `${visitedCount} of ${params.totalNodes} fragments visited, ${progressPercent} percent complete`,
  };
}
