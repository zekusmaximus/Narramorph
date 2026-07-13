import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';
import { useStoryStore } from '@/stores/storyStore';

import { buildLayoutPresentation, type LayoutAdapterState } from './layoutPresentation';

export function useLayoutStateAdapter(): LayoutAdapterState {
  const progress = useStoryStore((state) => state.progress);
  const nodes = useStoryStore((state) => state.nodes);
  const stats = useStoryStore((state) => state.getReadingStats());
  const preferences = useStoryStore((state) => state.preferences);
  const reduceMotion = useReducedMotionPreference();

  return {
    preferences,
    progress,
    stats,
    nodes,
    reduceMotion,
    shell: buildLayoutPresentation({
      visitedNodes: progress.visitedNodes,
      totalNodes: nodes.size,
    }),
  };
}
