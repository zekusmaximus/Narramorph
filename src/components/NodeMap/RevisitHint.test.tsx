import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useStoryStore } from '@/stores';

import { RevisitHint } from './RevisitHint';
import { REVISIT_HINT_STORAGE_KEY } from './revisitHintStorage';

vi.mock('@/stores', () => ({
  useStoryStore: vi.fn(),
}));

interface FakeState {
  progress: { visitedNodes: Record<string, unknown> };
  storyViewOpen: boolean;
}

function mockStore(state: FakeState): void {
  vi.mocked(useStoryStore).mockImplementation(((selector: (s: FakeState) => unknown) =>
    selector(state)) as unknown as typeof useStoryStore);
}

describe('RevisitHint', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('does not show before the reader has opened any passage', () => {
    mockStore({ progress: { visitedNodes: {} }, storyViewOpen: false });
    render(<RevisitHint />);
    expect(screen.queryByTestId('revisit-hint')).toBeNull();
  });

  it('does not show while a passage is being read', () => {
    mockStore({ progress: { visitedNodes: { 'arch-L1': {} } }, storyViewOpen: true });
    render(<RevisitHint />);
    expect(screen.queryByTestId('revisit-hint')).toBeNull();
  });

  it('shows once a passage is opened and the reader is back on the map', () => {
    mockStore({ progress: { visitedNodes: { 'arch-L1': {} } }, storyViewOpen: false });
    render(<RevisitHint />);
    expect(screen.getByTestId('revisit-hint')).not.toBeNull();
    // The invitation never forces a revisit; it is a keyboard-reachable dismiss control.
    expect(screen.getByRole('button', { name: 'Dismiss revisit hint' })).not.toBeNull();
  });

  it('dismisses permanently and persists the dismissal', async () => {
    mockStore({ progress: { visitedNodes: { 'arch-L1': {} } }, storyViewOpen: false });
    const user = userEvent.setup();
    render(<RevisitHint />);

    await user.click(screen.getByRole('button', { name: 'Dismiss revisit hint' }));

    expect(screen.queryByTestId('revisit-hint')).toBeNull();
    expect(window.localStorage.getItem(REVISIT_HINT_STORAGE_KEY)).toBe('true');
  });

  it('stays hidden on a browser that already dismissed it', () => {
    window.localStorage.setItem(REVISIT_HINT_STORAGE_KEY, 'true');
    mockStore({ progress: { visitedNodes: { 'arch-L1': {} } }, storyViewOpen: false });
    render(<RevisitHint />);
    expect(screen.queryByTestId('revisit-hint')).toBeNull();
  });
});
