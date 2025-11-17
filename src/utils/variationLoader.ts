/**
 * Variation loader - handles loading and caching of variation JSON files
 */

import type { VariationFile, Variation, SelectionMatrixEntry } from '@/types';

/**
 * Cache for loaded variation files
 */
const variationCache = new Map<string, VariationFile>();
const selectionMatrixCache: SelectionMatrixEntry[] | null = null;

/**
 * Load all variation files using Vite's glob import
 * Note: Vite wraps imports in { default: T } structure
 */
const l1VariationFiles = import.meta.glob<{ default: VariationFile }>(
  '/src/data/stories/*/content/layer1/*-variations.json',
  {
    eager: true,
  },
);

const l2VariationFiles = import.meta.glob<{ default: VariationFile }>(
  '/src/data/stories/*/content/layer2/*-variations.json',
  {
    eager: true,
  },
);

const l3VariationFiles = import.meta.glob<{ default: VariationFile }>(
  '/src/data/stories/*/content/layer3/*-variations.json',
  {
    eager: true,
  },
);

const l4VariationFiles = import.meta.glob<{ default: VariationFile }>(
  '/src/data/stories/*/content/layer4/*-variations.json',
  {
    eager: true,
  },
);

const selectionMatrixFiles = import.meta.glob<{ default: SelectionMatrixEntry[] }>(
  '/src/data/stories/*/content/selection-matrix.json',
  {
    eager: true,
  },
);

/**
 * Combine all variation file imports
 */
const allVariationFiles = {
  ...l1VariationFiles,
  ...l2VariationFiles,
  ...l3VariationFiles,
  ...l4VariationFiles,
};

/**
 * Normalize variation data to ensure all required fields are in metadata
 */
function normalizeVariation(variation: unknown, fileNodeId?: string): Variation {
  // Type guard: ensure variation is an object
  if (typeof variation !== 'object' || variation === null) {
    throw new Error('Invalid variation data: expected object');
  }

  const v = variation as Record<string, unknown>;

  // Ensure metadata exists
  if (!v.metadata || typeof v.metadata !== 'object') {
    v.metadata = {};
  }

  // Map root-level properties into metadata if they're missing
  const meta = v.metadata as Record<string, unknown>;

  // CRITICAL: Copy id to both root-level variationId AND metadata.variationId
  if (!v.variationId && v.id) {
    v.variationId = v.id;
  }

  if (!meta.variationId && v.id) {
    meta.variationId = v.id;
  }

  if (!meta.nodeId && (fileNodeId || v.nodeId)) {
    meta.nodeId = fileNodeId || v.nodeId;
  }

  if (!meta.awarenessRange && v.awarenessRange) {
    meta.awarenessRange = v.awarenessRange;
  } else if (!meta.awarenessRange) {
    // Set default awarenessRange to match all awareness levels
    // Transformation state is the primary filter, not awareness
    meta.awarenessRange = [0, 100];
  }

  if (!meta.journeyPattern && v.journeyPattern) {
    meta.journeyPattern = v.journeyPattern;
  } else if (!meta.journeyPattern) {
    meta.journeyPattern = 'unknown';
  }

  if (!meta.philosophyDominant && v.philosophyDominant) {
    meta.philosophyDominant = v.philosophyDominant;
  } else if (!meta.philosophyDominant) {
    meta.philosophyDominant = 'unknown';
  }

  if (!meta.awarenessLevel && v.awarenessLevel) {
    meta.awarenessLevel = v.awarenessLevel;
  } else if (!meta.awarenessLevel && meta.awarenessRange) {
    // Derive awarenessLevel from awarenessRange if missing
    const midpoint = (meta.awarenessRange[0] + meta.awarenessRange[1]) / 2;
    meta.awarenessLevel = midpoint < 35 ? 'low' : midpoint < 70 ? 'medium' : 'high';
  } else if (!meta.awarenessLevel) {
    meta.awarenessLevel = 'low';
  }

  // Ensure other required fields have defaults
  if (!meta.layer && typeof meta.layer !== 'number') {
    meta.layer = 1;
  }

  if (!meta.section) {
    meta.section = 'unknown';
  }

  if (!meta.createdDate) {
    meta.createdDate = new Date().toISOString();
  }

  if (!meta.journeyCode) {
    meta.journeyCode = 'UK';
  }

  if (!meta.philosophyCode) {
    meta.philosophyCode = 'UK';
  }

  if (!meta.awarenessCode) {
    meta.awarenessCode = 'L';
  }

  if (!meta.readableLabel) {
    meta.readableLabel = meta.variationId || 'Unknown';
  }

  if (!meta.humanDescription) {
    meta.humanDescription = '';
  }

  return v as Variation;
}

