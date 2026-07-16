import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useStoryStore } from '@/stores';

import { JourneyExportActions } from './JourneyExportActions';

const downloadTextFile = vi.fn();
const openHtmlDocument = vi.fn();
vi.mock('@/utils/journeyDownload', () => ({
  downloadTextFile: (...args: unknown[]) => downloadTextFile(...args),
  openHtmlDocument: (...args: unknown[]) => openHtmlDocument(...args),
}));

function setStore(hasJourney: boolean): void {
  useStoryStore.setState({
    storyData: { metadata: { title: 'Eternal Return' } } as never,
    progress: { visitEvents: hasJourney ? [{} as never] : [] } as never,
    exportJourneyMarkdown: () => '# journey markdown',
    exportJourneyPrintHtml: () => '<!doctype html><html></html>',
  });
}

describe('JourneyExportActions', () => {
  afterEach(() => {
    cleanup();
    downloadTextFile.mockReset();
    openHtmlDocument.mockReset();
  });

  it('downloads the Markdown journey with a sanitized filename on a user click', () => {
    setStore(true);
    render(<JourneyExportActions />);

    const button = screen.getByRole('button', {
      name: 'Export journey (Markdown)',
    });
    expect(button.getAttribute('type')).toBe('button');
    fireEvent.click(button);

    expect(downloadTextFile).toHaveBeenCalledTimes(1);
    const [filename, mimeType, content] = downloadTextFile.mock.calls[0]!;
    expect(filename).toMatch(/^eternal-return-journey-\d{4}-\d{2}-\d{2}\.md$/);
    expect(mimeType).toBe('text/markdown');
    expect(content).toBe('# journey markdown');
  });

  it('opens the print-friendly HTML view on a user click', () => {
    setStore(true);
    render(<JourneyExportActions />);

    fireEvent.click(screen.getByRole('button', { name: 'Print-friendly view' }));

    expect(openHtmlDocument).toHaveBeenCalledTimes(1);
    const [filename, html] = openHtmlDocument.mock.calls[0]!;
    expect(filename).toMatch(/\.html$/);
    expect(html).toContain('<!doctype html>');
  });

  it('disables export when there is no journey yet', () => {
    setStore(false);
    render(<JourneyExportActions />);

    const markdownButton = screen.getByRole('button', {
      name: 'Export journey (Markdown)',
    });
    expect((markdownButton as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(markdownButton);
    expect(downloadTextFile).not.toHaveBeenCalled();
  });
});
