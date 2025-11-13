/**
 * Content validation with severity policies
 */

import { Logger } from './log.js';
import { validateZeroPadding, type Layer } from './ids.js';
import { validateEnumField, validateArrayField, validateRequiredFields } from './frontmatter.js';

export interface ValidationOptions {
  strict: boolean;
  maxWarningsPerType?: number;
}

export const TRANSFORMATION_STATES = ['initial', 'firstRevisit', 'metaAware'] as const;
export const PATH_PHILOSOPHIES = ['accept', 'resist', 'invest'] as const;
export const JOURNEY_PATTERNS = ['linear', 'exploratory', 'recursive'] as const;
export const AWARENESS_LEVELS = ['veryLow', 'low', 'medium', 'high', 'maximum'] as const;
export const CHARACTERS = ['archaeologist', 'algorithm', 'last-human'] as const;

/**
 * Validate L1/L2 variation frontmatter
 */
export function validateL1L2Frontmatter(
  frontmatter: Record<string, unknown>,
  layer: 1 | 2,
  logger: Logger,
  filePath: string,
): boolean {
  const requiredFields =
    layer === 1
      ? ['variation_id', 'variation_type', 'word_count']
      : ['variation_id', 'variation_type', 'word_count'];

  // Required fields
  if (!validateRequiredFields(frontmatter, requiredFields, logger, filePath)) {
    return false;
  }

  // Validate variation_type enum
  if (!validateEnumField(frontmatter, 'variation_type', TRANSFORMATION_STATES, logger, filePath)) {
    return false;
  }

  // Validate variation_id format
  const varId = frontmatter.variation_id as string;
  if (!validateZeroPadding(varId, layer, logger, filePath)) {
    return false;
  }

  // Validate awareness range if present
  if ('conditions' in frontmatter && frontmatter.conditions) {
    const conditions = frontmatter.conditions as Record<string, unknown>;
    const varType = frontmatter.variation_type as string;

    if ('awareness' in conditions) {
      // firstRevisit and metaAware REQUIRE awarenessRange
      if ((varType === 'firstRevisit' || varType === 'metaAware') && !conditions.awareness) {
        logger.blocker('MISSING_AWARENESS', 'Awareness range required for firstRevisit/metaAware', {
          file: filePath,
          field: 'conditions.awareness',
          exampleFix: 'Add awareness: "0-100%" to conditions',
        });
        return false;
      }

      // initial FORBIDS awarenessRange
      if (varType === 'initial' && conditions.awareness) {
        logger.blocker('INVALID_AWARENESS', 'Awareness range forbidden for initial state', {
          file: filePath,
          field: 'conditions.awareness',
          value: conditions.awareness,
          exampleFix: 'Remove awareness from conditions for initial variations',
        });
        return false;
      }
    }
  }

  return true;
}

/**
 * Validate L3 variation frontmatter
 */
export function validateL3Frontmatter(
  frontmatter: Record<string, unknown>,
  logger: Logger,
  filePath: string,
): boolean {
  const requiredFields = ['variationId', 'journeyPattern', 'philosophyDominant', 'awarenessLevel'];

  // Required fields
  if (!validateRequiredFields(frontmatter, requiredFields, logger, filePath)) {
    return false;
  }

  // Validate enums
  let valid = true;
  valid =
    validateEnumField(
      frontmatter,
      'journeyPattern',
      [
        'linear',
        'exploratory',
        'recursive',
        'started-stayed',
        'started-bounced',
        'shifted-dominant',
        'began-lightly',
        'met-later',
      ],
      logger,
      filePath,
    ) && valid;
  valid =
    validateEnumField(frontmatter, 'philosophyDominant', PATH_PHILOSOPHIES, logger, filePath) &&
    valid;
  valid =
    validateEnumField(
      frontmatter,
      'awarenessLevel',
      ['veryLow', 'low', 'medium', 'high', 'maximum'],
      logger,
      filePath,
    ) && valid;

  // Validate variationId format
  const varId = frontmatter.variationId as string;
  if (!validateZeroPadding(varId, 3, logger, filePath)) {
    valid = false;
  }

  // conv-L3 specific validation: must have characterVoices with ≥2 voices
  if (varId.startsWith('conv-L3-')) {
    if (!('characterVoices' in frontmatter)) {
      logger.blocker('MISSING_CHARACTER_VOICES', 'conv-L3 requires characterVoices field', {
        file: filePath,
        field: 'characterVoices',
        exampleFix: 'Add characterVoices: [archaeologist, algorithm, last-human]',
      });
      valid = false;
    } else if (
      !validateArrayField(frontmatter, 'characterVoices', 2, undefined, logger, filePath)
    ) {
      logger.blocker('INVALID_CHARACTER_VOICES', 'conv-L3 characterVoices must have ≥2 voices', {
        file: filePath,
        field: 'characterVoices',
        value: frontmatter.characterVoices,
        exampleFix: 'Add at least 2 character voices to array',
      });
      valid = false;
    }
  }

  return valid;
}