/**
 * Load a specific variation file by node ID
 */
export function loadVariationFile(storyId: string, nodeId: string): VariationFile | null {
  // Check cache first
  const cacheKey = `${storyId}:${nodeId}`;
  const cached = variationCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Search for matching file
  for (const [path, module] of Object.entries(allVariationFiles)) {
    if (path.includes(storyId)) {
      const fileData: VariationFile =
        'default' in module ? module.default : (module as unknown as VariationFile);

      // Check if this file contains the node we're looking for
      if (
        fileData.nodeId === nodeId ||
        (fileData.variations &&
          fileData.variations.some((v: unknown) => {
            const variation = v as Record<string, unknown>;
            const metadata = variation.metadata as Record<string, unknown> | undefined;
            return metadata?.nodeId === nodeId || variation.nodeId === nodeId;
          }))
      ) {
        // Normalize all variations before caching
        const normalizedFile: VariationFile = {
          ...fileData,
          variations: fileData.variations.map((v: unknown) =>
            normalizeVariation(v, fileData.nodeId),
          ),
        };

        variationCache.set(cacheKey, normalizedFile);
        return normalizedFile;
      }
    }
  }

  return null;
}

/**
 * Load L3 variation files for all characters
 */
export function loadL3Variations(storyId: string): {
  arch: VariationFile | null;
  algo: VariationFile | null;
  hum: VariationFile | null;
  conv: VariationFile | null;
} {
  const result = {
    arch: null as VariationFile | null,
    algo: null as VariationFile | null,
    hum: null as VariationFile | null,
    conv: null as VariationFile | null,
  };

  for (const [path, module] of Object.entries(l3VariationFiles)) {
    if (path.includes(storyId)) {
      const fileData: VariationFile =
        'default' in module ? module.default : (module as unknown as VariationFile);

      // Normalize variations before storing
      const normalizedFile: VariationFile = {
        ...fileData,
        variations:
          fileData.variations?.map((v: unknown) => normalizeVariation(v, fileData.nodeId)) || [],
      };

      if (path.includes('arch-L3')) {
        result.arch = normalizedFile;
      } else if (path.includes('algo-L3')) {
        result.algo = normalizedFile;
      } else if (path.includes('hum-L3')) {
        result.hum = normalizedFile;
      } else if (path.includes('conv-L3')) {
        result.conv = normalizedFile;
      }
    }
  }

  return result;
}

/**
 * Load the selection matrix
 */
export function loadSelectionMatrix(storyId: string): SelectionMatrixEntry[] {
  // Check cache
  if (selectionMatrixCache) {
    return selectionMatrixCache;
  }

  // Find the selection matrix file for this story
  for (const [path, module] of Object.entries(selectionMatrixFiles)) {
    if (path.includes(storyId)) {
      const matrixData: SelectionMatrixEntry[] =
        'default' in module ? module.default : (module as unknown as SelectionMatrixEntry[]);
      return matrixData;
    }
  }

  return [];
}

/**
 * Get all variations from a file
 */
export function getVariations(variationFile: VariationFile | null): Variation[] {
  if (!variationFile || !variationFile.variations) {
    return [];
  }
  return variationFile.variations;
}

/**
 * Find a specific variation by ID
 */
export function findVariationById(
  variationFile: VariationFile | null,
  variationId: string,
): Variation | null {
  if (!variationFile || !variationFile.variations) {
    return null;
  }

  return variationFile.variations.find((v) => v.variationId === variationId) || null;
}

/**
 * Clear the variation cache (useful for testing/development)
 */
export function clearVariationCache(): void {
  variationCache.clear();
}
