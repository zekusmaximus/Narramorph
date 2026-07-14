import type {
  SavedState,
  StoryNode,
  StoryPackageIdentity,
  UserPreferences,
  UserProgress,
} from '@/types';
import { validateSavedState } from '@/utils/validation';

import { CURRENT_STORY_PACKAGE } from './storyPackageIdentity';

export const CURRENT_SAVE_VERSION = '1.1.0';
export const CURRENT_APP_VERSION = '0.1.0';

export type SaveMigration =
  | 'app-version'
  | 'story-package-identity'
  | 'temporal-awareness'
  | 'l2-unlocks'
  | 'l3-convergence';

export interface PreparedSavedState {
  savedState: SavedState;
  migrations: SaveMigration[];
}

/**
 * Builds the persisted envelope without changing the current save schema.
 * Callers provide the timestamp so this boundary remains deterministic in tests.
 */
export function buildSavedState(
  progress: UserProgress,
  preferences: UserPreferences,
  timestamp: string,
  storyPackage: Readonly<StoryPackageIdentity> = CURRENT_STORY_PACKAGE,
): SavedState {
  return {
    version: CURRENT_SAVE_VERSION,
    appVersion: CURRENT_APP_VERSION,
    storyPackage: { ...storyPackage },
    timestamp,
    progress,
    preferences,
  };
}

export function serializeSavedState(savedState: SavedState): string {
  return JSON.stringify(savedState, null, 2);
}

/**
 * Validates and migrates data loaded from persistence.
 *
 * Compatibility assumptions preserved from the original store implementation:
 * - Save 1.0.0 lacked application and story-package identity and migrates to 1.1.0.
 * - Temporal-awareness reconstruction counts unique visited-node records, not total visits.
 * - L2 unlock reconstruction uses only visited L1 nodes that still exist in the loaded story.
 * - Unknown or removed node IDs are ignored rather than invalidating an otherwise valid save.
 */
export function prepareSavedState(
  data: unknown,
  nodes: ReadonlyMap<string, StoryNode>,
): PreparedSavedState | null {
  if (!validateSavedState(data)) {
    return null;
  }

  const savedState = data as
    | SavedState
    | (Omit<SavedState, 'appVersion' | 'storyPackage'> & {
        appVersion?: undefined;
        storyPackage?: undefined;
      });
  const progress: UserProgress = { ...savedState.progress };
  const migrations: SaveMigration[] = [];
  const appVersion = savedState.appVersion || CURRENT_APP_VERSION;
  const storyPackage = savedState.storyPackage
    ? { ...savedState.storyPackage }
    : { ...CURRENT_STORY_PACKAGE };

  if (!savedState.appVersion) {
    migrations.push('app-version');
  }

  if (!savedState.storyPackage) {
    migrations.push('story-package-identity');
  }

  if (progress.temporalAwarenessLevel === undefined) {
    const characterNodesVisited = {
      archaeologist: 0,
      algorithm: 0,
      lastHuman: 0,
    };

    for (const nodeId of Object.keys(progress.visitedNodes)) {
      const node = nodes.get(nodeId);
      if (node?.character === 'archaeologist') {
        characterNodesVisited.archaeologist++;
      } else if (node?.character === 'algorithm') {
        characterNodesVisited.algorithm++;
      } else if (node?.character === 'last-human') {
        characterNodesVisited.lastHuman++;
      }
    }

    const { archaeologist, algorithm, lastHuman } = characterNodesVisited;
    const total = archaeologist + algorithm + lastHuman;
    let temporalAwarenessLevel = 0;

    if (total > 0) {
      const perspectivesVisited = [archaeologist > 0, algorithm > 0, lastHuman > 0].filter(
        Boolean,
      ).length;
      const diversityBonus = perspectivesVisited * 20;
      const explorationScore = Math.min((total / 10) * 40, 40);
      temporalAwarenessLevel = Math.min(diversityBonus + explorationScore, 100);
    }

    progress.characterNodesVisited = characterNodesVisited;
    progress.temporalAwarenessLevel = temporalAwarenessLevel;
    migrations.push('temporal-awareness');
  }

  if (!progress.unlockedL2Characters) {
    const unlockedL2Characters: string[] = [];

    for (const nodeId of Object.keys(progress.visitedNodes)) {
      const node = nodes.get(nodeId);
      if (!node) {
        continue;
      }

      const layerMatch = nodeId.match(/^(arch|arc|algo|hum|algorithm|human)-L?(\d).*$/);
      const layer = layerMatch ? parseInt(layerMatch[2] || '1', 10) : null;
      if (layer === 1 && !unlockedL2Characters.includes(node.character)) {
        unlockedL2Characters.push(node.character);
      }
    }

    progress.unlockedL2Characters = unlockedL2Characters;
    migrations.push('l2-unlocks');
  }

  if (progress.l3ConvergenceTriggered === undefined) {
    progress.l3ConvergenceTriggered = false;
    progress.lockedNodes = [];
    migrations.push('l3-convergence');
  }

  return {
    savedState: {
      ...savedState,
      version: CURRENT_SAVE_VERSION,
      appVersion,
      storyPackage,
      progress,
    },
    migrations,
  };
}
