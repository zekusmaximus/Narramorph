import type {
  StoryData,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  SavedState,
  StoryNode,
  VisitRecord,
  UserProgress,
  UserPreferences,
  Theme,
  TextSize,
} from '@/types';

/**
 * Validates complete story structure
 * @param story - The story data to validate
 * @returns Validation result with errors and warnings
 */
export function validateStory(story: StoryData): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Check for duplicate IDs
  const nodeIds = new Set<string>();
  for (const node of story.nodes) {
    if (nodeIds.has(node.id)) {
      errors.push({
        type: 'duplicate_id',
        message: `Duplicate node ID: ${node.id}`,
        nodeId: node.id,
      });
    }
    nodeIds.add(node.id);
  }

  // Validate all connections
  for (const node of story.nodes) {
    for (const conn of node.connections) {
      if (!nodeIds.has(conn.targetId)) {
        errors.push({
          type: 'invalid_connection',
          message: `Node ${node.id} connects to non-existent node ${conn.targetId}`,
          nodeId: node.id,
        });
      }
    }
  }

  // Check for orphaned nodes (no incoming connections)
  const connectedNodes = new Set<string>();
  connectedNodes.add(story.configuration.startNodeId); // Start node is connected by definition

  for (const node of story.nodes) {
    for (const conn of node.connections) {
      connectedNodes.add(conn.targetId);
      if (conn.bidirectional) {
        connectedNodes.add(node.id);
      }
    }
  }

  for (const node of story.nodes) {
    if (!connectedNodes.has(node.id) && node.id !== story.configuration.startNodeId) {
      warnings.push({
        type: 'unreachable',
        message: `Node ${node.id} has no incoming connections`,
        nodeId: node.id,
      });
    }
  }

  // Check for dead ends (no outgoing connections, not an ending)
  for (const node of story.nodes) {
    if (node.connections.length === 0 && !story.configuration.endingNodeIds.includes(node.id)) {
      warnings.push({
        type: 'dead_end',
        message: `Node ${node.id} has no outgoing connections and isn't marked as ending`,
        nodeId: node.id,
      });
    }
  }

  // Validate content length
  for (const node of story.nodes) {
    for (const [state, content] of Object.entries(node.content)) {
      if (content.length > 3000) {
        warnings.push({
          type: 'long_content',
          message: `Node ${node.id} ${state} content exceeds 3000 characters`,
          nodeId: node.id,
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Type guard for StoryNode
 */
export function isStoryNode(data: unknown): data is StoryNode {
  if (!data || typeof data !== 'object') return false;
  const node = data as Record<string, unknown>;

  return (
    typeof node.id === 'string' &&
    typeof node.character === 'string' &&
    typeof node.title === 'string' &&
    typeof node.position === 'object' &&
    typeof node.content === 'object' &&
    Array.isArray(node.connections) &&
    typeof node.visualState === 'object' &&
    typeof node.metadata === 'object'
  );
}

/**
 * Type guard for SavedState
 */
export function isSavedState(data: unknown): data is SavedState {
  if (!data || typeof data !== 'object') return false;
  const state = data as Record<string, unknown>;

  return !!(
    typeof state.version === 'string' &&
    typeof state.timestamp === 'string' &&
    state.progress &&
    typeof state.progress === 'object' &&
    state.preferences &&
    typeof state.preferences === 'object'
  );
}

/**
 * Validates imported/loaded saved state
 * @param data - The data to validate
 * @returns true if valid SavedState
 */
export function validateSavedState(data: unknown): boolean {
  if (!isSavedState(data)) return false;

  // Check required progress fields
  const progress = data.progress as UserProgress;
  if (
    !progress.visitedNodes ||
    !Array.isArray(progress.readingPath) ||
    !Array.isArray(progress.unlockedConnections) ||
    !Array.isArray(progress.specialTransformations)
  ) {
    return false;
  }

  // Check preferences
  const preferences = data.preferences as UserPreferences;
  const validThemes: Theme[] = ['light', 'dark', 'sepia'];
  const validSizes: TextSize[] = ['small', 'medium', 'large'];

  if (!validThemes.includes(preferences.theme) || !validSizes.includes(preferences.textSize)) {
    return false;
  }

  return true;
}

/**
 * Validates visit record data
 * @param data - The visit record to validate
 * @returns true if valid VisitRecord
 */
export function isValidVisitRecord(data: unknown): data is VisitRecord {
  if (!data || typeof data !== 'object') return false;
  const record = data as Record<string, unknown>;

  return (
    typeof record.visitCount === 'number' &&
    Array.isArray(record.visitTimestamps) &&
    typeof record.currentState === 'string' &&
    typeof record.timeSpent === 'number' &&
    typeof record.lastVisited === 'string'
  );
}

/**
 * Sanitizes and validates node content
 * @param content - Raw content string
 * @returns Sanitized content
 */
export function sanitizeNodeContent(content: string): string {
  // Basic sanitization - remove potentially harmful content
  // In a real app, you might use a proper sanitization library
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
}