/**
 * Validate L4 frontmatter
 */
export function validateL4Frontmatter(
  frontmatter: Record<string, unknown>,
  logger: Logger,
  filePath: string,
): boolean {
  const requiredFields = ['id', 'philosophy'];

  // Required fields
  if (!validateRequiredFields(frontmatter, requiredFields, logger, filePath)) {
    return false;
  }

  // Validate philosophy enum
  if (
    !validateEnumField(
      frontmatter,
      'philosophy',
      ['preserve', 'release', 'transform'],
      logger,
      filePath,
    )
  ) {
    return false;
  }

  // Validate ID format
  const id = frontmatter.id as string;
  const expectedId = `final-${frontmatter.philosophy}`;
  if (id !== expectedId) {
    logger.error('ID_MISMATCH', `L4 ID should be ${expectedId}`, {
      file: filePath,
      field: 'id',
      value: id,
      exampleFix: `Change id to: ${expectedId}`,
    });
    return false;
  }

  return true;
}

/**
 * Validate word count is within expected range
 */
export function validateWordCount(
  actualCount: number,
  expectedCount: number,
  tolerance: number,
  _layer: Layer,
  logger: Logger,
  filePath: string,
): void {
  const diff = Math.abs(actualCount - expectedCount);
  const percentDiff = (diff / expectedCount) * 100;

  if (percentDiff > tolerance) {
    logger.warning(
      'WORD_COUNT_DRIFT',
      `Word count drift: ${actualCount} vs expected ${expectedCount} (${percentDiff.toFixed(1)}% diff)`,
      {
        file: filePath,
        field: 'word_count',
        value: actualCount,
      },
    );
  }
}

/**
 * Validate aggregated variation count
 */
export function validateVariationCount(
  actualCount: number,
  expectedCount: number,
  nodeId: string,
  logger: Logger,
  options: ValidationOptions,
): boolean {
  if (actualCount !== expectedCount) {
    const severity = options.strict ? 'ERROR' : 'WARNING';
    logger.log(
      'COUNT_MISMATCH',
      severity as any,
      `${nodeId}: Expected ${expectedCount} variations, found ${actualCount}`,
      {
        field: 'totalVariations',
        value: actualCount,
      },
    );
    return !options.strict;
  }
  return true;
}

/**
 * Check for duplicate IDs
 */
export function checkDuplicateIds(ids: string[], logger: Logger, context?: string): boolean {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const id of ids) {
    if (seen.has(id)) {
      duplicates.add(id);
    }
    seen.add(id);
  }

  if (duplicates.size > 0) {
    for (const id of duplicates) {
      logger.blocker('DUPLICATE_ID', `Duplicate ID found: ${id}`, {
        field: 'id',
        value: id,
        exampleFix: `Ensure all variation IDs are unique within ${context || 'scope'}`,
      });
    }
    return false;
  }

  return true;
}

/**
 * Validate schemaVersion is present
 */
export function validateSchemaVersion(
  output: Record<string, unknown>,
  logger: Logger,
  filePath: string,
): boolean {
  if (!output.schemaVersion) {
    logger.blocker('MISSING_SCHEMA_VERSION', 'Output must include schemaVersion field', {
      file: filePath,
      field: 'schemaVersion',
      exampleFix: 'Add "schemaVersion": "1.0.0" to output',
    });
    return false;
  }
  return true;
}
