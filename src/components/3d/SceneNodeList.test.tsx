import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useMapInteractionAdapter } from '@/components/map/useMapInteractionAdapter';
import type { CharacterType, StoryNode } from '@/types';

import SceneNodeList from './SceneNodeList';

vi.mock('@/components/map/useMapInteractionAdapter', () => ({
  useMapInteractionAdapter: vi.fn(),
}));

function entry(
  id: string,
  character: CharacterType,
  layer: number,
  title: string,
  opts: { available?: boolean; selected?: boolean; visited?: boolean } = {},
) {
  return {
    node: { id, character, layer, title } as unknown as StoryNode,
    state: {},
    available: opts.available ?? true,
    selected: opts.selected ?? false,
    hovered: false,
    visited: opts.visited ?? false,
    appearance: {},
  };
}

function mockAdapter(nodes: ReturnType<typeof entry>[], activate = vi.fn(() => true)) {
  vi.mocked(useMapInteractionAdapter).mockReturnValue({
    nodes,
    activate,
  } as unknown as ReturnType<typeof useMapInteractionAdapter>);
  return activate;
}

describe('SceneNodeList', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('lists the 3D nodes as an accessible navigation region', () => {
    mockAdapter([
      entry('a1', 'archaeologist', 1, 'First Documentation'),
      entry('g1', 'algorithm', 1, 'First Process'),
    ]);
    render(<SceneNodeList />);

    const nav = screen.getByRole('navigation', { name: 'Story nodes' });
    expect(within(nav).getByRole('button', { name: /First Documentation/ })).not.toBeNull();
    expect(within(nav).getByRole('button', { name: /First Process/ })).not.toBeNull();
  });

  it('activates the same node selection the canvas would', async () => {
    const activate = mockAdapter([entry('a1', 'archaeologist', 1, 'First Documentation')]);
    const user = userEvent.setup();
    render(<SceneNodeList />);

    await user.click(screen.getByRole('button', { name: /First Documentation/ }));
    expect(activate).toHaveBeenCalledWith('a1');
  });

  it('disables locked (unavailable) nodes so they cannot be opened', () => {
    mockAdapter([entry('a2', 'archaeologist', 2, 'Sealed Fragment', { available: false })]);
    render(<SceneNodeList />);

    const button = screen.getByRole<HTMLButtonElement>('button', { name: /Sealed Fragment/ });
    expect(button.disabled).toBe(true);
  });

  it('marks the open node as the current item', () => {
    mockAdapter([
      entry('a1', 'archaeologist', 1, 'First Documentation', { selected: true, visited: true }),
    ]);
    render(<SceneNodeList />);

    const button = screen.getByRole('button', { name: /First Documentation/ });
    expect(button.getAttribute('aria-current')).toBe('true');
  });
});
