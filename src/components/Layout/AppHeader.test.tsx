import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppHeader } from './AppHeader';

describe('AppHeader', () => {
  afterEach(() => {
    cleanup();
  });

  it('keeps the story title as the page heading and offers a main-content skip link', () => {
    render(
      <AppHeader
        visitedCount={0}
        onOpenProgress={vi.fn()}
        onOpenSettings={vi.fn()}
        onOpenHelp={vi.fn()}
      />,
    );

    expect(screen.queryByRole('heading', { level: 1, name: 'Narramorph Fiction' })).toBeNull();
    expect(screen.getByText('Narramorph Fiction')).not.toBeNull();
    expect(screen.getByRole('link', { name: 'Skip to story' }).getAttribute('href')).toBe(
      '#main-content',
    );
  });

  it('exposes a help entry that opens the reader’s guide', () => {
    const onOpenHelp = vi.fn();
    render(
      <AppHeader
        visitedCount={0}
        onOpenProgress={vi.fn()}
        onOpenSettings={vi.fn()}
        onOpenHelp={onOpenHelp}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open the reader’s guide' }));
    expect(onOpenHelp).toHaveBeenCalledTimes(1);
  });
});
