import { describe, expect, it } from 'vitest';

import { createInitialProgress } from '@/domain/progress/progressModel';
import type { StoryNode } from '@/types';
import type { NodeUnlockConfig, UnlockProgress } from '@/types/Unlock';

import {
  buildConnectionHeatmapRows,
  buildJourneyTrackerPresentation,
  buildNavigationPatternModel,
} from './journeyTrackerPresentation';

describe('journeyTrackerPresentation', () => {
  it('normalizes connection heatmap rows against the strongest connection', () => {
    const rows = buildConnectionHeatmapRows({ arch_algo: 2, arch_hum: 1, algo_hum: 0 });

    expect(rows.map((row) => ({ count: row.count, width: row.widthPercent }))).toEqual([
      { count: 2, width: 100 },
      { count: 1, width: 50 },
      { count: 0, width: 0 },
    ]);
  });

  it('formats navigation pattern labels and numeric details', () => {
    const progress = createInitialProgress();
    progress.journeyTracking.navigationPattern = 'exploratory';
    progress.journeyTracking.explorationMetrics = { breadth: 42.14, depth: 1.234 };
    progress.journeyTracking.revisitFrequency = 12.34;

    expect(buildNavigationPatternModel(progress.journeyTracking)).toMatchObject({
      label: 'Breadth-First Explorer',
      breadth: '42.1%',
      depth: '1.23× avg',
      revisits: '12.3%',
    });
  });

  it('builds next-unlock rows without exposing store objects to the panel', () => {
    const progress = createInitialProgress();
    progress.journeyTracking.crossCharacterConnections = { arch_algo: 1, arch_hum: 1, algo_hum: 1 };
    const node = {
      id: 'arch-L2-accept',
      title: 'Archive Resonance',
      metadata: { chapterTitle: 'Archive Resonance' },
    } as StoryNode;
    const config = { nodeId: node.id } as NodeUnlockConfig;
    const unlockProgress = {
      locked: true,
      progress: 67,
      nextConditionHint: 'Read another fragment',
    } as UnlockProgress;

    const model = buildJourneyTrackerPresentation({
      progress,
      unlockConfigs: [config],
      nodes: new Map([[node.id, node]]),
      getUnlockProgress: () => unlockProgress,
    });

    expect(model.hasFullConsciousnessNetwork).toBe(true);
    expect(model.nextUnlocks).toEqual([
      {
        nodeId: node.id,
        title: 'Archive Resonance',
        progressPercent: 67,
        progressWidthPercent: 67,
        nextConditionHint: 'Read another fragment',
      },
    ]);
  });
});
