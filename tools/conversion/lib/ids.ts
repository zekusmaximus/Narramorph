/**
 * ID parsing, validation, and zero-padding utilities
 */

import { Logger } from './log.js';

export type Layer = 1 | 2 | 3 | 4;
export type TransformationState = 'initial' | 'firstRevisit' | 'metaAware';
export type PathPhilosophy = 'accept' | 'resist' | 'invest';
export type Character = 'arch' | 'algo' | 'hum';

export interface L1L2VariationId {
  layer: 1 | 2;
  character: Character;
  path?: PathPhilosophy;
  state: TransformationState;
  number: number;
  raw: string;
}

export interface L3VariationId {
  layer: 3;
  sectionType: 'arch-L3' | 'algo-L3' | 'hum-L3' | 'conv-L3';
  number: number;
  raw: string;
}

export interface L4VariationId {
  layer: 4;
  philosophy: 'preserve' | 'release' | 'transform';
  raw: string;
}

export type VariationId = L1L2VariationId | L3VariationId | L4VariationId;

/**
 * Parse variation ID from frontmatter
 */
export function parseVariationId(id: string, layer: Layer): VariationId | null {
  if (layer === 1 || layer === 2) {
    return parseL1L2VariationId(id, layer);
  } else if (layer === 3) {
    return parseL3VariationId(id);
  } else if (layer === 4) {
    return parseL4VariationId(id);
  }
  return null;
}

/**
 * Parse L1/L2 variation ID
 * Examples: arch-L1-initial, arch-L1-FR-001, algo-L2-accept-MA-015
 */
function parseL1L2VariationId(id: string, layer: 1 | 2): L1L2VariationId | null {
  // Pattern: {char}-L{layer}[-{path}]-{state}[-{num}]
  const pattern =
    layer === 1
      ? /^(arch|algo|hum)-L1-(initial|FR|MA)(?:-(\d+))?$/
      : /^(arch|algo|hum)-L2-(accept|resist|invest)-(initial|FR|MA)(?:-(\d+))?$/;

  const match = id.match(pattern);
  if (!match) return null;

  const character = match[1] as Character;
  const stateCode = layer === 1 ? match[2] : match[3];
  const numberStr = layer === 1 ? match[3] : match[4];
  const path = layer === 2 ? (match[2] as PathPhilosophy) : undefined;

  let state: TransformationState;
  if (stateCode === 'initial') {
    state = 'initial';
  } else if (stateCode === 'FR') {
    state = 'firstRevisit';
  } else if (stateCode === 'MA') {
    state = 'metaAware';
  } else {
    return null;
  }

  const number = numberStr ? parseInt(numberStr, 10) : state === 'initial' ? 0 : 1;

  return {
    layer,
    character,
    path,
    state,
    number,
    raw: id,
  };
}

/**
 * Parse L3 variation ID
 * Examples: arch-L3-001, conv-L3-042
 */
function parseL3VariationId(id: string): L3VariationId | null {
  const pattern = /^(arch|algo|hum|conv)-L3-(\d{3})$/;
  const match = id.match(pattern);

  if (!match || !match[1] || !match[2]) return null;

  const sectionType = `${match[1]}-L3` as 'arch-L3' | 'algo-L3' | 'hum-L3' | 'conv-L3';
  const number = parseInt(match[2], 10);

  return {
    layer: 3,
    sectionType,
    number,
    raw: id,
  };
}

/**
 * Parse L4 variation ID
 * Examples: final-preserve, final-release, final-transform
 */
function parseL4VariationId(id: string): L4VariationId | null {
  const pattern = /^final-(preserve|release|transform)$/;
  const match = id.match(pattern);

  if (!match) return null;

  return {
    layer: 4,
    philosophy: match[1] as 'preserve' | 'release' | 'transform',
    raw: id,
  };
}

/**
 * Generate aggregated variation ID with zero-padding
 * Examples: arch-L1-001, arch-L2-accept-047
 */
export function generateAggregatedId(
  character: Character,
  layer: 1 | 2,
  index: number,
  path?: PathPhilosophy,
): string {
  const nodeId = layer === 1 ? `${character}-L1` : `${character}-L2-${path}`;

  const paddedNum = index.toString().padStart(3, '0');
  return `${nodeId}-${paddedNum}`;
}

/**
 * Generate L3 section ID with zero-padding
 * Examples: arch-L3-001, conv-L3-042
 */
export function generateL3Id(sectionType: string, number: number): string {
  const paddedNum = number.toString().padStart(3, '0');
  return `${sectionType}-${paddedNum}`;
}

/**
 * Validate ID zero-padding
 */
export function validateZeroPadding(
  id: string,
  layer: Layer,
  logger?: Logger,
  file?: string,
): boolean {
  if (layer === 1 || layer === 2) {
    // Check for invalid patterns like -1 instead of -001
    const invalidPattern = /-(?:FR|MA)-(\d{1,2})$/;
    const match = id.match(invalidPattern);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (num < 100) {
        logger?.error('INVALID_PADDING', `Invalid zero-padding in ID: ${id}`, {
          file,
          field: 'id',
          value: id,
          exampleFix: id.replace(/-(\d{1,2})$/, (_, n) => `-${n.padStart(3, '0')}`),
        });
        return false;
      }
    }
  } else if (layer === 3) {
    // L3 must have 3-digit padding
    const pattern = /L3-(\d+)$/;
    const match = id.match(pattern);
    if (match && match[1] && match[1].length !== 3) {
      logger?.error('INVALID_PADDING', `Invalid zero-padding in ID: ${id}`, {
        file,
        field: 'id',
        value: id,
        exampleFix: id.replace(/L3-(\d+)$/, (_, n) => `L3-${n.padStart(3, '0')}`),
      });
      return false;
    }
  }
  return true;
}

/**
 * Extract node ID from variation ID
 * Examples: arch-L1-001 → arch-L1, arch-L2-accept-047 → arch-L2-accept
 */
export function extractNodeId(variationId: string, layer: Layer): string | null {
  if (layer === 1) {
    const match = variationId.match(/^(arch|algo|hum)-L1/);
    return match ? match[0] : null;
  } else if (layer === 2) {
    const match = variationId.match(/^(arch|algo|hum)-L2-(accept|resist|invest)/);
    return match ? match[0] : null;
  } else if (layer === 3) {
    // L3 is per-file, not aggregated
    return null;
  } else if (layer === 4) {
    // L4 IDs are already node-level
    return variationId;
  }
  return null;
}
