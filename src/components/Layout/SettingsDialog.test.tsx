import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createInitialPreferences } from '@/domain/progress/progressModel';
import { useStoryStore } from '@/stores/storyStore';

import { SettingsDialog } from './SettingsDialog';

describe('SettingsDialog', () => {
  beforeEach(() => {
    useStoryStore.setState({ preferences: createInitialPreferences() });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders only while open', () => {
    const { rerender } = render(<SettingsDialog open={false} onClose={vi.fn()} />);

    expect(screen.queryByRole('dialog')).toBeNull();

    rerender(<SettingsDialog open onClose={vi.fn()} />);
    expect(screen.getByRole('dialog', { name: 'Shape the reading room' })).not.toBeNull();
  });

  it('updates and persists the existing reader preferences through the story store', async () => {
    const user = userEvent.setup();
    render(<SettingsDialog open onClose={vi.fn()} />);

    await user.click(screen.getByRole('radio', { name: 'Large' }));
    await user.click(screen.getByRole('radio', { name: /Night/ }));
    await user.click(screen.getByRole('checkbox', { name: /Reduce motion/ }));

    expect(useStoryStore.getState().preferences).toMatchObject({
      textSize: 'large',
      theme: 'dark',
      reduceMotion: true,
    });
    expect(screen.getByRole<HTMLInputElement>('radio', { name: 'Large' }).checked).toBe(true);
    expect(screen.getByRole<HTMLInputElement>('radio', { name: /Night/ }).checked).toBe(true);
    expect(screen.getByRole<HTMLInputElement>('checkbox', { name: /Reduce motion/ }).checked).toBe(
      true,
    );
  });

  it('provides an explicitly labelled close control', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<SettingsDialog open onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Close settings' }));

    expect(onClose).toHaveBeenCalledOnce();
  });
});
