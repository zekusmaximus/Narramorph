/**
 * Frontmatter parsing utilities with strict YAML validation
 */

import YAML from 'yaml';
import { Logger } from './log.js';

export interface FrontmatterResult<T = Record<string, unknown>> {
  frontmatter: T;
  content: string;
  raw: string;
}

/**
 * Parse frontmatter from markdown file
 * Expects YAML frontmatter between --- delimiters
 */
export function parseFrontmatter<T = Record<string, unknown>>(
  markdown: string,
  logger?: Logger,
  filePath?: string
): FrontmatterResult<T> | null {
  const fmPattern = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = markdown.match(fmPattern);

  if (!match) {
    logger?.blocker('MISSING_FRONTMATTER', 'No frontmatter found in file', {
      file: filePath,
      exampleFix: 'Add YAML frontmatter between --- delimiters at start of file',
    });
    return null;
  }

  const rawFrontmatter = match[1];
  const content = match[2];

  if (!rawFrontmatter || content === undefined) {
    logger?.blocker('MISSING_FRONTMATTER', 'Frontmatter or content missing', {
      file: filePath,
    });
    return null;
  }

  try {
    const frontmatter = YAML.parse(rawFrontmatter) as T;

    if (!frontmatter || typeof frontmatter !== 'object') {
      logger?.blocker('INVALID_FRONTMATTER', 'Frontmatter must be a YAML object', {
        file: filePath,
        value: frontmatter,
      });
      return null;
    }

    return {
      frontmatter,
      content: content.trim(),
      raw: rawFrontmatter,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown YAML parse error';
    logger?.blocker('YAML_PARSE_ERROR', `Failed to parse YAML frontmatter: ${message}`, {
      file: filePath,
      exampleFix: 'Check YAML syntax - ensure proper indentation and no tabs',
    });
    return null;
  }
}

/**
 * Validate required fields exist in frontmatter
 */
export function validateRequiredFields(
  frontmatter: Record<string, unknown>,
  requiredFields: string[],
  logger?: Logger,
  filePath?: string
): boolean {
  let valid = true;

  for (const field of requiredFields) {
    if (!(field in frontmatter) || frontmatter[field] === undefined || frontmatter[field] === null) {
      logger?.blocker('MISSING_FIELD', `Required field missing: ${field}`, {
        file: filePath,
        field,
        exampleFix: `Add ${field} to frontmatter`,
      });
      valid = false;
    }
  }

  return valid;
}

/**
 * Validate enum field value
 */
export function validateEnumField<T extends string>(
  frontmatter: Record<string, unknown>,
  field: string,
  validValues: readonly T[],
  logger?: Logger,
  filePath?: string
): boolean {
  const value = frontmatter[field];

  if (value === undefined || value === null) {
    return true; // Let validateRequiredFields handle missing fields
  }

  if (!validValues.includes(value as T)) {
    logger?.blocker('INVALID_ENUM', `Invalid value for ${field}`, {
      file: filePath,
      field,
      value,
      validOptions: [...validValues],
      exampleFix: `Set ${field} to one of: ${validValues.join(', ')}`,
    });
    return false;
  }

  return true;
}

/**
 * Validate array field
 */
export function validateArrayField(
  frontmatter: Record<string, unknown>,
  field: string,
  minLength?: number,
  maxLength?: number,
  logger?: Logger,
  filePath?: string
): boolean {
  const value = frontmatter[field];

  if (value === undefined || value === null) {
    return true; // Let validateRequiredFields handle missing fields
  }

  if (!Array.isArray(value)) {
    logger?.blocker('INVALID_TYPE', `Field ${field} must be an array`, {
      file: filePath,
      field,
      value,
      exampleFix: `Change ${field} to array format: [item1, item2]`,
    });
    return false;
  }

  if (minLength !== undefined && value.length < minLength) {
    logger?.blocker('ARRAY_TOO_SHORT', `Field ${field} must have at least ${minLength} items`, {
      file: filePath,
      field,
      value: value.length,
      exampleFix: `Add more items to ${field} array`,
    });
    return false;
  }

  if (maxLength !== undefined && value.length > maxLength) {
    logger?.warning('ARRAY_TOO_LONG', `Field ${field} has more than ${maxLength} items`, {
      file: filePath,
      field,
      value: value.length,
    });
    return false;
  }

  return true;
}

/**
 * Extract word count from content
 */
export function countWords(content: string): number {
  // Remove markdown formatting
  const text = content
    .replace(/```[\s\S]*?```/g, '') // code blocks
    .replace(/`[^`]+`/g, '') // inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .replace(/[#*_~]/g, '') // formatting marks
    .trim();

  // Count words
  const words = text.split(/\s+/).filter(word => word.length > 0);
  return words.length;
}
