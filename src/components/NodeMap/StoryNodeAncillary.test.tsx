import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import type { StoryNode } from '@/types';

import { STORY_NODE_THEMES } from './nodeTheme';
import { StoryNodeParticles } from './StoryNodeAncillary';

const algorithmNode = { character: 'algorithm' } as StoryNode;

describe('StoryNodeParticles', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders decorative particles when motion is allowed', () => {
    render(
      <StoryNodeParticles
        node={algorithmNode}
        theme={STORY_NODE_THEMES.algorithm}
        size={80}
        reduceMotion={false}
      />,
    );

    expect(screen.getByTestId('story-node-particles').getAttribute('aria-hidden')).toBe('true');
  });

  it('omits continuous particles when the reader requests reduced motion', () => {
    render(
      <StoryNodeParticles
        node={algorithmNode}
        theme={STORY_NODE_THEMES.algorithm}
        size={80}
        reduceMotion
      />,
    );

    expect(screen.queryByTestId('story-node-particles')).toBeNull();
  });
});
