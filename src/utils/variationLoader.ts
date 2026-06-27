/**
 * Variation loader - handles loading and caching of variation JSON files
 */

import type {
  AwarenessLevel,
  JourneyPattern,
  L3ContentSynthesisPattern,
  L3Variation,
  L3VariationFile,
  L3VariationMetadata,
  L3VariationSet,
  PathPhilosophy,
  SelectionMatrixEntry,
  Variation,
  VariationFile,
} from '@/types';

/**
 * Cache for loaded variation files
 */
const variationCache = new Map<string, VariationFile>();
const selectionMatrixCache = new Map<string, SelectionMatrixEntry[]>();
const l3VariationCache = new Map<string, Promise<L3VariationSet>>();

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

const l3VariationFiles = import.meta.glob<{ default: unknown }>(
  '/src/data/stories/*/content/layer3/*-variations.json',
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

  // Auto-generate sectionType from nodeId if missing (for Layer 1 and Layer 2 variations)
  if (!v.sectionType) {
    const nodeId = (fileNodeId || v.nodeId || meta.nodeId) as string | undefined;
    if (nodeId) {
      v.sectionType = nodeId;
    } else {
      // Fallback to 'unknown' if we can't determine it
      v.sectionType = 'unknown';
    }
  }

  // Auto-generate schemaVersion if missing
  if (!v.schemaVersion) {
    v.schemaVersion = '1.0.0';
  }

  // Set journeyPattern with priority: root level > metadata > default
  if (!v.journeyPattern && meta.journeyPattern) {
    v.journeyPattern = meta.journeyPattern;
  } else if (!v.journeyPattern) {
    v.journeyPattern = 'unknown';
  }

  // Also ensure it's in metadata
  if (!meta.journeyPattern && v.journeyPattern) {
    meta.journeyPattern = v.journeyPattern;
  } else if (!meta.journeyPattern) {
    meta.journeyPattern = 'unknown';
  }

  // Set philosophyDominant with priority: root level > metadata > default
  if (!v.philosophyDominant && meta.philosophyDominant) {
    v.philosophyDominant = meta.philosophyDominant;
  } else if (!v.philosophyDominant) {
    v.philosophyDominant = 'unknown';
  }

  // Also ensure it's in metadata
  if (!meta.philosophyDominant && v.philosophyDominant) {
    meta.philosophyDominant = v.philosophyDominant;
  } else if (!meta.philosophyDominant) {
    meta.philosophyDominant = 'unknown';
  }

  // Handle awarenessRange
  if (!meta.awarenessRange && v.awarenessRange) {
    meta.awarenessRange = v.awarenessRange;
  } else if (!meta.awarenessRange) {
    // Set default awarenessRange to match all awareness levels
    // Transformation state is the primary filter, not awareness
    meta.awarenessRange = [0, 100];
  }

  // Set awarenessLevel with priority: root level > metadata > derived from range > default
  if (!v.awarenessLevel && meta.awarenessLevel) {
    v.awarenessLevel = meta.awarenessLevel;
  } else if (!v.awarenessLevel && (meta.awarenessRange || v.awarenessRange)) {
    // Derive awarenessLevel from awarenessRange if missing
    const range = (meta.awarenessRange || v.awarenessRange) as [number, number];
    const midpoint = (range[0] + range[1]) / 2;
    v.awarenessLevel = midpoint < 35 ? 'low' : midpoint < 70 ? 'medium' : 'high';
  } else if (!v.awarenessLevel) {
    v.awarenessLevel = 'low';
  }

  // Also ensure it's in metadata
  if (!meta.awarenessLevel && v.awarenessLevel) {
    meta.awarenessLevel = v.awarenessLevel;
  } else if (!meta.awarenessLevel && meta.awarenessRange) {
    // Derive awarenessLevel from awarenessRange if missing
    const range = meta.awarenessRange as [number, number];
    const midpoint = (range[0] + range[1]) / 2;
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

  // Validate required fields before casting
  const requiredFields = [
    'variationId',
    'id',
    'sectionType',
    'schemaVersion',
    'transformationState',
    'journeyPattern',
    'philosophyDominant',
    'awarenessLevel',
    'content',
    'metadata',
  ];
  for (const field of requiredFields) {
    if (!(field in v) || v[field] === undefined) {
      throw new Error(
        `Invalid variation: missing required field '${field}' in variation ${v.id || 'unknown'}`,
      );
    }
  }

  // Safe to cast after validation
  return v as unknown as Variation;
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
 * L3 aggregate files are large arrays with a deliberately smaller schema than
 * L1/L2 variations. Parse that boundary once, when the L3 route is requested.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isJourneyPattern(value: unknown): value is JourneyPattern {
  return (
    value === 'started-stayed' ||
    value === 'started-bounced' ||
    value === 'shifted-dominant' ||
    value === 'began-lightly' ||
    value === 'met-later' ||
    value === 'unknown'
  );
}

function isPathPhilosophy(value: unknown): value is PathPhilosophy {
  return (
    value === 'accept' ||
    value === 'resist' ||
    value === 'invest' ||
    value === 'mixed' ||
    value === 'unknown'
  );
}

function isAwarenessLevel(value: unknown): value is AwarenessLevel {
  return value === 'low' || value === 'medium' || value === 'high';
}

function isL3ContentSynthesisPattern(value: unknown): value is L3ContentSynthesisPattern {
  return value === 'single-dominant' || value === 'dual-balanced' || value === 'triple-balanced';
}

function isConvergenceAlignment(value: unknown): value is 'preserve' | 'transform' | 'release' {
  return value === 'preserve' || value === 'transform' || value === 'release';
}

function parseL3Metadata(value: unknown, variationId: string, path: string): L3VariationMetadata {
  if (!isRecord(value) || typeof value.wordCount !== 'number') {
    throw new Error(`Invalid L3 metadata for ${variationId} in ${path}`);
  }

  const metadata: L3VariationMetadata = {
    ...value,
    wordCount: value.wordCount,
  };

  if (isL3ContentSynthesisPattern(value.synthesisPattern)) {
    metadata.synthesisPattern = value.synthesisPattern;
  } else {
    delete metadata.synthesisPattern;
  }

  if (isConvergenceAlignment(value.convergenceAlignment)) {
    metadata.convergenceAlignment = value.convergenceAlignment;
  } else {
    delete metadata.convergenceAlignment;
  }

  return metadata;
}

function parseL3Variation(value: unknown, path: string): L3Variation {
  if (!isRecord(value)) {
    throw new Error(`Invalid L3 variation entry in ${path}`);
  }

  const { variationId, content, journeyPattern, philosophyDominant, awarenessLevel, metadata } =
    value;

  if (
    typeof variationId !== 'string' ||
    typeof content !== 'string' ||
    !isJourneyPattern(journeyPattern) ||
    !isPathPhilosophy(philosophyDominant) ||
    !isAwarenessLevel(awarenessLevel)
  ) {
    throw new Error(`Invalid L3 variation contract in ${path}`);
  }

  return {
    variationId,
    content,
    journeyPattern,
    philosophyDominant,
    awarenessLevel,
    metadata: parseL3Metadata(metadata, variationId, path),
  };
}

function getL3Character(path: string): keyof L3VariationSet | null {
  if (path.includes('arch-L3')) {
    return 'arch';
  }
  if (path.includes('algo-L3')) {
    return 'algo';
  }
  if (path.includes('hum-L3')) {
    return 'hum';
  }
  if (path.includes('conv-L3')) {
    return 'conv';
  }
  return null;
}

function parseL3VariationFile(
  value: unknown,
  character: keyof L3VariationSet,
  path: string,
): L3VariationFile {
  const source = Array.isArray(value)
    ? value
    : isRecord(value) && Array.isArray(value.variations)
      ? value.variations
      : null;

  if (!source) {
    throw new Error(`Expected an L3 variation array in ${path}`);
  }

  return {
    nodeId: `${character}-L3`,
    variations: source.map((variation) => parseL3Variation(variation, path)),
  };
}

async function importL3Variations(storyId: string): Promise<L3VariationSet> {
  const loaded = new Map<keyof L3VariationSet, L3VariationFile>();

  await Promise.all(
    Object.entries(l3VariationFiles).map(async ([path, loadModule]) => {
      if (!path.includes(`/stories/${storyId}/`)) {
        return;
      }

      const character = getL3Character(path);
      if (!character) {
        return;
      }

      const module = await loadModule();
      loaded.set(character, parseL3VariationFile(module.default, character, path));
    }),
  );

  const arch = loaded.get('arch');
  const algo = loaded.get('algo');
  const hum = loaded.get('hum');
  const conv = loaded.get('conv');

  if (!arch || !algo || !hum || !conv) {
    throw new Error(`Incomplete L3 variation set for story "${storyId}"`);
  }

  return { arch, algo, hum, conv };
}

/**
 * Lazily load and cache all four L3 aggregate files for a story.
 */
export function loadL3Variations(storyId: string): Promise<L3VariationSet> {
  const cached = l3VariationCache.get(storyId);
  if (cached) {
    return cached;
  }

  const loading = importL3Variations(storyId).catch((error: unknown) => {
    l3VariationCache.delete(storyId);
    throw error;
  });

  l3VariationCache.set(storyId, loading);
  return loading;
}

/**
 * Load the selection matrix
 */
export function loadSelectionMatrix(storyId: string): SelectionMatrixEntry[] {
  const cachedMatrix = selectionMatrixCache.get(storyId);
  if (cachedMatrix) {
    return cachedMatrix;
  }

  // Find the selection matrix file for this story
  for (const [path, module] of Object.entries(selectionMatrixFiles)) {
    if (path.includes(storyId)) {
      const matrixData: SelectionMatrixEntry[] =
        'default' in module ? module.default : (module as unknown as SelectionMatrixEntry[]);
      selectionMatrixCache.set(storyId, matrixData);
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
  selectionMatrixCache.clear();
  l3VariationCache.clear();
}
