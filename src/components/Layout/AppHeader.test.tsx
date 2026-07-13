import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppHeader } from './AppHeader';

describe('AppHeader', () => {
  it('keeps the story title as the page heading and offers a main-content skip link', () => {
    render(<AppHeader visitedCount={0} onOpenProgress={vi.fn()} onOpenSettings={vi.fn()} />);

    expect(screen.queryByRole('heading', { level: 1, name: 'Narramorph Fiction' })).toBeNull();
    expect(screen.getByText('Narramorph Fiction')).not.toBeNull();
    expect(screen.getByRole('link', { name: 'Skip to story' }).getAttribute('href')).toBe(
      '#main-content',
    );
  });
});
