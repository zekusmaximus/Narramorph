import { describe, expect, it } from 'vitest';

import type { StoryNode, VisitRecord } from '@/types';

import { buildNodeMapAtmosphereModel } from './atmospherePresentation';

function node(id: string, character: StoryNode['character'], x: number): StoryNode {
  return {
    id,
    character,
    layer: 1,
    title: id,
    position: { x, y: x },
    content: { initial: '', firstRevisit: '', metaAware: '' },
    connections: [],
    visualState: { defaultColor: '#fff', size: 1 },
    metadata: { estimatedReadTime: 1, thematicTags: [], narrativeAct: 1, criticalPath: false },
  };
}

const visit = { visitCount: 1 } as VisitRecord;

describe('node map atmosphere model', () => {
  it('emits latest five valid path entries and ignores missing nodes', () => {
    const storyNodes = new Map(
      ['a', 'b', 'c', 'd', 'e', 'f'].map((id, index) => [id, node(id, 'archaeologist', index)]),
    );
    const model = buildNodeMapAtmosphereModel({
      storyNodes,
      readingPath: ['missing', 'a', 'b', 'c', 'd', 'e', 'f'],
      visitedNodes: {},
    });
    expect(model.readingPathPoints.map((point) => point.key)).toEqual([
      'b-0',
      'c-1',
      'd-2',
      'e-3',
      'f-4',
    ]);
  });

  it('limits neural and discovery positions to visited valid nodes', () => {
    const storyNodes = new Map([
      ['a', node('a', 'algorithm', 1)],
      ['b', node('b', 'archaeologist', 2)],
      ['c', node('c', 'algorithm', 3)],
    ]);
    const model = buildNodeMapAtmosphereModel({
      storyNodes,
      readingPath: [],
      visitedNodes: { a: visit, b: visit, missing: visit },
    });
    expect(model.neuralNetworkPoints.map((point) => point.id)).toEqual(['a']);
    expect(model.discoveryPoints.map((point) => point.key)).toEqual(['a', 'b']);
  });
});
