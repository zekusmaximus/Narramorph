import type {
  StoryNode,
  ConnectionType,
  ConnectionVisualProperties,
  RevealCondition,
} from './Node';
import type { ValidationError, ValidationWarning } from './Store';

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
