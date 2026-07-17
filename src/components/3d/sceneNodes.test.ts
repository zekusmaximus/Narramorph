import { describe, expect, it } from 'vitest';

import type { CharacterType, StoryNode } from '@/types';

import { SCENE_NODE_LIMIT, selectSceneNodeGroups, selectSceneNodeIds } from './sceneNodes';

function node(id: string, character: CharacterType, layer: number, title?: string): StoryNode {
  return { id, character, layer, title } as unknown as StoryNode;
}

describe('selectSceneNodeGroups', () => {
  it('groups nodes by perspective in archaeologist → algorithm → last-human order', () => {
    const groups = selectSceneNodeGroups([
      node('h1', 'last-human', 1),
      node('a1', 'archaeologist', 1),
      node('g1', 'algorithm', 1),
    ]);
    expect(groups.map((group) => group.type)).toEqual(['archaeologist', 'algorithm', 'last-human']);
  });

  it('excludes multi-perspective nodes (not placed in the constellation)', () => {
    const groups = selectSceneNodeGroups([
      node('a1', 'archaeologist', 1),
      node('c1', 'multi-perspective', 1),
    ]);
    expect(groups.flatMap((group) => group.nodes.map((n) => n.id))).toEqual(['a1']);
  });

  it('sorts each group by layer then title', () => {
    const groups = selectSceneNodeGroups([
      node('a-l2-b', 'archaeologist', 2, 'Beta'),
      node('a-l1', 'archaeologist', 1, 'Zeta'),
      node('a-l2-a', 'archaeologist', 2, 'Alpha'),
    ]);
    expect(groups[0]?.nodes.map((n) => n.id)).toEqual(['a-l1', 'a-l2-a', 'a-l2-b']);
  });

  it('caps the total at the scene limit', () => {
    const many = Array.from({ length: SCENE_NODE_LIMIT + 5 }, (_, i) =>
      node(`a${i}`, 'archaeologist', 1, `Title ${String(i).padStart(2, '0')}`),
    );
    const ids = selectSceneNodeIds(many);
    expect(ids).toHaveLength(SCENE_NODE_LIMIT);
  });

  it('returns an empty result for no placeable nodes', () => {
    expect(selectSceneNodeGroups([])).toEqual([]);
    expect(selectSceneNodeGroups([node('c1', 'multi-perspective', 1)])).toEqual([]);
  });
});
