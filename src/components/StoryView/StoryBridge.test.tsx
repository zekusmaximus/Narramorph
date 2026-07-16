import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { StoryBridge } from './StoryBridge';

describe('StoryBridge', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders bridge prose as a static, labelled note within the reading flow', () => {
    render(
      <StoryBridge
        bridge={{ bridgeId: 'b1', content: 'The archive gives way to the engine.' }}
        theme="dark"
      />,
    );

    const note = screen.getByTestId('story-bridge');
    expect(note.getAttribute('role')).toBe('note');
    expect(note.getAttribute('aria-label')).toBe('Passage transition');
    expect(screen.getByText('The archive gives way to the engine.')).toBeTruthy();
  });

  it('renders without any interactive controls so it cannot trap focus', () => {
    render(
      <StoryBridge bridge={{ bridgeId: 'b1', content: 'A quiet transition.' }} theme="light" />,
    );

    const note = screen.getByTestId('story-bridge');
    expect(note.querySelector('button, a, input, [tabindex]')).toBeNull();
  });
});
