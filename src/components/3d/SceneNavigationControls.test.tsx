import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import SceneNavigationControls from './SceneNavigationControls';

describe('SceneNavigationControls', () => {
  afterEach(cleanup);

  it('offers reset/focus commands and explains structural state and route cues', async () => {
    const onReset = vi.fn();
    const onFocusSelected = vi.fn();
    const user = userEvent.setup();
    render(
      <SceneNavigationControls
        selectedLabel="First Documentation"
        onReset={onReset}
        onFocusSelected={onFocusSelected}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Reset 3D view' }));
    await user.click(screen.getByRole('button', { name: 'Focus selected passage' }));
    expect(onReset).toHaveBeenCalledOnce();
    expect(onFocusSelected).toHaveBeenCalledOnce();

    await user.click(screen.getByText('3D legend'));
    const legend = screen.getByLabelText('3D map legend');
    expect(legend.textContent).toContain('Wireframe: locked');
    expect(legend.textContent).toContain('Dashed route: locked');
    expect(screen.getByRole('status').textContent).toContain('First Documentation');
  });

  it('disables focus until a passage is selected', () => {
    render(
      <SceneNavigationControls selectedLabel={null} onReset={vi.fn()} onFocusSelected={vi.fn()} />,
    );

    expect(
      screen.getByRole<HTMLButtonElement>('button', { name: 'Focus selected passage' }).disabled,
    ).toBe(true);
  });
});
