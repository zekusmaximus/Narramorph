/**
 * Type definitions for the variation system, journey patterns, and L3 assembly
 */

import type { TransformationState } from './Node';

export type JourneyCharacter = 'archaeologist' | 'algorithm' | 'lastHuman';

export type NumericComparison = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte';

export type JourneyConditionExpression =
  | { kind: 'historyStartsWith'; passageIds: string[] }
  | { kind: 'historyEndsWith'; passageIds: string[] }
  | { kind: 'orderSeen'; passageIds: string[] }
  | { kind: 'visitedImmediatelyAfter'; beforePassageId: string; afterPassageId: string }
  | { kind: 'withinSteps'; passageId: string; steps: number }
  | { kind: 'visitCount'; passageId: string; comparison: NumericComparison; value: number }
  | {
      kind: 'visitedCountAcross';
      passageIds: string[];
      comparison: NumericComparison;
      value: number;
    }
  | { kind: 'all'; conditions: JourneyConditionExpression[] }
  | { kind: 'any'; conditions: JourneyConditionExpression[] }
  | { kind: 'not'; condition: JourneyConditionExpression };

export interface ConditionEvidence {
  kind: JourneyConditionExpression['kind'];
  matched: boolean;
  actual: string | number | boolean | string[];
  expected: string | number | boolean | string[];
}

export interface ConditionEvaluation {
  matched: boolean;
  evidence: ConditionEvidence[];
}

/**
 * Journey patterns track which character the reader started with and whether they stayed
 */
export type JourneyPattern =
  | 'started-stayed' // Started with one character, stayed dominant (>60%)
  | 'started-bounced' // Started with one, explored others significantly
  | 'shifted-dominant' // Started with one, shifted to another as dominant
  | 'began-lightly' // Started with light exploration before committing
  | 'met-later' // Encountered character later in journey
  | 'unknown'; // Not yet determined

/**
 * Path philosophy represents the dominant choice pattern at L2 nodes
 */
export type PathPhilosophy =
  | 'accept' // Acceptance/embrace choices
  | 'resist' // Resistance/rejection choices
  | 'invest' // Investigation/deeper engagement choices
  | 'mixed' // No clear dominant philosophy
  | 'unknown'; // Not yet determined

/**
 * Awareness level categories
 */
export type AwarenessLevel = 'low' | 'medium' | 'high';

/**
 * Synthesis pattern for convergence variations
 */
export type SynthesisPattern =
  | 'single-dominant' // One character >60%
  | 'balanced-dual' // Two characters ~40-50% each
  | 'true-triad'; // All three characters ~33% each

/**
 * Variation metadata structure matching JSON format
 */
export interface VariationMetadata {
  variationId: string;
  nodeId: string;
  section: string;
  layer: number;
  wordCount: number;
  createdDate: string;

  // Condition matching
  journeyPattern: JourneyPattern;
  journeyCode: string;
  philosophyDominant: PathPhilosophy;
  philosophyCode: string;
  awarenessLevel: AwarenessLevel;
  awarenessCode: string;
  awarenessRange: [number, number];

  // Labels and descriptions
  readableLabel: string;
  humanDescription: string;

  // Thematic content
  primaryThemes?: string[];
  crossCharacterConnections?: string[];
  consciousnessQuestion?: string;
  philosophicalCulmination?: string;
  convergenceAlignment?: 'preserve' | 'transform' | 'release';

  // Convergence-specific
  synthesisPattern?: SynthesisPattern;
  synthesisCode?: string;
  dominantCharacter?: string;
  characterBalance?: [number, number, number];
  multiVoiceIntegration?: string;
  perspectiveEmphasis?: string;
}

/**
 * Full variation structure
 */
export interface Variation {
  variationId: string;
  schemaVersion: string;
  id: string;
  sectionType: string;
  transformationState: TransformationState;
  journeyPattern: JourneyPattern;
  philosophyDominant: PathPhilosophy;
  awarenessLevel: AwarenessLevel;
  content: string;
  metadata: VariationMetadata;
}

/**
 * Variation file structure
 */
export interface VariationFile {
  nodeId?: string;
  totalVariations?: number;
  variations: Variation[];
}

/**
 * L3 content uses a smaller runtime contract than L1/L2 variations.
 * The aggregate JSON files intentionally omit transformation state and retain
 * additional character-specific metadata.
 */
export type L3ContentSynthesisPattern = 'single-dominant' | 'dual-balanced' | 'triple-balanced';

export interface L3VariationMetadata {
  wordCount: number;
  convergenceAlignment?: 'preserve' | 'transform' | 'release';
  synthesisPattern?: L3ContentSynthesisPattern;
  [key: string]: unknown;
}

