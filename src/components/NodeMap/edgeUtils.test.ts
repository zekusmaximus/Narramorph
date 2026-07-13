import { describe, expect, it } from 'vitest';

import type { StoryNode, UserProgress } from '@/types';

import { convertToReactFlowEdges } from './edgeUtils';

function storyNode(id: string, connections: StoryNode['connections'] = []): StoryNode {
  return {
    id,
    character: 'archaeologist',
    layer: 1,
    title: id,
    position: { x: 0, y: 0 },
    content: { initial: '', firstRevisit: '', metaAware: '' },
    connections,
    visualState: { defaultColor: '#fff', size: 1 },
    metadata: {
      estimatedReadTime: 1,
      thematicTags: [],
      narrativeAct: 1,
      criticalPath: false,
    },
  };
}

describe('convertToReactFlowEdges accessibility', () => {
  it('keeps decorative connections out of the accessibility and editing models', () => {
    const nodes = new Map([
      [
        'alpha',
        storyNode('alpha', [
          {
            targetId: 'beta',
            type: 'recursive',
            label: 'A remembered route',
            bidirectional: true,
          },
        ]),
      ],
      ['beta', storyNode('beta')],
    ]);
    const progress = {
      unlockedConnections: ['alpha-beta'],
    } as unknown as UserProgress;

    const edges = convertToReactFlowEdges(nodes, progress);

    expect(edges).toHaveLength(2);
    for (const edge of edges) {
      expect(edge).toMatchObject({
        ariaRole: 'presentation',
        deletable: false,
        focusable: false,
        selectable: false,
      });
      expect(edge.ariaLabel).toBeNull();
      expect(edge.domAttributes?.['aria-hidden']).toBe(true);
      expect(edge.domAttributes?.['aria-roledescription']).toBeUndefined();
      expect(edge.animated).toBe(true);
    }

    expect(convertToReactFlowEdges(nodes, progress, true).every((edge) => !edge.animated)).toBe(
      true,
    );
  });
});
