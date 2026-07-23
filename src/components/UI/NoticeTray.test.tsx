import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useStoryStore } from '@/stores';

import { NoticeTray } from './NoticeTray';

const downloadTextFile = vi.fn();
vi.mock('@/utils/journeyDownload', () => ({
  downloadTextFile: (...args: unknown[]) => downloadTextFile(...args),
  openHtmlDocument: vi.fn(),
}));

interface StoreOverrides {
  [key: string]: unknown;
}

function makeNode(id: string, character: string, layer: number, title: string): unknown {
  return { id, character, layer, title };
}

function setStore(overrides: StoreOverrides): void {
  useStoryStore.setState({
    storyData: { metadata: { title: 'Eternal Return' } } as never,
    exportProgress: () => '{"version":"1.3.0"}',
    importProgress: vi.fn() as never,
    nodes: new Map() as never,
    unlockConfigs: new Map() as never,
    recentlyUnlockedNodes: [],
    clearUnlockNotifications: vi.fn() as never,
    selectNode: vi.fn() as never,
    openStoryView: vi.fn() as never,
    storyViewOpen: false,
    l3AssemblyViewOpen: false,
    corruptSaveQuarantined: false,
    lastSaveFailed: false,
    lastLoadMigrations: [],
    readQuarantinedSave: () => null,
    dismissCorruptSaveNotice: vi.fn() as never,
    dismissSaveFailureNotice: vi.fn() as never,
    dismissMigrationNotice: vi.fn() as never,
    progress: { visitedNodes: {} } as never,
    ...overrides,
  });
}

describe('NoticeTray', () => {
  beforeEach(() => {
    // Revisit hint reads localStorage; keep it "seen" unless a test opts in.
    localStorage.setItem('narramorph-revisit-hint-seen', 'true');
  });

  afterEach(() => {
    cleanup();
    downloadTextFile.mockReset();
    localStorage.clear();
  });

  it('renders nothing when there are no notices', () => {
    setStore({});
    const { container } = render(<NoticeTray />);
    expect(container.querySelector('[data-testid="notice-tray"]')).toBeNull();
  });

  it('coalesces simultaneous unlocks into one slip with perspective tags', () => {
    const nodes = new Map<string, unknown>([
      ['a', makeNode('a', 'archaeologist', 3, 'First Documentation')],
      ['b', makeNode('b', 'algorithm', 3, 'First Processing')],
      ['c', makeNode('c', 'last-human', 3, 'First Experience')],
    ]);
    setStore({ nodes: nodes, recentlyUnlockedNodes: ['a', 'b', 'c'] });
    render(<NoticeTray />);

    // One coalesced slip, not three.
    expect(screen.getByText('3 passages surfaced')).toBeTruthy();
    expect(screen.getByText('ARCH')).toBeTruthy();
    expect(screen.getByText('ALGO')).toBeTruthy();
    expect(screen.getByText('HUM')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Show on map/ })).toBeTruthy();
  });

  it('prioritises a persistent warning ahead of an info unlock and files the rest', () => {
    const nodes = new Map<string, unknown>([
      ['a', makeNode('a', 'archaeologist', 1, 'First Documentation')],
    ]);
    setStore({
      nodes: nodes,
      recentlyUnlockedNodes: ['a'],
      lastSaveFailed: true,
    });
    render(<NoticeTray />);

    // Warning is the visible slip; the unlock is filed behind the counter.
    expect(screen.getByText('SAVING PROBLEM')).toBeTruthy();
    expect(screen.getByRole('button', { name: /\+1 FILED/ })).toBeTruthy();
  });

  it('exports a save file and dismisses the save-failure slip', () => {
    const dismissSaveFailureNotice = vi.fn();
    setStore({ lastSaveFailed: true, dismissSaveFailureNotice: dismissSaveFailureNotice as never });
    render(<NoticeTray />);

    fireEvent.click(screen.getByRole('button', { name: 'Export a save file →' }));
    expect(downloadTextFile).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(dismissSaveFailureNotice).toHaveBeenCalledTimes(1);
  });

  it('expands the queue to reveal filed notices', () => {
    const nodes = new Map<string, unknown>([
      ['a', makeNode('a', 'archaeologist', 1, 'First Documentation')],
    ]);
    setStore({
      nodes: nodes,
      recentlyUnlockedNodes: ['a'],
      lastSaveFailed: true,
    });
    render(<NoticeTray />);

    // The unlock is filed (not visible) until the queue is expanded.
    expect(screen.queryByText('First Documentation')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /\+1 FILED/ }));
    const tray = screen.getByTestId('notice-tray');
    expect(within(tray).getByText('First Documentation')).toBeTruthy();
  });
});
