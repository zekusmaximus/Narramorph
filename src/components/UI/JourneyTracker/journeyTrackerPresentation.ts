import type { JourneyPattern, PathPhilosophy, StoryNode, UserProgress } from '@/types';
import type { NodeUnlockConfig, UnlockProgress } from '@/types/Unlock';

export const journeyPatternLabels: Record<JourneyPattern, string> = {
  'started-stayed': 'Started & Stayed',
  'started-bounced': 'Started & Bounced',
  'shifted-dominant': 'Shifted Dominant',
  'began-lightly': 'Began Lightly',
  'met-later': 'Met Later',
  unknown: 'Unknown',
};

export const philosophyLabels: Record<PathPhilosophy, string> = {
  accept: 'Acceptance',
  resist: 'Resistance',
  invest: 'Investigation',
  mixed: 'Mixed',
  unknown: 'Unknown',
};

export interface ConnectionHeatmapRow {
  from: string;
  to: string;
  count: number;
  color: string;
  widthPercent: number;
}

export interface NavigationPatternModel {
  label: string;
  description: string;
  colorClass: string;
  glyph: string;
  breadth: string;
  depth: string;
  revisits: string;
}

export interface NextUnlockPreviewItem {
  nodeId: string;
  title: string;
  progressPercent: number;
  progressWidthPercent: number;
  nextConditionHint?: string;
}

export interface JourneyTrackerPresentationModel {
  progress: UserProgress;
  connectionRows: ConnectionHeatmapRow[];
  hasFullConsciousnessNetwork: boolean;
  navigationPattern: NavigationPatternModel;
  nextUnlocks: NextUnlockPreviewItem[];
}

export function buildConnectionHeatmapRows(
  connections: UserProgress['journeyTracking']['crossCharacterConnections'],
): ConnectionHeatmapRow[] {
  const maxConnections = Math.max(...Object.values(connections), 1);
  return [
    {
      from: 'Archaeologist',
      to: 'Algorithm',
      count: connections.arch_algo,
      color: 'from-blue-500 to-green-500',
    },
    {
      from: 'Archaeologist',
      to: 'Last Human',
      count: connections.arch_hum,
      color: 'from-blue-500 to-red-500',
    },
    {
      from: 'Algorithm',
      to: 'Last Human',
      count: connections.algo_hum,
      color: 'from-green-500 to-red-500',
    },
  ].map((row) => ({ ...row, widthPercent: (row.count / maxConnections) * 100 }));
}

export function buildNavigationPatternModel(
  tracking: UserProgress['journeyTracking'],
): NavigationPatternModel {
  const patternLabels = {
    linear: 'Linear Explorer',
    exploratory: 'Breadth-First Explorer',
    recursive: 'Depth-First Investigator',
    undetermined: 'Early Exploration',
  };
  const patternDescriptions = {
    linear: 'Sequential progression through narrative threads',
    exploratory: 'Wide sampling across multiple perspectives',
    recursive: 'Deep engagement with core nodes',
    undetermined: 'Establishing navigation patterns',
  };
  const patternColors = {
    linear: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
    exploratory: 'text-green-400 border-green-500/30 bg-green-500/10',
    recursive: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
    undetermined: 'text-gray-400 border-gray-500/30 bg-gray-500/10',
  };
  const patternGlyphs = { linear: '→', exploratory: '⊹', recursive: '⥁', undetermined: '◇' };

  return {
    label: patternLabels[tracking.navigationPattern],
    description: patternDescriptions[tracking.navigationPattern],
    colorClass: patternColors[tracking.navigationPattern],
    glyph: patternGlyphs[tracking.navigationPattern],
    breadth: `${tracking.explorationMetrics.breadth.toFixed(1)}%`,
    depth: `${tracking.explorationMetrics.depth.toFixed(2)}× avg`,
    revisits: `${tracking.revisitFrequency.toFixed(1)}%`,
  };
}

export function buildNextUnlockPreview(params: {
  unlockConfigs: Iterable<NodeUnlockConfig>;
  getUnlockProgress: (nodeId: string) => UnlockProgress | null;
  nodes: ReadonlyMap<string, StoryNode>;
}): NextUnlockPreviewItem[] {
  return Array.from(params.unlockConfigs)
    .map((config) => ({
      config,
      progress: params.getUnlockProgress(config.nodeId),
      node: params.nodes.get(config.nodeId),
    }))
    .filter((item) => item.progress?.locked && item.node)
    .sort((left, right) => (right.progress?.progress ?? 0) - (left.progress?.progress ?? 0))
    .slice(0, 3)
    .map(({ config, progress, node }) => ({
      nodeId: config.nodeId,
      title: node?.metadata.chapterTitle || config.nodeId,
      progressPercent: Math.round(progress?.progress ?? 0),
      progressWidthPercent: progress?.progress ?? 0,
      nextConditionHint: progress?.nextConditionHint,
    }));
}

export function buildJourneyTrackerPresentation(params: {
  progress: UserProgress;
  unlockConfigs: Iterable<NodeUnlockConfig>;
  getUnlockProgress: (nodeId: string) => UnlockProgress | null;
  nodes: ReadonlyMap<string, StoryNode>;
}): JourneyTrackerPresentationModel {
  const connectionRows = buildConnectionHeatmapRows(
    params.progress.journeyTracking.crossCharacterConnections,
  );
  return {
    progress: params.progress,
    connectionRows,
    hasFullConsciousnessNetwork: connectionRows.every((row) => row.count > 0),
    navigationPattern: buildNavigationPatternModel(params.progress.journeyTracking),
    nextUnlocks: buildNextUnlockPreview(params),
  };
}
