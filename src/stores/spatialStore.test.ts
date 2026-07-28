import { afterEach, describe, expect, it } from 'vitest';

import { SCENE_CONFIG } from '@/components/3d/sceneConfig';
import type { StoryNode } from '@/types';

import { useSpatialStore } from './spatialStore';

function node(id: string): StoryNode {
  return { id } as unknown as StoryNode;
}

describe('spatialStore named layout', () => {
  afterEach(() => useSpatialStore.setState({ positions: {} }));

  it('uses the configured ring radius and perspective spacing', () => {
    useSpatialStore
      .getState()
      .computeLayout([{ nodes: [node('past')] }, { nodes: [node('present')] }]);

    expect(useSpatialStore.getState().positions).toEqual({
      past: [SCENE_CONFIG.layout.ringRadius, 0, 0],
      present: [SCENE_CONFIG.layout.ringRadius, 0, SCENE_CONFIG.layout.perspectiveSpacing],
    });
  });
});
