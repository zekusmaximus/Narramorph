import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createInitialPreferences } from '@/domain/progress/progressModel';
import { useStoryStore } from '@/stores/storyStore';

import LoadingState from './LoadingState';

describe('LoadingState', () => {
  beforeEach(() => {
    useStoryStore.setState({ preferences: createInitialPreferences() });
  });

  afterEach(() => {
    cleanup();
  });

  it('announces loading and animates the indicator when motion is allowed', () => {
    render(<LoadingState />);

    expect(screen.getByRole('status').textContent).toContain(
      'Opening the three-dimensional archive…',
    );
    expect(screen.getByTestId('loading-indicator').classList.contains('animate-spin')).toBe(true);
  });

  it('keeps the loading indicator static when the reader requests reduced motion', () => {
    useStoryStore.setState({
      preferences: { ...createInitialPreferences(), reduceMotion: true },
    });

    render(<LoadingState />);

    expect(screen.getByTestId('loading-indicator').classList.contains('animate-spin')).toBe(false);
  });
});
