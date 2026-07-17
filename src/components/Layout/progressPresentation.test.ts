import { describe, expect, it } from 'vitest';

import type { CharacterType, StoryNode, VisitRecord } from '@/types';

import { buildNarrativePath, buildProgressSummary } from './progressPresentation';

function node(
  id: string,
  title: string,
  overrides: { layer?: 1 | 2 | 3 | 4; character?: CharacterType } = {},
): StoryNode {
  return {
    id,
    character: overrides.character ?? 'archaeologist',
    layer: overrides.layer ?? 1,
    title,
    position: { x: 0, y: 0 },
    content: { initial: 'one', firstRevisit: 'two', metaAware: 'three' },
    connections: [],
    visualState: { defaultColor: '#fff', size: 20 },
    metadata: { estimatedReadTime: 1, thematicTags: [], narrativeAct: 1, criticalPath: false },
  };
}

function visit(): VisitRecord {
  return {
    visitCount: 1,
    visitTimestamps: ['2026-07-17T00:00:00.000Z'],
    currentState: 'initial',
    timeSpent: 0,
    lastVisited: '2026-07-17T00:00:00.000Z',
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

    expect(entry?.title).toBe('An unindexed passage');
    expect(JSON.stringify(entry)).not.toContain(staleId);
  });
});

describe('four-axis progress summary', () => {
  const nodes = new Map<string, StoryNode>([
    ['arch-L1', node('arch-L1', 'Opening', { layer: 1, character: 'archaeologist' })],
    ['algo-L1', node('algo-L1', 'Opening', { layer: 1, character: 'algorithm' })],
    ['arch-L2-accept', node('arch-L2-accept', 'Accept', { layer: 2 })],
    ['arch-L2-resist', node('arch-L2-resist', 'Resist', { layer: 2 })],
    ['conv-L3', node('conv-L3', 'Convergence', { layer: 3, character: 'multi-perspective' })],
    [
      'end-preserve',
      node('end-preserve', 'Preserve', { layer: 4, character: 'multi-perspective' }),
    ],
    [
      'end-transform',
      node('end-transform', 'Transform', { layer: 4, character: 'multi-perspective' }),
    ],
    ['end-release', node('end-release', 'Release', { layer: 4, character: 'multi-perspective' })],
  ]);

  it('counts each axis independently from existing progress data', () => {
    const summary = buildProgressSummary(
      {
        visitedNodes: {
          'arch-L1': visit(),
          'arch-L2-accept': visit(),
          'arch-L2-resist': visit(),
          'end-preserve': visit(),
        },
        selectionRecords: [{ sequence: 0 }, { sequence: 1 }] as never,
      },
      nodes,
    );

    expect(summary).toEqual({
      passagesOpened: 4,
      totalPassages: 8,
      pathsExplored: 2, // two L2 branch passages taken
      endingsReached: 1,
      totalEndings: 3,
      adaptationsDiscovered: 2,
    });
  });

  it('starts at zero and never counts a removed node against the reader', () => {
    const summary = buildProgressSummary(
      {
        visitedNodes: { 'removed-node-99': visit() },
        selectionRecords: [],
      },
      nodes,
    );

    expect(summary.passagesOpened).toBe(0);
    expect(summary.pathsExplored).toBe(0);
    expect(summary.endingsReached).toBe(0);
    expect(summary.totalEndings).toBe(3);
    expect(summary.totalPassages).toBe(8);
    expect(summary.adaptationsDiscovered).toBe(0);
  });
});
