import type { CharacterType, JourneyTracking, StoryNode, UserProgress } from '@/types';
import { calculateJourneyPattern, calculatePathPhilosophy } from '@/utils/conditionEvaluator';

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
