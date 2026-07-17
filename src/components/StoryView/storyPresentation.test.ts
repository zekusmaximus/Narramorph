import { describe, expect, it } from 'vitest';

import type { StoryNode } from '@/types';

import {
  countReadableWords,
  estimateReadingMinutes,
  formatEstimatedReadingTime,
  getAvailableContinuationNodes,
} from './storyPresentation';

function node(id: string, connections: StoryNode['connections'] = []): StoryNode {
  return {
    id,
    character: 'algorithm',
    layer: 1,
    title: id,
    position: { x: 0, y: 0 },
    content: { initial: 'one', firstRevisit: 'two', metaAware: 'three' },
    connections,
    visualState: { defaultColor: '#fff', size: 20 },
    metadata: { estimatedReadTime: 1, thematicTags: [], narrativeAct: 1, criticalPath: false },
  };
}

describe('selected-passage reading time', () => {
  it('counts readable text without front matter, Markdown destinations, or formatting marks', () => {
    const content = `---\nid: hidden-metadata\n---\n**The archive** remembers [this fragment](https://example.com/private).`;

    expect(countReadableWords(content)).toBe(5);
  });

  it('calculates minutes from the actual word count', () => {
    expect(estimateReadingMinutes(Array.from({ length: 225 }, () => 'word').join(' '))).toBe(1);
    expect(estimateReadingMinutes(Array.from({ length: 226 }, () => 'word').join(' '))).toBe(2);
  });

  it('formats short and empty passages without using static node metadata', () => {
    expect(formatEstimatedReadingTime('Only a few words remain.')).toBe('Less than 1 min read');
    expect(formatEstimatedReadingTime('')).toBe('Brief passage');
  });
});

describe('reader continuation choices', () => {
  it('keeps only existing, visitable graph targets and removes duplicates', () => {
    const current = node('origin', [
      { targetId: 'available', type: 'temporal' },
      { targetId: 'locked', type: 'temporal' },
      { targetId: 'missing', type: 'temporal' },
      { targetId: 'available', type: 'temporal' },
    ]);
    const available = node('available');
    const locked = node('locked');
    const nodes = new Map([
      [available.id, available],
      [locked.id, locked],
    ]);

    expect(getAvailableContinuationNodes(current, nodes, (nodeId) => nodeId !== 'locked')).toEqual([
      available,
    ]);
  });
});
