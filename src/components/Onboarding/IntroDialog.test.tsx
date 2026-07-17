import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { INTRO_STEPS, INTRO_TITLE } from './introContent';
import { IntroDialog } from './IntroDialog';

function renderIntro(
  props: {
    open?: boolean;
    origin?: 'first-run' | 'help';
    onClose?: () => void;
    reduceMotion?: boolean;
  } = {},
) {
  return render(
    <IntroDialog
      open={props.open ?? true}
      origin={props.origin ?? 'first-run'}
      onClose={props.onClose ?? vi.fn()}
      reduceMotion={props.reduceMotion ?? false}
    />,
  );
}

describe('IntroDialog', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders only while open', () => {
    const { rerender } = renderIntro({ open: false });
    expect(screen.queryByRole('dialog')).toBeNull();

    rerender(<IntroDialog open origin="first-run" onClose={vi.fn()} reduceMotion={false} />);
    expect(screen.getByRole('dialog', { name: INTRO_TITLE })).not.toBeNull();
  });

  it('is a labelled modal dialog', () => {
    renderIntro();
    const dialog = screen.getByRole('dialog', { name: INTRO_TITLE });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
  });

  it('covers begin, node interaction, path sensitivity, and revisit', () => {
    renderIntro();
    // All four required onboarding concepts are present as headings.
    for (const step of INTRO_STEPS) {
      expect(screen.getByRole('heading', { name: step.heading })).not.toBeNull();
    }
  });

  it('offers a skip control and a begin control on first run, both closing', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderIntro({ origin: 'first-run', onClose });

    await user.click(screen.getByRole('button', { name: 'Skip introduction' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    await user.click(screen.getByTestId('intro-primary-action'));
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId('intro-primary-action').textContent).toBe('Begin reading');
  });

  it('presents a help-mode close instead of skip/begin when opened on demand', () => {
    renderIntro({ origin: 'help' });
    expect(screen.getByRole('button', { name: 'Close guide' })).not.toBeNull();
    expect(screen.getByTestId('intro-primary-action').textContent).toBe('Back to the archive');
    expect(screen.queryByRole('button', { name: 'Skip introduction' })).toBeNull();
  });

  it('closes on Escape (keyboard completion path)', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderIntro({ onClose });

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders the same guidance under reduced motion', () => {
    renderIntro({ reduceMotion: true });
    expect(screen.getByRole('dialog', { name: INTRO_TITLE })).not.toBeNull();
    const demo = screen.getByTestId('intro-node-demo');
    expect(demo.getAttribute('data-reduced-motion')).toBe('true');
    // The four concepts are still fully explained in text.
    for (const step of INTRO_STEPS) {
      expect(screen.getByRole('heading', { name: step.heading })).not.toBeNull();
    }
  });
});
