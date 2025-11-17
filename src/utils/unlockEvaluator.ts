/**
 * Unlock Evaluator - Pure evaluation logic for unlock conditions
 *
 * This module provides functions to evaluate whether unlock conditions are met
 * based on user progress. All functions are pure (no side effects) and highly testable.
 */

import type { UserProgress } from '@/types/Store';
import type {
  UnlockCondition,
  UnlockConditionParams,
  NodeUnlockConfig,
  UnlockProgress,
} from '@/types/Unlock';

import { getNodeLayer } from './nodeUtils';

/**
 * Evaluate a single unlock condition
 *
 * @param condition - The condition to evaluate
 * @param progress - User's current progress
 * @returns true if condition is satisfied, false otherwise
 */
export function evaluateUnlockCondition(
  condition: UnlockCondition,
  progress: UserProgress,
): boolean {
  switch (condition.type) {
    case 'visitCount':
      return evaluateVisitCountCondition(condition.params, progress);
    case 'awareness':
      return evaluateAwarenessCondition(condition.params, progress);
    case 'philosophy':
      return evaluatePhilosophyCondition(condition.params, progress);
    case 'character':
      return evaluateCharacterCondition(condition.params, progress);
    case 'transformation':
      return evaluateTransformationCondition(condition.params, progress);
    case 'l3Assembly':
      return evaluateL3AssemblyCondition(condition.params, progress);
    case 'compound':
      return evaluateCompoundCondition(condition.params, progress);
    default:
      console.warn('[UnlockEval] Unknown condition type:', condition.type);
      return false;
  }
}

/**
 * Evaluate visit count condition
 */
