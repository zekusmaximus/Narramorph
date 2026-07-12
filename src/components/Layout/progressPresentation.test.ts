import { describe, expect, it } from 'vitest';

import type { StoryNode } from '@/types';

import { buildNarrativePath } from './progressPresentation';

function node(id: string, title: string): StoryNode {
  return {
    id,
    character: 'archaeologist',
    layer: 1,
    title,
    position: { x: 0, y: 0 },
    content: { initial: 'one', firstRevisit: 'two', metaAware: 'three' },
    connections: [],
    visualState: { defaultColor: '#fff', size: 20 },
    metadata: { estimatedReadTime: 1, thematicTags: [], narrativeAct: 1, criticalPath: false },
  };
}

describe('narrative reading path', () => {
  it('uses story titles and clear language for returns', () => {
    const nodes = new Map([
      ['arch-L1', node('arch-L1', 'First Documentation')],
      ['arch-L2', node('arch-L2', 'The Broken Index')],
    ]);

    expect(buildNarrativePath(['arch-L1', 'arch-L2', 'arch-L1', 'arch-L1'], nodes)).toEqual([
      expect.objectContaining({
        action: 'Encountered',
        title: 'First Documentation',
        occurrence: 1,
      }),
      expect.objectContaining({ action: 'Encountered', title: 'The Broken Index', occurrence: 1 }),
      expect.objectContaining({
        action: 'Returned to',
        title: 'First Documentation',
        occurrence: 2,
      }),
      expect.objectContaining({
        action: 'Returned again to',
        title: 'First Documentation',
        occurrence: 3,
      }),
    ]);
  });

  it('counts occurrences before limiting the visible path', () => {
    const nodes = new Map([['arch-L1', node('arch-L1', 'First Documentation')]]);
    const path = Array.from({ length: 12 }, () => 'arch-L1');

    const entries = buildNarrativePath(path, nodes, 2);
    expect(entries.map((entry) => entry.occurrence)).toEqual([11, 12]);
  });

  it('never exposes stale internal IDs', () => {
    const staleId = 'removed-internal-node-42';
    const [entry] = buildNarrativePath([staleId], new Map());

    expect(entry?.title).toBe('An unindexed archive fragment');
    expect(JSON.stringify(entry)).not.toContain(staleId);
  });
});
