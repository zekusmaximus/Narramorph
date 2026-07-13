import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createInitialPreferences } from '@/domain/progress/progressModel';

import { SettingsDialog } from './SettingsDialog';

function renderSettingsDialog(props: { open: boolean; onClose?: () => void } = { open: true }) {
  let preferences = createInitialPreferences();
  const onUpdatePreferences = vi.fn((updates) => {
    preferences = { ...preferences, ...updates };
  });
  const result = render(
    <SettingsDialog
      open={props.open}
      onClose={props.onClose ?? vi.fn()}
      preferences={preferences}
      onUpdatePreferences={onUpdatePreferences}
      reduceMotion={false}
    />,
  );
  return { ...result, onUpdatePreferences };
}

describe('SettingsDialog', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders only while open', () => {
    const { rerender, onUpdatePreferences } = renderSettingsDialog({ open: false });

    expect(screen.queryByRole('dialog')).toBeNull();

    rerender(
      <SettingsDialog
        open
        onClose={vi.fn()}
        preferences={createInitialPreferences()}
        onUpdatePreferences={onUpdatePreferences}
        reduceMotion={false}
      />,
    );
    expect(screen.getByRole('dialog', { name: 'Shape the reading room' })).not.toBeNull();
  });

  it('calls the supplied preference updater without reading the story store', async () => {
    const user = userEvent.setup();
    const { onUpdatePreferences } = renderSettingsDialog();

    await user.click(screen.getByRole('radio', { name: 'Large' }));
    await user.click(screen.getByRole('radio', { name: /Night/ }));
    await user.click(screen.getByRole('checkbox', { name: /Reduce motion/ }));

    expect(onUpdatePreferences).toHaveBeenCalledWith({ textSize: 'large' });
    expect(onUpdatePreferences).toHaveBeenCalledWith({ theme: 'dark' });
    expect(onUpdatePreferences).toHaveBeenCalledWith({ reduceMotion: true });
  });

  it('provides an explicitly labelled close control', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderSettingsDialog({ open: true, onClose });

    await user.click(screen.getByRole('button', { name: 'Close settings' }));

    expect(onClose).toHaveBeenCalledOnce();
  });
});
