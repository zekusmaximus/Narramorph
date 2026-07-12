import { getAvailableStories, loadStoryContent } from './contentLoader';
import { loadL3Variations, loadSelectionMatrix } from './variationLoader';

interface RuntimeVariationFile {
  nodeId?: unknown;
  totalVariations?: unknown;
  variations?: unknown;
}

const runtimeVariationFiles = import.meta.glob<RuntimeVariationFile>(
  '/src/data/stories/*/content/layer{1,2}/*-variations.json',
  { eager: true, import: 'default' },
);

export class RuntimeContentValidationError extends Error {
  constructor(public readonly errors: string[]) {
    super(`Runtime content validation failed:\n${errors.map((error) => `- ${error}`).join('\n')}`);
    this.name = 'RuntimeContentValidationError';
  }
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

  data.variations.forEach((value, index) => {
    const variation = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
    const label = `${path}: variations[${index}]`;
    if (typeof variation.id !== 'string' || variation.id.length === 0) {
      errors.push(`${label} missing id`);
    }
    if (!['initial', 'firstRevisit', 'metaAware'].includes(String(variation.transformationState))) {
      errors.push(`${label} has invalid transformationState`);
    }
    if (typeof variation.content !== 'string' || variation.content.trim().length === 0) {
      errors.push(`${label} missing content`);
    }
  });

  return errors;
}

export async function validateRuntimeContent(): Promise<void> {
  const errors = Object.entries(runtimeVariationFiles).flatMap(([path, data]) =>
    validateRuntimeVariationFile(path, data),
  );

  for (const storyId of getAvailableStories()) {
    try {
      await loadStoryContent(storyId);
      await loadL3Variations(storyId);
      if (loadSelectionMatrix(storyId).length === 0) {
        errors.push(`${storyId}: selection matrix is missing or empty`);
      }
    } catch (error) {
      errors.push(`${storyId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (errors.length > 0) {
    throw new RuntimeContentValidationError(errors);
  }
}
