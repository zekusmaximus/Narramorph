import type { SelectionMatrixEntry, StoryData } from '@/types';

import { getAvailableStories, loadStoryContent } from './contentLoader';
import { loadL3Variations, loadSelectionMatrix } from './variationLoader';

interface RuntimeVariationFile {
  nodeId?: unknown;
  totalVariations?: unknown;
  variations?: unknown;
}

interface RuntimeStoryDeclaration {
  structure?: {
    totalNodes?: unknown;
    totalConnections?: unknown;
  };
}

interface RuntimeManifest {
  sourceRoot?: unknown;
  counts?: {
    l1Variations?: unknown;
    l2Variations?: unknown;
    l3Variations?: unknown;
    l4Variations?: unknown;
    totalVariations?: unknown;
  };
}

export interface RuntimePackageInventory {
  storyId: string;
  storyData: StoryData;
  declaration: RuntimeStoryDeclaration | undefined;
  manifest: RuntimeManifest | undefined;
  variationFiles: Array<{
    path: string;
    layer: 1 | 2;
    data: RuntimeVariationFile;
  }>;
  l3Aggregates: Record<string, unknown>;
  l3IndividualPaths: string[];
  l4Aggregate: unknown;
  l4IndividualPaths: string[];
  selectionMatrix: unknown;
}

const runtimeVariationFiles = import.meta.glob<RuntimeVariationFile>(
  '/src/data/stories/*/content/layer{1,2}/*-variations.json',
  { eager: true, import: 'default' },
);

const runtimeStoryDeclarations = import.meta.glob<RuntimeStoryDeclaration>(
  '/src/data/stories/*/story.json',
  { eager: true, import: 'default' },
);

const runtimeManifests = import.meta.glob<RuntimeManifest>(
  '/src/data/stories/*/content/manifest.json',
  { eager: true, import: 'default' },
);

const runtimeL3Aggregates = import.meta.glob<unknown>(
  '/src/data/stories/*/content/layer3/*-L3-variations.json',
  { eager: true, import: 'default' },
);

const runtimeL3Individuals = import.meta.glob(
  '/src/data/stories/*/content/layer3/variations/*.json',
);

const runtimeL4Aggregates = import.meta.glob<unknown>(
  '/src/data/stories/*/content/layer4/terminal-variations.json',
  { eager: true, import: 'default' },
);

const runtimeL4Individuals = import.meta.glob('/src/data/stories/*/content/layer4/final-*.json');

export class RuntimeContentValidationError extends Error {
  constructor(public readonly errors: string[]) {
    super(`Runtime content validation failed:\n${errors.map((error) => `- ${error}`).join('\n')}`);
    this.name = 'RuntimeContentValidationError';
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function getStoryPathEntry<T>(entries: Record<string, T>, storyId: string): T | undefined {
  return Object.entries(entries).find(([path]) => path.includes(`/stories/${storyId}/`))?.[1];
}

function getIdFromPath(path: string): string {
  return path.slice(path.lastIndexOf('/') + 1).replace(/\.json$/, '');
}

function findDuplicateIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) {
      duplicates.add(id);
    }
    seen.add(id);
  }
  return [...duplicates].sort();
}

function validateDeterministicOrder(label: string, ids: string[]): string[] {
  const sorted = [...ids].sort((left, right) => left.localeCompare(right));
  return ids.some((id, index) => id !== sorted[index])
    ? [`${label}: records must be ordered by ID`]
    : [];
}

export function validateRuntimeVariationFile(path: string, data: RuntimeVariationFile): string[] {
  const errors: string[] = [];
  if (typeof data.nodeId !== 'string' || data.nodeId.length === 0) {
    errors.push(`${path}: missing nodeId`);
  }
  if (!Array.isArray(data.variations) || data.variations.length === 0) {
    return [...errors, `${path}: variations must be a non-empty array`];
  }
  if (data.totalVariations !== data.variations.length) {
    errors.push(
      `${path}: totalVariations (${String(data.totalVariations)}) does not match variations.length (${data.variations.length})`,
    );
  }

  const ids: string[] = [];
  data.variations.forEach((value, index) => {
    const variation = asRecord(value) ?? {};
    const label = `${path}: variations[${index}]`;
    if (typeof variation.id !== 'string' || variation.id.length === 0) {
      errors.push(`${label} missing id`);
    } else {
      ids.push(variation.id);
    }
    if (!['initial', 'firstRevisit', 'metaAware'].includes(String(variation.transformationState))) {
      errors.push(`${label} has invalid transformationState`);
    }
    if (typeof variation.content !== 'string' || variation.content.trim().length === 0) {
      errors.push(`${label} missing content`);
    }
  });

  for (const duplicate of findDuplicateIds(ids)) {
    errors.push(`${path}: duplicate variation ID ${duplicate}`);
  }
  errors.push(...validateDeterministicOrder(path, ids));
  return errors;
}