export interface L3Variation {
  variationId: string;
  content: string;
  journeyPattern: JourneyPattern;
  philosophyDominant: PathPhilosophy;
  awarenessLevel: AwarenessLevel;
  metadata: L3VariationMetadata;
}

export interface L3VariationFile {
  nodeId: string;
  variations: readonly L3Variation[];
}

export interface L3VariationSet {
  arch: L3VariationFile;
  algo: L3VariationFile;
  hum: L3VariationFile;
  conv: L3VariationFile;
}

/**
 * Selection matrix entry for navigation
 */
export interface SelectionMatrixEntry {
  fromNode: string;
  toNode: string;
  conditions: {
    awarenessLevel?: AwarenessLevel;
    visitCount?: [number, number];
    journeyPattern?: JourneyPattern;
    pathPhilosophy?: PathPhilosophy;
  };
  metadata: {
    variationId: string;
    variationType: string;
    wordCount?: number;
    layer?: string;
    character?: string;
  };
}

/**
 * L3 assembly section (one of the 4 parts)
 */
export type L3VariationMatchTier =
  | 'exact-synthesis'
  | 'exact-context'
  | 'journey-philosophy'
  | 'journey'
  | 'philosophy'
  | 'deterministic-any';

export interface L3AssemblySection {
  character: 'arch' | 'algo' | 'hum' | 'conv';
  variationId: string;
  content: string;
  wordCount: number;
  matchTier: L3VariationMatchTier;
  metadata: L3VariationMetadata;
}

/**
 * Complete L3 assembly (all 4 sections)
 */
export interface L3Assembly {
  arch: L3AssemblySection;
  algo: L3AssemblySection;
  hum: L3AssemblySection;
  conv: L3AssemblySection;
  totalWordCount: number;
  metadata: {
    journeyPattern: JourneyPattern;
    pathPhilosophy: PathPhilosophy;
    awarenessLevel: AwarenessLevel;
    synthesisPattern: SynthesisPattern;
    convergenceAlignment?: 'preserve' | 'transform' | 'release';
  };
}

/**
 * Journey tracking for state management
 */
export interface JourneyTracking {
  // Character visit patterns
  startingCharacter: 'archaeologist' | 'algorithm' | 'lastHuman' | null;
  characterVisitPercentages: {
    archaeologist: number;
    algorithm: number;
    lastHuman: number;
  };
  dominantCharacter: 'archaeologist' | 'algorithm' | 'lastHuman' | null;

  // Pattern determination
  currentJourneyPattern: JourneyPattern;

  // Philosophy tracking (from L2 choices)
  l2Choices: {
    accept: number;
    resist: number;
    invest: number;
  };
  dominantPhilosophy: PathPhilosophy;

  /**
   * Cross-character connection tracking
   * Counts how many times reader switched between perspectives
   */
  crossCharacterConnections: {
    arch_algo: number; // Archaeologist ↔ Algorithm switches
    arch_hum: number; // Archaeologist ↔ Last Human switches
    algo_hum: number; // Algorithm ↔ Last Human switches
  };

  /**
   * Navigation pattern classification
   * Describes how reader moves through narrative
   */
  navigationPattern: 'linear' | 'exploratory' | 'recursive' | 'undetermined';

  /**
   * Last character visited
   * Used to detect character switches
   */
  lastCharacterVisited: 'archaeologist' | 'algorithm' | 'lastHuman' | null;

  /**
   * Revisit patterns
   * Tracks how often reader returns to previously visited nodes
   */
  revisitFrequency: number; // Percentage of visits that are revisits

  /**
   * Exploration breadth vs depth
   * High breadth = visiting many nodes once
   * High depth = revisiting fewer nodes multiple times
   */
  explorationMetrics: {
    breadth: number; // Unique nodes visited / total nodes available (0-100%)
    depth: number; // Average visits per unique node
  };
}

/**
 * Condition evaluation context
 */
export interface ConditionContext {
  nodeId: string;
  awareness: number;
  journeyPattern: JourneyPattern;
  pathPhilosophy: PathPhilosophy;
  visitCount: number;
  transformationState: TransformationState;
  characterVisitPercentages: {
    archaeologist: number;
    algorithm: number;
    lastHuman: number;
  };
  readingPath: readonly string[];
  visitCounts: Readonly<Record<string, number>>;
  startingCharacter: JourneyCharacter | null;
  recentVariationIds?: string[]; // ALL variation IDs ever shown for this node (absolute deduplication - never repeat)
}
