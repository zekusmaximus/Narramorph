import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useStoryStore } from '@/stores';
import type { ImportProgressResult } from '@/types';

import { JourneyControlActions } from './JourneyControlActions';

const downloadTextFile = vi.fn();
vi.mock('@/utils/journeyDownload', () => ({
  downloadTextFile: (...args: unknown[]) => downloadTextFile(...args),
  openHtmlDocument: vi.fn(),
}));

function setStore(overrides: Record<string, unknown> = {}): {
  importProgress: ReturnType<typeof vi.fn>;
  clearProgress: ReturnType<typeof vi.fn>;
} {
  const importProgress = vi.fn((): ImportProgressResult => ({ ok: true, migrations: [] }));
  const clearProgress = vi.fn();
  useStoryStore.setState({
    storyData: { metadata: { title: 'Eternal Return' } } as never,
    exportProgress: () => '{"version":"1.3.0"}',
    importProgress,
    clearProgress: clearProgress as never,
    ...overrides,
  });
  return { importProgress, clearProgress };
}

function fileInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector('input[type="file"]');
  if (!input) {
    throw new Error('file input not found');
  }
  return input as HTMLInputElement;
}

// jsdom's File does not implement Blob.text(); the component only needs { name, text() }.
function fakeFile(name: string, content: string): File {
  return { name, text: () => Promise.resolve(content) } as unknown as File;
}

describe('JourneyControlActions', () => {
  afterEach(() => {
    cleanup();
    downloadTextFile.mockReset();
  });

  it('exports the machine-readable save file as JSON on a user click', () => {
    setStore();
    render(<JourneyControlActions />);

    fireEvent.click(screen.getByRole('button', { name: 'Export save file' }));

    expect(downloadTextFile).toHaveBeenCalledTimes(1);
    const [filename, mimeType, content] = downloadTextFile.mock.calls[0]!;
    expect(filename).toMatch(/^eternal-return-journey-\d{4}-\d{2}-\d{2}\.json$/);
    expect(mimeType).toBe('application/json');
    expect(content).toBe('{"version":"1.3.0"}');
  });

  it('guards a new journey behind a confirmation and does not reset on cancel', () => {
    const { clearProgress } = setStore();
    render(<JourneyControlActions />);

    fireEvent.click(screen.getByRole('button', { name: 'Start a new journey' }));
    // Confirmation shown; nothing cleared yet.
    expect(clearProgress).not.toHaveBeenCalled();
    expect(screen.getByRole('group', { name: 'Confirm new journey' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(clearProgress).not.toHaveBeenCalled();
    expect(screen.queryByRole('group', { name: 'Confirm new journey' })).toBeNull();
  });

  it('resets only after the reader confirms the new journey', () => {
    const { clearProgress } = setStore();
    render(<JourneyControlActions />);

    fireEvent.click(screen.getByRole('button', { name: 'Start a new journey' }));
    fireEvent.click(screen.getByRole('button', { name: 'Clear and start new' }));

    expect(clearProgress).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status').textContent).toContain('Started a new journey');
  });

  it('offers an export-first escape inside the new-journey confirmation', () => {
    setStore();
    render(<JourneyControlActions />);

    fireEvent.click(screen.getByRole('button', { name: 'Start a new journey' }));
    fireEvent.click(screen.getByRole('button', { name: 'Export first' }));

    expect(downloadTextFile).toHaveBeenCalledTimes(1);
    // The confirmation stays open so the reader can still decide.
    expect(screen.getByRole('group', { name: 'Confirm new journey' })).toBeTruthy();
  });

  it('confirms before replacing the journey on import and reports success', async () => {
    const { importProgress } = setStore();
    const { container } = render(<JourneyControlActions />);

    const file = fakeFile('my-save.json', '{"version":"1.3.0"}');
    fireEvent.change(fileInput(container), { target: { files: [file] } });

    // Async file read → confirmation appears; nothing imported yet.
    await screen.findByRole('group', { name: 'Confirm import' });
    expect(importProgress).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Replace my journey' }));
    await waitFor(() => expect(importProgress).toHaveBeenCalledTimes(1));
    expect(importProgress).toHaveBeenCalledWith('{"version":"1.3.0"}');
    expect(screen.getByRole('status').textContent).toContain('Save imported');
  });

  it('notes when an imported save was migrated from an earlier version', async () => {
    const importProgress = vi.fn(
      (): ImportProgressResult => ({ ok: true, migrations: ['visit-events'] }),
    );
    setStore({ importProgress });
    const { container } = render(<JourneyControlActions />);

    const file = fakeFile('old-save.json', '{}');
    fireEvent.change(fileInput(container), { target: { files: [file] } });
    await screen.findByRole('group', { name: 'Confirm import' });
    fireEvent.click(screen.getByRole('button', { name: 'Replace my journey' }));

    await screen.findByText(/updated from an earlier version/i);
  });

  it('reports an unreadable import without replacing the journey', async () => {
    const importProgress = vi.fn((): ImportProgressResult => ({ ok: false, reason: 'invalid' }));
    setStore({ importProgress });
    const { container } = render(<JourneyControlActions />);

    const file = fakeFile('broken.json', 'garbage');
    fireEvent.change(fileInput(container), { target: { files: [file] } });
    await screen.findByRole('group', { name: 'Confirm import' });
    fireEvent.click(screen.getByRole('button', { name: 'Replace my journey' }));

    await screen.findByText(/could not be read as a Narramorph save/i);
  });
});
