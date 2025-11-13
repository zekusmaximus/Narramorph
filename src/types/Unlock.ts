/**
 * Unlock System Types
 *
 * Defines all types for configurable node unlocking based on:
 * - Visit counts (total, per-node, per-character, per-layer)
 * - Temporal awareness levels
 * - Philosophy choices
 * - Character exploration requirements
 * - Transformation states
 * - Compound conditions (AND/OR/NOT logic)
 */

import type { PathPhilosophy } from './Variation';
import type { TransformationState } from './Node';

/**
 * Types of unlock conditions supported by the system
 */
export type UnlockConditionType =
  | 'visitCount'       // Requires visiting specific nodes or quantities
  | 'awareness'        // Requires temporal awareness threshold
  | 'philosophy'       // Requires specific L2 philosophy choices
  | 'character'        // Requires exploring specific characters
  | 'transformation'   // Requires achieving transformation states
  | 'l3Assembly'       // Requires completing L3 assembly
  | 'compound';        // Combines multiple conditions with AND/OR logic

/**
 * Parameters for each condition type
 */
export interface UnlockConditionParams {
  // Visit count conditions
  totalVisits?: number;                      // Minimum total nodes visited
  nodeVisits?: Record<string, number>;       // Specific nodes with min visit counts
  characterVisits?: Record<string, number>;  // Min visits per character (e.g., {"archaeologist": 3})
  layerVisits?: Record<number, number>;      // Min visits per layer (e.g., {1: 2, 2: 1})

  // Awareness conditions
  minAwareness?: number;                     // Minimum temporal awareness (0-100)
  maxAwareness?: number;                     // Maximum temporal awareness (0-100)

  // Philosophy conditions
  requiredPhilosophy?: PathPhilosophy | PathPhilosophy[];  // Required philosophy choice(s)
  minPhilosophyCount?: number;              // Minimum number of L2 choices made
  philosophyDistribution?: {                // Require specific L2 choice distribution
    accept?: number;
    resist?: number;
    invest?: number;
  };

  // Character conditions
  requiredCharacters?: string[];            // Must have visited these characters
  minCharacterCount?: number;               // Minimum unique characters explored
  minCharacterPercentage?: Record<string, number>; // Min % of visits for each char

  // Transformation conditions
  requiredTransformations?: TransformationState[];  // Must have seen these states
  minMetaAwareNodes?: number;              // Minimum nodes in metaAware state

  // L3 Assembly conditions
  minL3Assemblies?: number;                // Minimum L3 assemblies viewed
  requiredL3Completion?: boolean;          // Must have completed all L3 sections

  // Compound conditions
  operator?: 'AND' | 'OR' | 'NOT';         // Logical operator for combining conditions
  conditions?: UnlockCondition[];          // Nested conditions for compound logic
}

/**
 * Single unlock condition with evaluation parameters
 */
export interface UnlockCondition {
  id: string;                              // Unique identifier for this condition
  type: UnlockConditionType;               // Type of condition to evaluate
  params: UnlockConditionParams;           // Parameters for this condition type
  description: string;                     // Human-readable description for UI
  hint?: string;                           // Optional hint about how to satisfy condition
}

/**
 * Complete unlock configuration for a single node
 */
export interface NodeUnlockConfig {
  nodeId: string;                          // Node this config applies to
  layer: number;                           // Layer number (for organization)
  defaultLocked: boolean;                  // Whether node starts locked
  unlockConditions: UnlockCondition[];     // All conditions that must be met
  lockedMessage: string;                   // Message shown when locked
  unlockMessage?: string;                  // Message shown in notification when unlocked
  priority?: number;                       // Display priority (higher = more important)
}

/**
 * Progress toward unlocking a specific node
 */
export interface UnlockProgress {
  nodeId: string;                          // Node being tracked
  locked: boolean;                         // Current locked status
  progress: number;                        // Percentage complete (0-100)
  conditionsMet: string[];                 // IDs of satisfied conditions
  conditionsNotMet: string[];              // IDs of unsatisfied conditions
  nextCondition?: UnlockCondition;         // Most actionable unmet condition
  nextConditionHint: string;               // What to do next
}

/**
 * Complete unlock configuration file structure
 */
export interface UnlockConfigFile {
  version: string;                         // Config file version for migrations
  nodes: NodeUnlockConfig[];               // All node unlock configurations
}
