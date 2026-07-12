import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StoryContent } from './StoryContent';

describe('StoryContent reading progress', () => {
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
});
