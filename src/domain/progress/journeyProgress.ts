import type { CharacterType, JourneyTracking, StoryNode, UserProgress } from '@/types';
import { calculateJourneyPattern, calculatePathPhilosophy } from '@/utils/conditionEvaluator';

import { classifyNavigationPattern, getConnectionKey, normalizeCharacter } from './progressModel';

export type ProgressCharacter = 'archaeologist' | 'algorithm' | 'lastHuman';

type CharacterVisitCounts = UserProgress['characterNodesVisited'];

type CharacterPercentages = JourneyTracking['characterVisitPercentages'];

export function calculateTemporalAwarenessLevel(
  characterNodesVisited: CharacterVisitCounts,
): number {
  const { archaeologist, algorithm, lastHuman } = characterNodesVisited;
  const total = archaeologist + algorithm + lastHuman;

  if (total === 0) {
    return 0;
  }

  const perspectivesVisited = [archaeologist > 0, algorithm > 0, lastHuman > 0].filter(
    Boolean,
  ).length;
  const diversityBonus = perspectivesVisited * 20;
  const explorationScore = Math.min((total / 10) * 40, 40);

  return Math.min(diversityBonus + explorationScore, 100);
}

function toProgressCharacter(character: CharacterType): ProgressCharacter | null {
  if (character === 'archaeologist' || character === 'algorithm') {
    return character;
  }
  if (character === 'last-human') {
    return 'lastHuman';
  }
  return null;
}

export function calculateCharacterVisitPercentages(
  characterNodesVisited: CharacterVisitCounts,
): CharacterPercentages {
  const { archaeologist, algorithm, lastHuman } = characterNodesVisited;
  const total = archaeologist + algorithm + lastHuman;

  if (total === 0) {
    return {
      archaeologist: 0,
      algorithm: 0,
      lastHuman: 0,
    };
  }

  return {
    archaeologist: (archaeologist / total) * 100,
    algorithm: (algorithm / total) * 100,
    lastHuman: (lastHuman / total) * 100,
  };
}

export function determineDominantCharacter(
  percentages: CharacterPercentages,
): ProgressCharacter | null {
  const maxPercentage = Math.max(
    percentages.archaeologist,
    percentages.algorithm,
    percentages.lastHuman,
  );

  if (maxPercentage === 0) {
    return null;
  }
  // Preserve existing tie-breaking behavior from storyStore: archaeologist, then algorithm, then lastHuman.
  if (percentages.archaeologist === maxPercentage) {
    return 'archaeologist';
  }
  if (percentages.algorithm === maxPercentage) {
    return 'algorithm';
  }
  return 'lastHuman';
}

export function calculateJourneyTrackingSnapshot(params: {
  currentTracking: JourneyTracking;
  characterNodesVisited: CharacterVisitCounts;
  readingPath: string[];
  nodes: ReadonlyMap<string, StoryNode>;
}): JourneyTracking {
  const { currentTracking, characterNodesVisited, readingPath, nodes } = params;
  const total =
    characterNodesVisited.archaeologist +
    characterNodesVisited.algorithm +
    characterNodesVisited.lastHuman;

  if (total === 0) {
    return { ...currentTracking };
  }

  const percentages = calculateCharacterVisitPercentages(characterNodesVisited);
  let startingCharacter = currentTracking.startingCharacter;

  if (startingCharacter === null && readingPath.length > 0) {
    const firstNodeId = readingPath[0];
    const firstNode = firstNodeId ? nodes.get(firstNodeId) : undefined;
    if (firstNode) {
      startingCharacter = toProgressCharacter(firstNode.character);
    }
  }

  return {
    ...currentTracking,
    characterVisitPercentages: percentages,
    startingCharacter,
    dominantCharacter: determineDominantCharacter(percentages),
    currentJourneyPattern: calculateJourneyPattern(startingCharacter, percentages),
    dominantPhilosophy: calculatePathPhilosophy(currentTracking.l2Choices),
  };
}

export interface VisitProgressResult {
  progress: UserProgress;
  visitCount: number;
  previousVisitCount: number | null;
  characterSwitch: {
    from: ProgressCharacter;
    to: ProgressCharacter;
  } | null;
}