function parseAggregateIds(
  label: string,
  value: unknown,
  idField: 'id' | 'variationId',
  errors: string[],
): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`${label}: required aggregate must be a non-empty array`);
    return [];
  }

  const ids: string[] = [];
  value.forEach((entry, index) => {
    const id = asRecord(entry)?.[idField];
    if (typeof id !== 'string' || id.length === 0) {
      errors.push(`${label}: records[${index}] missing ${idField}`);
    } else {
      ids.push(id);
    }
  });
  for (const duplicate of findDuplicateIds(ids)) {
    errors.push(`${label}: duplicate variation ID ${duplicate}`);
  }
  errors.push(...validateDeterministicOrder(label, ids));
  return ids;
}

function validateMatchingSets(label: string, declaredIds: string[], actualIds: string[]): string[] {
  const errors: string[] = [];
  const declared = new Set(declaredIds);
  const actual = new Set(actualIds);
  for (const id of declared) {
    if (!actual.has(id)) {
      errors.push(`${label}: missing checked-in file for ${id}`);
    }
  }
  for (const id of actual) {
    if (!declared.has(id)) {
      errors.push(`${label}: orphaned checked-in file ${id}.json`);
    }
  }
  return errors;
}

function validateSelectionMatrix(
  storyId: string,
  value: unknown,
  nodeIds: Set<string>,
  variationIds: Set<string>,
): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    return [`${storyId}: selection matrix is missing or empty`];
  }

  const errors: string[] = [];
  const targetIds: string[] = [];
  value.forEach((entryValue, index) => {
    const entry = asRecord(entryValue);
    const label = `${storyId}: selection matrix[${index}]`;
    if (!entry) {
      errors.push(`${label} must be an object`);
      return;
    }
    if (typeof entry.fromNode !== 'string' || !nodeIds.has(entry.fromNode)) {
      errors.push(`${label} references missing fromNode ${String(entry.fromNode)}`);
    }
    const metadata = asRecord(entry.metadata);
    const metadataId = metadata?.variationId;
    if (typeof entry.toNode !== 'string' || !variationIds.has(entry.toNode)) {
      errors.push(`${label} references missing variation ${String(entry.toNode)}`);
    } else {
      targetIds.push(entry.toNode);
    }
    if (metadataId !== entry.toNode) {
      errors.push(`${label} metadata.variationId must match toNode`);
    }
  });
  for (const duplicate of findDuplicateIds(targetIds)) {
    errors.push(`${storyId}: selection matrix duplicates variation reference ${duplicate}`);
  }
  return errors;
}

