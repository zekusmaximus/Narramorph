import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useStoryStore } from '@/stores';

import { JourneyMilestone } from './JourneyMilestone';

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

describe('JourneyMilestone', () => {
  afterEach(() => {
    cleanup();
    downloadTextFile.mockReset();
    openHtmlDocument.mockReset();
  });

  it('invites the reader to save the journey at an ending and exports on click', () => {
    setStore(true);
    render(<JourneyMilestone theme="dark" />);

    expect(screen.getByTestId('journey-milestone').textContent).toContain('reached an ending');
    fireEvent.click(screen.getByRole('button', { name: /save your journey/i }));
    expect(downloadTextFile).toHaveBeenCalledTimes(1);
    expect(downloadTextFile.mock.calls[0]![2]).toBe('# journey markdown');
  });

  it('renders nothing when there is no journey yet', () => {
    setStore(false);
    render(<JourneyMilestone theme="dark" />);
    expect(screen.queryByTestId('journey-milestone')).toBeNull();
  });
});
