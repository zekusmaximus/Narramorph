/**
 * Variation loader - handles loading and caching of variation JSON files
 */

import type {
  VariationFile,
  Variation,
  SelectionMatrixEntry,
} from '@/types';

/**
 * Cache for loaded variation files
 */
const variationCache = new Map<string, VariationFile>();
const selectionMatrixCache: SelectionMatrixEntry[] | null = null;

/**
 * Load all variation files using Vite's glob import
 */
const l1VariationFiles = import.meta.glob<VariationFile>(
  '/src/data/stories/*/content/layer1/*-variations.json',
  { eager: true }
);

const l2VariationFiles = import.meta.glob<VariationFile>(
  '/src/data/stories/*/content/layer2/*-variations.json',
  { eager: true }
);

const l3VariationFiles = import.meta.glob<VariationFile>(
  '/src/data/stories/*/content/layer3/*-variations.json',
  { eager: true }
);

const l4VariationFiles = import.meta.glob<VariationFile>(
  '/src/data/stories/*/content/layer4/*-variations.json',
  { eager: true }
);

const selectionMatrixFiles = import.meta.glob<SelectionMatrixEntry[]>(
  '/src/data/stories/*/content/selection-matrix.json',
  { eager: true }
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
 * Load a specific variation file by node ID
 */
export function loadVariationFile(storyId: string, nodeId: string): VariationFile | null {
  // Check cache first
  const cacheKey = `${storyId}:${nodeId}`;
  if (variationCache.has(cacheKey)) {
    return variationCache.get(cacheKey)!;
  }

  // Search for matching file
  for (const [path, content] of Object.entries(allVariationFiles)) {
    if (path.includes(storyId)) {
      const fileData = 'default' in content ? content.default : content;

      // Check if this file contains the node we're looking for
      if (fileData.nodeId === nodeId ||
          (fileData.variations && fileData.variations.some(v => v.metadata.nodeId === nodeId))) {
        variationCache.set(cacheKey, fileData);
        return fileData;
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

  for (const [path, content] of Object.entries(l3VariationFiles)) {
    if (path.includes(storyId)) {
      const fileData = 'default' in content ? content.default : content;

      if (path.includes('arch-L3')) {
        result.arch = fileData;
      } else if (path.includes('algo-L3')) {
        result.algo = fileData;
      } else if (path.includes('hum-L3')) {
        result.hum = fileData;
      } else if (path.includes('conv-L3')) {
        result.conv = fileData;
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
  for (const [path, content] of Object.entries(selectionMatrixFiles)) {
    if (path.includes(storyId)) {
      const matrixData = 'default' in content ? content.default : content;
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
  variationId: string
): Variation | null {
  if (!variationFile || !variationFile.variations) {
    return null;
  }

  return variationFile.variations.find(v => v.variationId === variationId) || null;
}

/**
 * Clear the variation cache (useful for testing/development)
 */
export function clearVariationCache(): void {
  variationCache.clear();
}