/** Validates cross-file ownership, counts, references, and generated aggregates. */
export function validateRuntimePackageInventory(inventory: RuntimePackageInventory): string[] {
  const { storyId, storyData } = inventory;
  const errors: string[] = [];
  const nodeIds = storyData.nodes.map((node) => node.id);
  const connectionIds = (storyData.connections ?? []).map((connection) => connection.id);

  for (const duplicate of findDuplicateIds(nodeIds)) {
    errors.push(`${storyId}: duplicate node ID ${duplicate}`);
  }
  for (const duplicate of findDuplicateIds(connectionIds)) {
    errors.push(`${storyId}: duplicate connection ID ${duplicate}`);
  }
  if (inventory.declaration?.structure?.totalNodes !== storyData.nodes.length) {
    errors.push(
      `${storyId}: declared totalNodes (${String(inventory.declaration?.structure?.totalNodes)}) does not match loaded nodes (${storyData.nodes.length})`,
    );
  }
  if (inventory.declaration?.structure?.totalConnections !== connectionIds.length) {
    errors.push(
      `${storyId}: declared totalConnections (${String(inventory.declaration?.structure?.totalConnections)}) does not match loaded connections (${connectionIds.length})`,
    );
  }

  const storyNodeIds = new Set(nodeIds);
  const runtimeNodeIds: string[] = [];
  const layerIds: Record<1 | 2, string[]> = { 1: [], 2: [] };
  const allL1L2VariationIds: string[] = [];
  for (const file of inventory.variationFiles) {
    errors.push(...validateRuntimeVariationFile(file.path, file.data));
    if (typeof file.data.nodeId === 'string') {
      runtimeNodeIds.push(file.data.nodeId);
      if (!storyNodeIds.has(file.data.nodeId)) {
        errors.push(`${file.path}: orphaned runtime file for unknown node ${file.data.nodeId}`);
      }
    }
    if (Array.isArray(file.data.variations)) {
      for (const entry of file.data.variations) {
        const id = asRecord(entry)?.id;
        if (typeof id === 'string') {
          layerIds[file.layer].push(id);
          allL1L2VariationIds.push(id);
        }
      }
    }
  }
  for (const duplicate of findDuplicateIds(runtimeNodeIds)) {
    errors.push(`${storyId}: multiple runtime files declare node ${duplicate}`);
  }
  for (const node of storyData.nodes.filter((candidate) => candidate.layer <= 2)) {
    if (!runtimeNodeIds.includes(node.id)) {
      errors.push(`${storyId}: node ${node.id} is missing its runtime variation file`);
    }
  }
  for (const duplicate of findDuplicateIds(allL1L2VariationIds)) {
    errors.push(`${storyId}: duplicate L1/L2 variation ID ${duplicate}`);
  }

  const expectedL3AggregateNames = ['algo-L3', 'arch-L3', 'conv-L3', 'hum-L3'];
  const actualL3AggregateNames = Object.keys(inventory.l3Aggregates).sort();
  errors.push(
    ...validateMatchingSets(
      `${storyId}: L3 aggregates`,
      expectedL3AggregateNames,
      actualL3AggregateNames,
    ),
  );
  const l3Ids = Object.entries(inventory.l3Aggregates).flatMap(([name, value]) =>
    parseAggregateIds(`${storyId}: ${name} aggregate`, value, 'variationId', errors),
  );
  for (const duplicate of findDuplicateIds(l3Ids)) {
    errors.push(`${storyId}: duplicate L3 variation ID ${duplicate}`);
  }
  errors.push(
    ...validateMatchingSets(
      `${storyId}: L3 individual outputs`,
      l3Ids,
      inventory.l3IndividualPaths.map(getIdFromPath),
    ),
  );

  const l4Ids = parseAggregateIds(
    `${storyId}: L4 terminal aggregate`,
    inventory.l4Aggregate,
    'id',
    errors,
  );
  errors.push(
    ...validateMatchingSets(
      `${storyId}: L4 individual outputs`,
      l4Ids,
      inventory.l4IndividualPaths.map(getIdFromPath),
    ),
  );

  errors.push(
    ...validateSelectionMatrix(
      storyId,
      inventory.selectionMatrix,
      storyNodeIds,
      new Set(allL1L2VariationIds),
    ),
  );

  const actualCounts = {
    l1Variations: layerIds[1].length,
    l2Variations: layerIds[2].length,
    l3Variations: l3Ids.length,
    l4Variations: l4Ids.length,
  };
  const totalVariations = Object.values(actualCounts).reduce((sum, count) => sum + count, 0);
  const manifestCounts = inventory.manifest?.counts;
  for (const [name, actual] of Object.entries(actualCounts)) {
    if (manifestCounts?.[name as keyof typeof actualCounts] !== actual) {
      errors.push(
        `${storyId}: manifest ${name} (${String(manifestCounts?.[name as keyof typeof actualCounts])}) does not match actual records (${actual})`,
      );
    }
  }
  if (manifestCounts?.totalVariations !== totalVariations) {
    errors.push(
      `${storyId}: manifest totalVariations (${String(manifestCounts?.totalVariations)}) does not match actual records (${totalVariations})`,
    );
  }
  if (inventory.manifest?.sourceRoot !== 'archive/source-markdown') {
    errors.push(`${storyId}: manifest sourceRoot must be archive/source-markdown`);
  }

  return errors;
}

function buildRuntimeInventory(
  storyId: string,
  storyData: StoryData,
  selectionMatrix: SelectionMatrixEntry[],
): RuntimePackageInventory {
  const storyPath = `/stories/${storyId}/`;
  const variationFiles = Object.entries(runtimeVariationFiles)
    .filter(([path]) => path.includes(storyPath))
    .map(([path, data]) => {
      const layer: 1 | 2 = path.includes('/layer1/') ? 1 : 2;
      return { path, layer, data };
    });

  const l3Aggregates = Object.fromEntries(
    Object.entries(runtimeL3Aggregates)
      .filter(([path]) => path.includes(storyPath))
      .map(([path, data]) => [getIdFromPath(path).replace(/-variations$/, ''), data]),
  );

  return {
    storyId,
    storyData,
    declaration: getStoryPathEntry(runtimeStoryDeclarations, storyId),
    manifest: getStoryPathEntry(runtimeManifests, storyId),
    variationFiles,
    l3Aggregates,
    l3IndividualPaths: Object.keys(runtimeL3Individuals).filter((path) => path.includes(storyPath)),
    l4Aggregate: getStoryPathEntry(runtimeL4Aggregates, storyId),
    l4IndividualPaths: Object.keys(runtimeL4Individuals).filter((path) => path.includes(storyPath)),
    selectionMatrix,
  };
}

export async function validateRuntimeContent(): Promise<void> {
  const errors: string[] = [];

  for (const storyId of getAvailableStories()) {
    try {
      const storyData = await loadStoryContent(storyId);
      await loadL3Variations(storyId);
      const selectionMatrix = await loadSelectionMatrix(storyId);
      errors.push(
        ...validateRuntimePackageInventory(
          buildRuntimeInventory(storyId, storyData, selectionMatrix),
        ),
      );
    } catch (error) {
      errors.push(`${storyId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (errors.length > 0) {
    throw new RuntimeContentValidationError(errors);
  }
}
