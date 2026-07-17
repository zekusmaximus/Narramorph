import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useStoryStore } from '@/stores';

import { PersistenceNotices } from './PersistenceNotices';

const downloadTextFile = vi.fn();
vi.mock('@/utils/journeyDownload', () => ({
  downloadTextFile: (...args: unknown[]) => downloadTextFile(...args),
  openHtmlDocument: vi.fn(),
}));

function setStore(overrides: Record<string, unknown>): void {
  useStoryStore.setState({
    storyData: { metadata: { title: 'Eternal Return' } } as never,
    exportProgress: () => '{"version":"1.3.0"}',
    corruptSaveQuarantined: false,
    lastSaveFailed: false,
    lastLoadMigrations: [],
    readQuarantinedSave: () => null,
    dismissCorruptSaveNotice: vi.fn() as never,
    dismissSaveFailureNotice: vi.fn() as never,
    dismissMigrationNotice: vi.fn() as never,
    ...overrides,
  });
}

describe('PersistenceNotices', () => {
  afterEach(() => {
    cleanup();
    downloadTextFile.mockReset();
  });

  it('renders nothing when there is no persistence event', () => {
    setStore({});
    const { container } = render(<PersistenceNotices />);
    expect(container.firstChild).toBeNull();
  });

  it('offers to download the unreadable data and dismiss the corrupt-save notice', () => {
    const dismissCorruptSaveNotice = vi.fn();
    setStore({
      corruptSaveQuarantined: true,
      readQuarantinedSave: () => 'RAW-CORRUPT-BYTES',
      dismissCorruptSaveNotice: dismissCorruptSaveNotice as never,
    });
    render(<PersistenceNotices />);

    fireEvent.click(screen.getByRole('button', { name: 'Download the unreadable data' }));
    expect(downloadTextFile).toHaveBeenCalledWith(
      'narramorph-unreadable-save.txt',
      'text/plain',
      'RAW-CORRUPT-BYTES',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(dismissCorruptSaveNotice).toHaveBeenCalledTimes(1);
  });

  it('surfaces a failed save with an export escape and a dismiss', () => {
    const dismissSaveFailureNotice = vi.fn();
    setStore({
      lastSaveFailed: true,
      dismissSaveFailureNotice: dismissSaveFailureNotice as never,
    });
    render(<PersistenceNotices />);

    expect(screen.getByRole('status', { name: 'Saving problem' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Export a save file' }));
    expect(downloadTextFile).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(dismissSaveFailureNotice).toHaveBeenCalledTimes(1);
  });

  it('surfaces a migrated save and dismisses it', () => {
    const dismissMigrationNotice = vi.fn();
    setStore({
      lastLoadMigrations: ['visit-events'],
      dismissMigrationNotice: dismissMigrationNotice as never,
    });
    render(<PersistenceNotices />);

    expect(screen.getByText(/updated your save from an earlier version/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(dismissMigrationNotice).toHaveBeenCalledTimes(1);
  });
});
