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

  it('keeps L1, L2, and ending prose out of the topology shell', async () => {
    const story = await loadStoryContent('eternal-return');

    for (const node of story.nodes.filter((candidate) => candidate.layer !== 3)) {
      expect(node.content.initial).toBe('This passage loads when you open it.');
    }
  });
});
