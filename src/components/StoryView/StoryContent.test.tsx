import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createInitialPreferences } from '@/domain/progress/progressModel';
import { useStoryStore } from '@/stores/storyStore';

import { StoryContent } from './StoryContent';

describe('StoryContent reading progress', () => {
  beforeEach(() => {
    useStoryStore.setState({ preferences: createInitialPreferences() });
  });

  afterEach(() => {
    cleanup();
  });

  it('reports scroll progress through a long passage', () => {
    render(
      <StoryContent
        content="A long recovered passage."
        transformationState="initial"
        textSize="medium"
        theme="dark"
      />,
    );

    const scrollRegion = screen.getByTestId('story-scroll-region');
    Object.defineProperties(scrollRegion, {
      scrollHeight: { configurable: true, value: 1000 },
      clientHeight: { configurable: true, value: 250 },
      scrollTop: { configurable: true, value: 375, writable: true },
    });

    fireEvent.scroll(scrollRegion);
    expect(
      screen
        .getByRole('progressbar', { name: 'Passage reading progress' })
        .getAttribute('aria-valuenow'),
    ).toBe('50');

    scrollRegion.scrollTop = 750;
    fireEvent.scroll(scrollRegion);
    expect(
      screen
        .getByRole('progressbar', { name: 'Passage reading progress' })
        .getAttribute('aria-valuenow'),
    ).toBe('100');
  });

  it('renders passage changes without a motion wrapper when reduced motion is requested', () => {
    useStoryStore.setState({
      preferences: { ...createInitialPreferences(), reduceMotion: true },
    });

    render(
      <StoryContent
        content="A still recovered passage."
        transformationState="firstRevisit"
        textSize="large"
        theme="dark"
      />,
    );

    expect(screen.getByTestId('story-passage').hasAttribute('style')).toBe(false);
    expect(screen.getByTestId('story-scroll-region').classList.contains('overflow-x-hidden')).toBe(
      true,
    );
  });
});