export function calculateProgressAfterNodeVisit(params: {
  progress: UserProgress;
  node: Pick<StoryNode, 'character'>;
  nodeId: string;
  totalNodes: number;
  now: string;
}): VisitProgressResult {
  const { progress, node, nodeId, totalNodes, now } = params;
  const existingRecord = progress.visitedNodes[nodeId];
  const previousVisitCount = existingRecord?.visitCount ?? null;
  const visitCount = (previousVisitCount ?? 0) + 1;
  const visitedNodes = {
    ...progress.visitedNodes,
    [nodeId]: existingRecord
      ? {
          ...existingRecord,
          visitCount,
          visitTimestamps: [...existingRecord.visitTimestamps, now],
          lastVisited: now,
        }
      : {
          visitCount,
          visitTimestamps: [now],
          currentState: 'initial' as const,
          timeSpent: 0,
          lastVisited: now,
        },
  };

  const characterNodesVisited = { ...progress.characterNodesVisited };
  if (node.character === 'archaeologist') {
    characterNodesVisited.archaeologist++;
  } else if (node.character === 'algorithm') {
    characterNodesVisited.algorithm++;
  } else if (node.character === 'last-human') {
    characterNodesVisited.lastHuman++;
  }

  const currentChar = normalizeCharacter(node.character);
  const lastChar = progress.journeyTracking.lastCharacterVisited;
  const crossCharacterConnections = { ...progress.journeyTracking.crossCharacterConnections };
  let characterSwitch: VisitProgressResult['characterSwitch'] = null;

  if (lastChar && lastChar !== currentChar) {
    const connectionKey = getConnectionKey(lastChar, currentChar);

    if (connectionKey) {
      crossCharacterConnections[connectionKey]++;
      characterSwitch = { from: lastChar, to: currentChar };
    }
  }

  const uniqueVisited = Object.keys(visitedNodes).length;
  const revisits = Object.values(visitedNodes).filter((record) => record.visitCount > 1).length;
  const revisitFrequency = uniqueVisited > 0 ? (revisits / uniqueVisited) * 100 : 0;
  const totalVisitCount = Object.values(visitedNodes).reduce(
    (sum, record) => sum + record.visitCount,
    0,
  );
  const explorationMetrics = {
    breadth: totalNodes > 0 ? (uniqueVisited / totalNodes) * 100 : 0,
    depth: uniqueVisited > 0 ? totalVisitCount / uniqueVisited : 0,
  };
  const journeyTracking = {
    ...progress.journeyTracking,
    crossCharacterConnections,
    lastCharacterVisited: currentChar,
    revisitFrequency,
    explorationMetrics,
  };

  return {
    progress: {
      ...progress,
      visitedNodes,
      characterNodesVisited,
      journeyTracking: {
        ...journeyTracking,
        navigationPattern: classifyNavigationPattern(journeyTracking),
      },
      readingPath: [...progress.readingPath, nodeId],
      lastActiveTimestamp: now,
    },
    visitCount,
    previousVisitCount,
    characterSwitch,
  };
}

export type CoreL2Philosophy = 'accept' | 'resist' | 'invest';

export interface ProgressionAfterNodeVisitResult {
  progress: UserProgress;
  shouldClearL3AssemblyCache: boolean;
}

export function getStoryLayerFromNodeId(nodeId: string): number | null {
  const layerMatch = nodeId.match(/^(arch|arc|algo|hum|algorithm|human)-L?(\d).*$/);
  if (!layerMatch) {
    return null;
  }

  return parseInt(layerMatch[2] || '1', 10);
}

export function isCoreL2Philosophy(philosophy: string | null): philosophy is CoreL2Philosophy {
  return philosophy === 'accept' || philosophy === 'resist' || philosophy === 'invest';
}

export function calculateProgressionAfterNodeVisit(params: {
  progress: UserProgress;
  node: Pick<StoryNode, 'character'>;
  nodeId: string;
  nodePhilosophy: string | null;
}): ProgressionAfterNodeVisitResult {
  const { progress, node, nodeId, nodePhilosophy } = params;
  const layer = getStoryLayerFromNodeId(nodeId);
  const unlockedL2Characters = [...progress.unlockedL2Characters];
  const l2Choices = { ...progress.journeyTracking.l2Choices };

  if (layer === 1 && !unlockedL2Characters.includes(node.character)) {
    unlockedL2Characters.push(node.character);
  }

  if (isCoreL2Philosophy(nodePhilosophy)) {
    l2Choices[nodePhilosophy]++;
  }

  return {
    progress: {
      ...progress,
      unlockedL2Characters,
      journeyTracking: {
        ...progress.journeyTracking,
        l2Choices,
      },
    },
    shouldClearL3AssemblyCache: layer === 2,
  };
}
