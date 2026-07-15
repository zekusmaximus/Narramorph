import type {
  Connection,
  JourneyTracking,
  ReadingStats,
  StoryNode,
  TransformationState,
  UnlockedTransformation,
  UserPreferences,
  UserProgress,
  VisitRecord,
} from '@/types';

type JourneyCharacter = 'archaeologist' | 'algorithm' | 'lastHuman';

export function createInitialJourneyTracking(): JourneyTracking {
  return {
    startingCharacter: null,
    characterVisitPercentages: {
      archaeologist: 0,
      algorithm: 0,
      lastHuman: 0,
    },
    dominantCharacter: null,
    currentJourneyPattern: 'unknown',
    l2Choices: {
      accept: 0,
      resist: 0,
      invest: 0,
    },
    dominantPhilosophy: 'unknown',
    crossCharacterConnections: {
      arch_algo: 0,
      arch_hum: 0,
      algo_hum: 0,
    },
    navigationPattern: 'undetermined',
    lastCharacterVisited: null,
    revisitFrequency: 0,
    explorationMetrics: {
      breadth: 0,
      depth: 0,
    },
  };
}

export function createInitialProgress(now = new Date().toISOString()): UserProgress {
  return {
    visitedNodes: {},
    readingPath: [],
    selectionRecords: [],
    unlockedConnections: [],
    specialTransformations: [],
    totalTimeSpent: 0,
    lastActiveTimestamp: now,
    temporalAwarenessLevel: 0,
    characterNodesVisited: {
      archaeologist: 0,
      algorithm: 0,
      lastHuman: 0,
    },
    journeyTracking: createInitialJourneyTracking(),
    unlockedL2Characters: [],
    l3ConvergenceTriggered: false,
    lockedNodes: [],
  };
}

export function createInitialPreferences(): UserPreferences {
  return {
    textSize: 'medium',
    theme: 'light',
    reduceMotion: false,
    showTutorial: true,
    showReadingStats: true,
  };
}

export function createInitialStats(): ReadingStats {
  return {
    totalNodesVisited: 0,
    totalNodes: 0,
    percentageExplored: 0,
    totalTimeSpent: 0,
    averageTimePerNode: 0,
    transformationsAvailable: 0,
    criticalPathNodesVisited: 0,
    criticalPathNodesTotal: 0,
    characterBreakdown: {
      archaeologist: { visited: 0, total: 0 },
      algorithm: { visited: 0, total: 0 },
      lastHuman: { visited: 0, total: 0 },
    },
  };
}

export function determineTransformationState(
  nodeId: string,
  visitRecord: VisitRecord | undefined,
  unlockedTransformations: UnlockedTransformation[],
  temporalAwarenessLevel: number,
): TransformationState {
  if (unlockedTransformations.some((transformation) => transformation.nodeId === nodeId)) {
    return 'metaAware';
  }

  const visitCount = visitRecord?.visitCount ?? 0;
  if (visitCount === 1) {
    return 'initial';
  }
  if (visitCount === 2) {
    return 'firstRevisit';
  }
  if (visitCount >= 3 || temporalAwarenessLevel > 50) {
    return 'metaAware';
  }
  return 'firstRevisit';
}

export function checkSpecialTransformations(
  _visitedNodeId: string,
  nodes: StoryNode[],
  progress: UserProgress,
  now = new Date().toISOString(),
): UnlockedTransformation[] {
  const newlyUnlocked: UnlockedTransformation[] = [];

  for (const node of nodes) {
    if (!node.unlockConditions?.specialTransforms) {
      continue;
    }

    for (const transform of node.unlockConditions.specialTransforms) {
      const alreadyUnlocked = progress.specialTransformations.some(
        (transformation) =>
          transformation.nodeId === node.id && transformation.transformationId === transform.id,
      );
      if (alreadyUnlocked) {
        continue;
      }

      const hasRequiredNodes = transform.requiredPriorNodes.every(
        (requiredNodeId) => progress.visitedNodes[requiredNodeId],
      );
      if (!hasRequiredNodes) {
        continue;
      }

      if (transform.requiredSequence) {
        const pathString = progress.readingPath.join(',');
        const sequenceString = transform.requiredSequence.join(',');
        if (!pathString.includes(sequenceString)) {
          continue;
        }
      }

      newlyUnlocked.push({
        nodeId: node.id,
        transformationId: transform.id,
        unlockedAt: now,
      });
    }
  }

  return newlyUnlocked;
}

export function shouldRevealConnection(connection: Connection, progress: UserProgress): boolean {
  if (!connection.revealConditions) {
    return true;
  }

  const { requiredVisits, requiredSequence } = connection.revealConditions;
  if (requiredVisits) {
    for (const [nodeId, minCount] of Object.entries(requiredVisits)) {
      const visitRecord = progress.visitedNodes[nodeId];
      if (!visitRecord || visitRecord.visitCount < minCount) {
        return false;
      }
    }
  }

  if (requiredSequence) {
    const pathString = progress.readingPath.join(',');
    const sequenceString = requiredSequence.join(',');
    if (!pathString.includes(sequenceString)) {
      return false;
    }
  }

  return true;
}

export function findNewlyRevealedConnectionIds(
  connections: ReadonlyMap<string, Connection>,
  progress: UserProgress,
): string[] {
  const newlyRevealedConnectionIds: string[] = [];

  for (const [connectionId, connection] of connections) {
    if (
      shouldRevealConnection(connection, progress) &&
      !progress.unlockedConnections.includes(connectionId)
    ) {
      newlyRevealedConnectionIds.push(connectionId);
    }
  }

  return newlyRevealedConnectionIds;
}

export function normalizeCharacter(character: string): JourneyCharacter {
  const normalizedCharacter = character.toLowerCase();
  if (normalizedCharacter.includes('arch')) {
    return 'archaeologist';
  }
  if (normalizedCharacter.includes('algo')) {
    return 'algorithm';
  }
  if (normalizedCharacter.includes('hum') || normalizedCharacter.includes('last')) {
    return 'lastHuman';
  }
  return 'archaeologist';
}

export function getConnectionKey(
  from: JourneyCharacter,
  to: JourneyCharacter,
): keyof JourneyTracking['crossCharacterConnections'] | null {
  if (from === to) {
    return null;
  }

  const [first, second] = [from, to].sort();
  if (first === 'algorithm' && second === 'archaeologist') {
    return 'arch_algo';
  }
  if (first === 'archaeologist' && second === 'lastHuman') {
    return 'arch_hum';
  }
  if (first === 'algorithm' && second === 'lastHuman') {
    return 'algo_hum';
  }
  return null;
}

export function classifyNavigationPattern(
  tracking: JourneyTracking,
): 'linear' | 'exploratory' | 'recursive' | 'undetermined' {
  const { revisitFrequency, explorationMetrics } = tracking;
  const { breadth, depth } = explorationMetrics;

  if (breadth < 10) {
    return 'undetermined';
  }
  if (revisitFrequency > 40 && depth > 2) {
    return 'recursive';
  }

  const totalConnections = Object.values(tracking.crossCharacterConnections).reduce(
    (sum, count) => sum + count,
    0,
  );
  if (breadth > 50 && depth < 2 && totalConnections > 5) {
    return 'exploratory';
  }
  if (revisitFrequency < 20 && depth < 1.5) {
    return 'linear';
  }
  return 'undetermined';
}
