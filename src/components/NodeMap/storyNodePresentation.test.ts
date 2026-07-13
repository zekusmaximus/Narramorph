import { describe, expect, it } from 'vitest';

import type { NodeUIState, StoryNode } from '@/types';

import { buildStoryNodePresentation, getConnectionTargetIds } from './storyNodePresentation';

function node(id: string, targetIds: string[] = []): StoryNode {
  return {
    id,
    character: 'algorithm',
    layer: 1,
    title: id,
    position: { x: 0, y: 0 },
    content: { initial: '', firstRevisit: '', metaAware: '' },
    connections: targetIds.map((targetId) => ({ targetId, type: 'temporal' })),
    visualState: { defaultColor: '#fff', size: 1 },
    metadata: { estimatedReadTime: 1, thematicTags: [], narrativeAct: 1, criticalPath: id === 'a' },
  };
}

const state: NodeUIState = {
  id: 'a',
  position: { x: 0, y: 0 },
  visited: true,
  visitCount: 2,
  currentState: 'metaAware',
  transformationAvailable: true,
  highlighted: false,
  connected: false,
  visualProperties: { color: '#fff', size: 1, opacity: 1, glow: false, pulse: false },
};

describe('story node presentation model', () => {
  it('builds narrow presentation fields for visible node states', () => {
    expect(
      buildStoryNodePresentation({
        node: node('a'),
        nodeState: state,
        available: true,
        isConnectionTarget: true,
        reduceMotion: true,
      }),
    ).toMatchObject({
      size: 80,
      canVisit: true,
      isVisited: true,
      isMetaAware: true,
      isCritical: true,
      isConnectionTarget: true,
      reduceMotion: true,
    });
  });

  it('updates connection targets from the selected node once at the boundary', () => {
    const nodes = new Map([
      ['a', node('a', ['b'])],
      ['b', node('b')],
      ['c', node('c')],
    ]);
    expect([...getConnectionTargetIds(nodes, 'a')]).toEqual(['b']);
    expect([...getConnectionTargetIds(nodes, 'b')]).toEqual([]);
  });
});