function evaluateVisitCountCondition(
  params: UnlockConditionParams,
  progress: UserProgress,
): boolean {
  // Total visits check
  if (params.totalVisits !== undefined) {
    const totalVisits = Object.keys(progress.visitedNodes).length;
    if (totalVisits < params.totalVisits) {
      return false;
    }
  }

  // Minimum aggregate visits across all nodes (counts revisits)
  if (params.minTotalVisits !== undefined) {
    const aggregateVisits = Object.values(progress.visitedNodes).reduce(
      (sum, record) => sum + (record.visitCount || 0),
      0,
    );

    if (aggregateVisits < params.minTotalVisits) {
      return false;
    }
  }

  // Specific node visits
  if (params.nodeVisits) {
    for (const [nodeId, minCount] of Object.entries(params.nodeVisits)) {
      const visitRecord = progress.visitedNodes[nodeId];
      if (!visitRecord || visitRecord.visitCount < minCount) {
        return false;
      }
    }
  }

  // Character visits
  if (params.characterVisits) {
    for (const [character, minCount] of Object.entries(params.characterVisits)) {
      const charVisits =
        progress.characterNodesVisited[character as keyof typeof progress.characterNodesVisited] ||
        0;
      if (charVisits < minCount) {
        return false;
      }
    }
  }

  // Layer visits
  if (params.layerVisits) {
    for (const [layerStr, minCount] of Object.entries(params.layerVisits)) {
      const layer = parseInt(layerStr, 10);
      const layerVisits = Object.keys(progress.visitedNodes).filter((nodeId) => {
        return getNodeLayer(nodeId) === layer;
      }).length;

      if (layerVisits < minCount) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Evaluate awareness condition
 */
function evaluateAwarenessCondition(
  params: UnlockConditionParams,
  progress: UserProgress,
): boolean {
  const awareness = progress.temporalAwarenessLevel || 0;

  if (params.minAwareness !== undefined && awareness < params.minAwareness) {
    return false;
  }

  if (params.maxAwareness !== undefined && awareness > params.maxAwareness) {
    return false;
  }

  return true;
}

/**
 * Evaluate philosophy condition
 */
function evaluatePhilosophyCondition(
  params: UnlockConditionParams,
  progress: UserProgress,
): boolean {
  const tracking = progress.journeyTracking;

  // Required philosophy check
  if (params.requiredPhilosophy) {
    const required = Array.isArray(params.requiredPhilosophy)
      ? params.requiredPhilosophy
      : [params.requiredPhilosophy];

    if (!required.includes(tracking.dominantPhilosophy)) {
      return false;
    }
  }

  // Minimum philosophy count
  if (params.minPhilosophyCount !== undefined) {
    const totalChoices = tracking.l2Choices
      ? Object.values(tracking.l2Choices).reduce((a, b) => a + b, 0)
      : 0;

    if (totalChoices < params.minPhilosophyCount) {
      return false;
    }
  }

  // Philosophy distribution
  if (params.philosophyDistribution && tracking.l2Choices) {
    const { accept, resist, invest } = params.philosophyDistribution;
    const counts = tracking.l2Choices;

    if (accept !== undefined && (counts.accept || 0) < accept) {
      return false;
    }
    if (resist !== undefined && (counts.resist || 0) < resist) {
      return false;
    }
    if (invest !== undefined && (counts.invest || 0) < invest) {
      return false;
    }
  }

  return true;
}

/**
 * Evaluate character condition
 */
function evaluateCharacterCondition(
  params: UnlockConditionParams,
  progress: UserProgress,
): boolean {
  const tracking = progress.journeyTracking;

  // Required characters check
  if (params.requiredCharacters) {
    const visitedChars = Object.entries(tracking.characterVisitPercentages)
      .filter(([_, percentage]) => percentage > 0)
      .map(([char, _]) => char);

    for (const requiredChar of params.requiredCharacters) {
      if (!visitedChars.includes(requiredChar)) {
        return false;
      }
    }
  }

  // Minimum character count
  if (params.minCharacterCount !== undefined) {
    const uniqueChars = Object.values(tracking.characterVisitPercentages).filter(
      (percentage) => percentage > 0,
    ).length;

    if (uniqueChars < params.minCharacterCount) {
      return false;
    }
  }

  // Character percentage requirements
  if (params.minCharacterPercentage) {
    for (const [character, minPercent] of Object.entries(params.minCharacterPercentage)) {
      const actualPercent =
        tracking.characterVisitPercentages[
          character as keyof typeof tracking.characterVisitPercentages
        ] || 0;
      if (actualPercent < minPercent) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Evaluate transformation condition
 */
function evaluateTransformationCondition(
  params: UnlockConditionParams,
  progress: UserProgress,
): boolean {
  // Required transformation states
  if (params.requiredTransformations) {
    const transformationStates = new Set(
      Object.values(progress.visitedNodes).map((record) => record.currentState),
    );

    for (const requiredState of params.requiredTransformations) {
      if (!transformationStates.has(requiredState)) {
        return false;
      }
    }
  }

  // Minimum meta-aware nodes
  if (params.minMetaAwareNodes !== undefined) {
    const metaAwareCount = Object.values(progress.visitedNodes).filter(
      (record) => record.currentState === 'metaAware',
    ).length;

    if (metaAwareCount < params.minMetaAwareNodes) {
      return false;
    }
  }

  return true;
}

/**
 * Evaluate L3 assembly condition
 */
function evaluateL3AssemblyCondition(
  params: UnlockConditionParams,
  progress: UserProgress,
): boolean {
  const assemblies = progress.l3AssembliesViewed || [];

  // Minimum L3 assemblies viewed
  if (params.minL3Assemblies !== undefined) {
    if (assemblies.length < params.minL3Assemblies) {
      return false;
    }
  }

  // Required L3 completion (all 4 sections read)
  if (params.requiredL3Completion && assemblies.length > 0) {
    const latestAssembly = assemblies[assemblies.length - 1];
    if (!latestAssembly) {
      return false;
    }
    const allSectionsRead = Object.values(latestAssembly.sectionsRead).every((read) => read);

    if (!allSectionsRead) {
      return false;
    }
  }

  return true;
}

/**
 * Evaluate compound condition (AND/OR/NOT logic)
 */
function evaluateCompoundCondition(params: UnlockConditionParams, progress: UserProgress): boolean {
  if (!params.conditions || params.conditions.length === 0) {
    console.warn('[UnlockEval] Compound condition has no nested conditions');
    return false;
  }

  const results = params.conditions.map((condition) =>
    evaluateUnlockCondition(condition, progress),
  );

  switch (params.operator) {
    case 'AND':
      return results.every((result) => result);
    case 'OR':
      return results.some((result) => result);
    case 'NOT':
      // NOT operator: all nested conditions must be false
      return results.every((result) => !result);
    default:
      console.warn('[UnlockEval] Unknown compound operator:', params.operator);
      return false;
  }
}

/**
 * Evaluate if a node is unlocked based on its configuration
 *
 * @param config - Node unlock configuration
 * @param progress - User's current progress
 * @returns true if node is unlocked, false if locked
 */
export function evaluateNodeUnlock(config: NodeUnlockConfig, progress: UserProgress): boolean {
  // If not locked by default, always accessible
  if (!config.defaultLocked) {
    return true;
  }

  // All conditions must be met (implicit AND)
  return config.unlockConditions.every((condition) => evaluateUnlockCondition(condition, progress));
}

/**
 * Get detailed unlock progress for a node
 *
 * @param config - Node unlock configuration
 * @param progress - User's current progress
 * @returns Detailed progress information
 */
export function getUnlockProgress(
  config: NodeUnlockConfig,
  progress: UserProgress,
): UnlockProgress {
  const conditionResults = config.unlockConditions.map((condition) => ({
    id: condition.id,
    met: evaluateUnlockCondition(condition, progress),
    condition,
  }));

  const metCount = conditionResults.filter((r) => r.met).length;
  const totalCount = conditionResults.length;
  const progressPercent = totalCount > 0 ? (metCount / totalCount) * 100 : 100;

  const conditionsMet = conditionResults.filter((r) => r.met).map((r) => r.id);

  const conditionsNotMet = conditionResults.filter((r) => !r.met).map((r) => r.id);

  // Find most actionable unmet condition (first one)
  const nextUnmetCondition = conditionResults.find((r) => !r.met);

  return {
    nodeId: config.nodeId,
    locked: !evaluateNodeUnlock(config, progress),
    progress: progressPercent,
    conditionsMet,
    conditionsNotMet,
    nextCondition: nextUnmetCondition?.condition,
    nextConditionHint: nextUnmetCondition
      ? nextUnmetCondition.condition.hint || nextUnmetCondition.condition.description
      : 'All conditions met!',
  };
}

/**
 * Generate human-readable hint for next action
 * (Enhanced version used in UI tooltips)
 */
export function generateActionableHint(condition: UnlockCondition, progress: UserProgress): string {
  switch (condition.type) {
    case 'visitCount':
      return generateVisitCountHint(condition.params, progress);
    case 'awareness':
      return generateAwarenessHint(condition.params, progress);
    case 'philosophy':
      return generatePhilosophyHint(condition.params, progress);
    case 'character':
      return generateCharacterHint(condition.params, progress);
    case 'l3Assembly':
      return 'Complete a Layer 3 convergence assembly';
    default:
      return condition.description;
  }
}

function generateVisitCountHint(params: UnlockConditionParams, progress: UserProgress): string {
  if (params.layerVisits) {
    for (const [layerStr, minCount] of Object.entries(params.layerVisits)) {
      const layer = parseInt(layerStr, 10);
      const current = Object.keys(progress.visitedNodes).filter(
        (nodeId) => getNodeLayer(nodeId) === layer,
      ).length;

      if (current < minCount) {
        return `Visit ${minCount - current} more Layer ${layer} node${minCount - current > 1 ? 's' : ''}`;
      }
    }
  }

  if (params.characterVisits) {
    for (const [character, minCount] of Object.entries(params.characterVisits)) {
      const current =
        progress.characterNodesVisited[character as keyof typeof progress.characterNodesVisited] ||
        0;
      if (current < minCount) {
        return `Explore ${minCount - current} more ${character} node${minCount - current > 1 ? 's' : ''}`;
      }
    }
  }

  return 'Continue exploring nodes';
}

function generateAwarenessHint(params: UnlockConditionParams, progress: UserProgress): string {
  const current = progress.temporalAwarenessLevel || 0;

  if (params.minAwareness !== undefined && current < params.minAwareness) {
    const needed = params.minAwareness - current;
    return `Increase temporal awareness by ${needed.toFixed(0)}% (explore multiple characters)`;
  }

  return 'Reach required awareness level';
}

function generatePhilosophyHint(params: UnlockConditionParams, progress: UserProgress): string {
  if (params.minPhilosophyCount !== undefined) {
    const tracking = progress.journeyTracking;
    const current = tracking?.l2Choices
      ? Object.values(tracking.l2Choices).reduce((a, b) => a + b, 0)
      : 0;

    if (current < params.minPhilosophyCount) {
      return `Make ${params.minPhilosophyCount - current} more Layer 2 choice${params.minPhilosophyCount - current > 1 ? 's' : ''}`;
    }
  }

  return 'Make required philosophy choices';
}

function generateCharacterHint(params: UnlockConditionParams, progress: UserProgress): string {
  if (params.minCharacterCount !== undefined) {
    const tracking = progress.journeyTracking;
    const current = tracking
      ? Object.values(tracking.characterVisitPercentages).filter((p) => p > 0).length
      : 0;

    if (current < params.minCharacterCount) {
      return `Explore ${params.minCharacterCount - current} more character perspective${params.minCharacterCount - current > 1 ? 's' : ''}`;
    }
  }

  if (params.requiredCharacters) {
    const tracking = progress.journeyTracking;
    const visited = tracking
      ? Object.entries(tracking.characterVisitPercentages)
          .filter(([_, p]) => p > 0)
          .map(([char, _]) => char)
      : [];

    const unvisited = params.requiredCharacters.filter((char) => !visited.includes(char));
    if (unvisited.length > 0) {
      return `Explore the ${unvisited[0]} perspective`;
    }
  }

  return 'Explore required characters';
}
