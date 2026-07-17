import { describe, expect, it } from 'vitest';

import { buildLayoutPresentation } from './layoutPresentation';

describe('buildLayoutPresentation', () => {
  it('builds stable shell progress metadata from narrow inputs', () => {
    expect(
      buildLayoutPresentation({
        visitedNodes: { a: 1, b: 2, c: 1 },
        totalNodes: 12,
      }),
    ).toEqual({
      visitedCount: 3,
      totalNodes: 12,
      progressPercent: 25,
      progressLabel: '3 of 12 passages opened, 25 percent opened',
    });
  });

  it('keeps empty stories at zero percent', () => {
    expect(buildLayoutPresentation({ visitedNodes: {}, totalNodes: 0 }).progressPercent).toBe(0);
  });
});
