import { describe, expect, it } from 'vitest';

import { resolveStoryContentPath } from './contentPath';

describe('resolveStoryContentPath', () => {
  it('resolves definition paths to Vite glob keys', () => {
    expect(
      resolveStoryContentPath('eternal-return', 'content/layer2/arch-L2-resist-variations.json'),
    ).toBe('/src/data/stories/eternal-return/content/layer2/arch-L2-resist-variations.json');
  });

  it('normalizes Windows separators and a leading slash', () => {
    expect(resolveStoryContentPath('story', '\\content\\layer1\\node.json')).toBe(
      '/src/data/stories/story/content/layer1/node.json',
    );
  });

  it('rejects paths that leave the story directory', () => {
    expect(() => resolveStoryContentPath('story', '../other/content.json')).toThrow(
      'cannot traverse outside its story',
    );
  });
});
