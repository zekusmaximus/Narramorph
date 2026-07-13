import { useStoryStore } from '@/stores';

import {
  buildJourneyTrackerPresentation,
  type JourneyTrackerPresentationModel,
} from './journeyTrackerPresentation';

export function useJourneyTrackerAdapter(): JourneyTrackerPresentationModel {
  const progress = useStoryStore((state) => state.progress);
  const unlockConfigs = useStoryStore((state) => state.unlockConfigs);
  const getUnlockProgress = useStoryStore((state) => state.getUnlockProgress);
  const nodes = useStoryStore((state) => state.nodes);

  return buildJourneyTrackerPresentation({
    progress,
    unlockConfigs: unlockConfigs.values(),
    getUnlockProgress,
    nodes,
  });
}
