import { describe, expect, it } from 'vitest';

import {
  RuntimeContentValidationError,
  validateRuntimeContent,
  validateRuntimeVariationFile,
} from './validateRuntimeContent';

describe('validateRuntimeVariationFile', () => {
  it('rejects fields that the migration-aware loader would normalize', () => {
    const errors = validateRuntimeVariationFile('content.json', {
      nodeId: 'arch-L1',
      totalVariations: 1,
      variations: [{ content: 'Text retained during migration.' }],
    });

    expect(errors).toEqual([
      'content.json: variations[0] missing id',
      'content.json: variations[0] has invalid transformationState',
    ]);
  });

  it('rejects a declared variation count mismatch', () => {
    const errors = validateRuntimeVariationFile('content.json', {
      nodeId: 'arch-L1',
      totalVariations: 2,
      variations: [{ id: 'arch-L1-I-001', transformationState: 'initial', content: 'Text' }],
    });

    expect(errors).toContain(
      'content.json: totalVariations (2) does not match variations.length (1)',
    );
  });
});

describe('validateRuntimeContent', () => {
  it('strictly validates all content consumed by runtime loaders', async () => {
    await expect(validateRuntimeContent()).resolves.toBeUndefined();
  });

  it('provides an aggregate CI-friendly error', () => {
    expect(new RuntimeContentValidationError(['bad content']).message).toContain('- bad content');
  });
});
