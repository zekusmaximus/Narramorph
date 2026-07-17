import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { AnimatedNodeDemo } from './AnimatedNodeDemo';
import { INTRO_DEMO_CAPTION } from './introContent';

describe('AnimatedNodeDemo', () => {
  afterEach(() => {
    cleanup();
  });

  it('carries its meaning in a text caption, not only in motion', () => {
    render(<AnimatedNodeDemo reduceMotion={false} />);
    // The caption is real, readable text — not an animation-only signal.
    expect(screen.getByText(INTRO_DEMO_CAPTION)).not.toBeNull();
  });

  it('marks the decorative SVG as hidden from assistive technology', () => {
    const { container } = render(<AnimatedNodeDemo reduceMotion={false} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders a static equivalent under reduced motion (caption unchanged)', () => {
    render(<AnimatedNodeDemo reduceMotion />);
    const figure = screen.getByTestId('intro-node-demo');
    expect(figure.getAttribute('data-reduced-motion')).toBe('true');
    // The explanation is identical whether or not motion runs.
    expect(screen.getByText(INTRO_DEMO_CAPTION)).not.toBeNull();
  });
});
