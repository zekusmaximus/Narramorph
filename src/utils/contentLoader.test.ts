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

  it('attaches the authored edge bridge to its real within-perspective edge only', async () => {
    const story = await loadStoryContent('eternal-return');
    const connections = story.connections ?? [];

    const bridged = connections.find(
      (connection) => connection.sourceId === 'algo-L1' && connection.targetId === 'algo-L2-invest',
    );
    expect(bridged?.bridge).toBeDefined();
    expect(bridged?.bridge?.omitWhenUnmatched).toBe(true);
    expect(bridged?.bridge?.alternatives).toHaveLength(1);
    expect(bridged?.bridge?.alternatives[0]?.id).toBe(
      'algo-L1__algo-L2-invest__from-archaeologist',
    );
    expect(bridged?.bridge?.alternatives[0]?.condition).toEqual({
      kind: 'orderSeen',
      passageIds: ['arch-L1', 'algo-L1'],
    });

    // No other edge carries a bridge yet.
    const bridgedCount = connections.filter((connection) => connection.bridge).length;
    expect(bridgedCount).toBe(1);
  });

  it('keeps L1, L2, and ending prose out of the topology shell', async () => {
    const story = await loadStoryContent('eternal-return');

    for (const node of story.nodes.filter((candidate) => candidate.layer !== 3)) {
      expect(node.content.initial).toBe('This passage loads when you open it.');
    }
  });
});
