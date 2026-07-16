import type {
  StoryNode,
  ConnectionType,
  ConnectionVisualProperties,
  RevealCondition,
} from './Node';
import type { ValidationError, ValidationWarning } from './Store';
import type { JourneyConditionExpression } from './Variation';

/**
 * Optional condition-aware edge prose (Phase 4.2).
 *
 * A connection may carry short "bridge" prose shown when the reader crosses that edge into the
 * target passage. A bridge offers ordered alternative phrasings; the resolver deterministically
 * selects one (or none) by condition then priority, mirroring compositional prose beats. Bridges
 * are bounded (see `EDGE_BRIDGE_LIMITS`) so edge prose cannot become an unbounded second content
 * system, and they render at passage entry within the reading flow — never as a separate visited
 * node unless a node is explicitly authored for that.
 */
export interface EdgeBridgeAlternative {
  /** Stable identifier for this phrasing; recorded as the bridge ID in the visit-event log. */
  id: string;
  /** Short Markdown fragment shown on entry when this alternative is selected. */
  content: string;
  /** Optional journey condition; when absent the alternative always qualifies. */
  condition?: JourneyConditionExpression;
  /** Higher value wins among qualifying alternatives (default 0); ties break to author order. */
  priority?: number;
}

export interface EdgeBridge {
  /** Ordered alternative phrasings for this edge; at least one is required. */
  alternatives: EdgeBridgeAlternative[];
  /** When no alternative qualifies, show nothing instead of the deterministic fallback. */
  omitWhenUnmatched?: boolean;
}

/**
 * Complete connection definition (alternative to inline connections)
 */
export interface Connection {
  id: string; // Unique identifier
  sourceId: string; // Source node ID
  targetId: string; // Target node ID
  type: ConnectionType;
  label?: string;
  bidirectional: boolean;
  revealConditions?: RevealCondition;
  visualProperties: ConnectionVisualProperties;
  /** Optional condition-aware edge prose shown at passage entry (Phase 4.2). */
  bridge?: EdgeBridge;
}

/**
 * Story metadata
 */
export interface StoryMetadata {
  id: string;
  title: string;
  author: string;
  version: string;
  description: string;
  estimatedPlaytime: number; // Minutes for complete playthrough
}

/**
 * Story configuration
 */
export interface StoryConfiguration {
  startNodeId: string; // Where readers begin
  endingNodeIds: string[]; // Possible ending nodes
  requiredNodesForCompletion: string[]; // Must visit these
}

/**
 * Complete story data
 */
export interface StoryData {
  metadata: StoryMetadata;
  nodes: StoryNode[];
  connections?: Connection[]; // Optional separate connection definitions
  configuration: StoryConfiguration;
}

/**
 * Validation result for story content
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Migration strategy for updating saved state between versions
 */
export interface MigrationStrategy {
  from: string; // Previous version
  to: string; // Target version
  migrate: (oldState: unknown) => unknown; // Migration function
}

/**
 * Story file manifest for loading content
 */
export interface StoryManifest {
  nodeFiles: string[];
  connectionFiles?: string[];
}

/**
 * Complete story definition with manifest
 */
export interface StoryDefinition {
  metadata: StoryMetadata;
  configuration: StoryConfiguration;
  manifest: StoryManifest;
}
