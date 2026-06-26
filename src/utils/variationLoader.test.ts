import { beforeEach, describe, expect, it } from 'vitest';

import { clearVariationCache, loadSelectionMatrix } from './variationLoader';

describe('loadSelectionMatrix', () => {
  beforeEach(() => {
    clearVariationCache();
  });

  it('loads the story matrix without leaking it to another story cache key', () => {
    const matrix = loadSelectionMatrix('eternal-return');

    expect(matrix.length).toBeGreaterThan(0);
    expect(loadSelectionMatrix('missing-story')).toEqual([]);
    expect(loadSelectionMatrix('eternal-return')).toBe(matrix);
  });
});
