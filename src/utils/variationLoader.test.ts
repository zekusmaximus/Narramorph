import { beforeEach, describe, expect, it } from 'vitest';

import { clearVariationCache, loadSelectionMatrix, loadVariationFile } from './variationLoader';

describe('loadSelectionMatrix', () => {
  beforeEach(() => {
    clearVariationCache();
  });

  it('loads the story matrix without leaking it to another story cache key', async () => {
    const matrix = await loadSelectionMatrix('eternal-return');

    expect(matrix.length).toBeGreaterThan(0);
    await expect(loadSelectionMatrix('missing-story')).resolves.toEqual([]);
    await expect(loadSelectionMatrix('eternal-return')).resolves.toBe(matrix);
  });
});

describe('loadVariationFile', () => {
  beforeEach(() => {
    clearVariationCache();
  });

  it.each(['arch', 'algo', 'hum'])(
    'loads distinct authored accept, resist, and invest passages for %s on demand',
    async (characterPrefix) => {
      const files = await Promise.all(
        ['accept', 'resist', 'invest'].map((philosophy) =>
          loadVariationFile('eternal-return', `${characterPrefix}-L2-${philosophy}`),
        ),
      );
      const initialContent = files.map((file) => file?.variations[0]?.content);

      expect(initialContent.every((content) => (content?.length ?? 0) > 1_000)).toBe(true);
      expect(new Set(initialContent).size).toBe(3);
    },
  );

  it('loads and caches each authored ending behind the L4 boundary', async () => {
    for (const endingId of ['final-preserve', 'final-transform', 'final-release']) {
      const ending = await loadVariationFile('eternal-return', endingId);
      const cached = await loadVariationFile('eternal-return', endingId);

      expect(ending?.variations[0]?.content.length).toBeGreaterThan(1_000);
      expect(ending?.variations[0]?.content.slice(0, 1_000)).not.toMatch(
        /(?:variationId|nodeId|terminalEndpoint|Content Architecture)/,
      );
      expect(cached).toBe(ending);
    }
  });
});
