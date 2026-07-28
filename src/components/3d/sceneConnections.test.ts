import { describe, expect, it } from 'vitest';

import type { MapNodeAdapter } from '@/components/map/mapAdapters';
import type { StoryNode } from '@/types';

import { selectSceneConnections } from './sceneConnections';

function entry(
  id: string,
  options: {
    available?: boolean;
    selected?: boolean;
    connections?: StoryNode['connections'];
  } = {},
): MapNodeAdapter {
  return {
    node: {
      id,
      connections: options.connections ?? [],
    } as unknown as StoryNode,
    available: options.available ?? true,
    selected: options.selected ?? false,
    visited: false,
    hovered: false,
    state: {} as MapNodeAdapter['state'],
    appearance: {} as MapNodeAdapter['appearance'],
  };
}

describe('selectSceneConnections', () => {
  it('keeps direction, lock state, selection emphasis, and bidirectionality', () => {
    const source = entry('source', {
      selected: true,
      connections: [
        {
          targetId: 'target',
          type: 'temporal',
          bidirectional: true,
        },
      ],
    });
    const target = entry('target', { available: false });

    expect(
      selectSceneConnections([source, target], {
        source: [0, 0, 0],
        target: [10, 0, 0],
      }),
    ).toEqual([
      expect.objectContaining({
        id: 'source-target',
        sourceId: 'source',
        targetId: 'target',
        type: 'temporal',
        bidirectional: true,
        locked: true,
        highlighted: true,
      }),
    ]);
  });

  it('omits routes whose target is outside the bounded scene', () => {
    const source = entry('source', {
      connections: [{ targetId: 'outside', type: 'hidden' }],
    });

    expect(selectSceneConnections([source], { source: [0, 0, 0] })).toEqual([]);
  });
});
