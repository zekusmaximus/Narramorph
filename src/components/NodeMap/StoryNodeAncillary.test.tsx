import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createInitialPreferences } from '@/domain/progress/progressModel';
import { useStoryStore } from '@/stores/storyStore';
import type { StoryNode } from '@/types';

import { STORY_NODE_THEMES } from './nodeTheme';
import { StoryNodeParticles } from './StoryNodeAncillary';

const algorithmNode = { character: 'algorithm' } as StoryNode;

describe('StoryNodeParticles', () => {
  beforeEach(() => {
    useStoryStore.setState({ preferences: createInitialPreferences() });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders decorative particles when motion is allowed', () => {
    render(
      <StoryNodeParticles node={algorithmNode} theme={STORY_NODE_THEMES.algorithm} size={80} />,
    );

    expect(screen.getByTestId('story-node-particles').getAttribute('aria-hidden')).toBe('true');
  });

  it('omits continuous particles when the reader requests reduced motion', () => {
    useStoryStore.setState({
      preferences: { ...createInitialPreferences(), reduceMotion: true },
    });

    render(
      <StoryNodeParticles node={algorithmNode} theme={STORY_NODE_THEMES.algorithm} size={80} />,
    );

    expect(screen.queryByTestId('story-node-particles')).toBeNull();
  });
});
