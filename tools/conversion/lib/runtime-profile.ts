import { readFile } from 'node:fs/promises';

const L1_NODE_IDS = ['arch-L1', 'algo-L1', 'hum-L1'] as const;

export interface RuntimeProfile {
  schemaVersion: '1.0.0';
  authoredVariationCounts: {
    layer1PerNode: number;
    layer2PerNode: number;
  };
  runtimeSelection: {
    layer1: Record<(typeof L1_NODE_IDS)[number], string[]>;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requirePositiveInteger(value: unknown, field: string): number {
  if (!Number.isInteger(value) || (value as number) < 1) {
    throw new Error(`${field} must be a positive integer`);
  }
  return value as number;
}

export function parseRuntimeProfile(value: unknown): RuntimeProfile {
  if (!isRecord(value) || value.schemaVersion !== '1.0.0') {
    throw new Error('Runtime profile must use schemaVersion 1.0.0');
  }

  const counts = value.authoredVariationCounts;
  if (!isRecord(counts)) {
    throw new Error('Runtime profile is missing authoredVariationCounts');
  }

  const runtimeSelection = value.runtimeSelection;
  const layer1 = isRecord(runtimeSelection) ? runtimeSelection.layer1 : undefined;
  if (!isRecord(layer1)) {
    throw new Error('Runtime profile is missing runtimeSelection.layer1');
  }

  const selectedLayer1 = {} as RuntimeProfile['runtimeSelection']['layer1'];
  for (const nodeId of L1_NODE_IDS) {
    const ids = layer1[nodeId];
    if (!Array.isArray(ids) || ids.length === 0 || ids.some((id) => typeof id !== 'string')) {
      throw new Error(`runtimeSelection.layer1.${nodeId} must be a non-empty string array`);
    }
    if (new Set(ids).size !== ids.length) {
      throw new Error(`runtimeSelection.layer1.${nodeId} contains duplicate IDs`);
    }
    if (ids.some((id) => !id.startsWith(`${nodeId}-`))) {
      throw new Error(`runtimeSelection.layer1.${nodeId} contains an ID for another node`);
    }
    selectedLayer1[nodeId] = ids;
  }

  return {
    schemaVersion: '1.0.0',
    authoredVariationCounts: {
      layer1PerNode: requirePositiveInteger(counts.layer1PerNode, 'layer1PerNode'),
      layer2PerNode: requirePositiveInteger(counts.layer2PerNode, 'layer2PerNode'),
    },
    runtimeSelection: { layer1: selectedLayer1 },
  };
}

export async function loadRuntimeProfile(path: string): Promise<RuntimeProfile> {
  const source = await readFile(path, 'utf8');
  return parseRuntimeProfile(JSON.parse(source) as unknown);
}

export function selectRuntimeVariations<T extends { id: string }>(
  nodeId: (typeof L1_NODE_IDS)[number],
  variations: T[],
  profile: RuntimeProfile,
): T[] {
  const byId = new Map(variations.map((variation) => [variation.id, variation]));
  return profile.runtimeSelection.layer1[nodeId].map((id) => {
    const variation = byId.get(id);
    if (!variation) {
      throw new Error(`Runtime profile selects missing variation ${id}`);
    }
    return variation;
  });
}
