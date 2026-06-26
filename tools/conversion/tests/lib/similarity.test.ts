import { describe, expect, it } from 'vitest';

import { calculateExactSimilarity, detectSimilarVariations } from '../../lib/similarity.js';

describe('similarity indexing', () => {
  it('handles short signatures and single-item groups without missing-index failures', () => {
    expect(
      detectSimilarVariations([
        {
          id: 'only',
          content: 'A',
          groupKey: 'single',
        },
      ]),
    ).toEqual([]);
  });

  it('returns the stable pair IDs for duplicate candidates', () => {
    const results = detectSimilarVariations([
      { id: 'second', content: 'identical narrative text', groupKey: 'group' },
      { id: 'first', content: 'identical narrative text', groupKey: 'group' },
    ]);

    expect(results).toEqual([{ id1: 'first', id2: 'second', similarity: 1 }]);
    expect(calculateExactSimilarity('same content', 'same content')).toBe(1);
  });
});
