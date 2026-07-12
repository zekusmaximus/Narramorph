import { describe, expect, it } from 'vitest';

import { loadStoryContent } from './contentLoader';

describe('loadStoryContent', () => {
  it('loads the complete Eternal Return L1-to-L4 graph with valid connection targets', async () => {
    const story = await loadStoryContent('eternal-return');
    const nodeIds = new Set(story.nodes.map((node) => node.id));

    expect(story.nodes).toHaveLength(18);
    expect(story.connections).toHaveLength(27);
    expect(story.configuration.startNodeId).toBe('arch-L1');
    expect(story.configuration.endingNodeIds).toEqual([
      'final-preserve',
      'final-transform',
      'final-release',
    ]);
    for (const connection of story.connections ?? []) {
      expect(nodeIds.has(connection.sourceId)).toBe(true);
      expect(nodeIds.has(connection.targetId)).toBe(true);
    }
  });

  it.each(['arch', 'algo', 'hum'])(
    'loads distinct accept, resist, and invest content for %s L2 nodes',
    async (characterPrefix) => {
      const story = await loadStoryContent('eternal-return');
      const initialContent = ['accept', 'resist', 'invest'].map((philosophy) => {
        const node = story.nodes.find(
          (candidate) => candidate.id === `${characterPrefix}-L2-${philosophy}`,
        );
        expect(node).toBeDefined();
        expect(node?.content.initial).not.toContain('Content not found');
        return node?.content.initial;
      });

      expect(new Set(initialContent).size).toBe(3);
    },
  );

  it('loads authored terminal content for every ending', async () => {
    const story = await loadStoryContent('eternal-return');

    for (const endingId of story.configuration.endingNodeIds) {
      const ending = story.nodes.find((node) => node.id === endingId);
      expect(ending?.layer).toBe(4);
      expect(ending?.content.initial.length).toBeGreaterThan(1_000);
      expect(ending?.content.initial).not.toContain('Content not found');
    }
  });
});
