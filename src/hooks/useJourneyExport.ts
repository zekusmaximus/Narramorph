import { journeyExportFilename } from '@/domain/export/journeyExport';
import { useStoryStore } from '@/stores';
import { downloadTextFile, openHtmlDocument } from '@/utils/journeyDownload';

export interface JourneyExport {
  /** True once the reader has at least one exportable passage. */
  hasJourney: boolean;
  /** Build and download the literary Markdown export on this device. */
  exportMarkdown: () => void;
  /** Open the print-friendly HTML view for the journey. */
  openPrintView: () => void;
}

/**
 * Shared journey-export actions (Phase 7.3). Each action builds the export
 * on-device from the immutable visit-event log and delivers it locally — nothing
 * is uploaded. Whether adaptation notes are included is read from the reader's
 * preference inside the store, so every export entry point (progress dialog,
 * ending milestone) honours the same setting.
 */
export function useJourneyExport(): JourneyExport {
  const exportJourneyMarkdown = useStoryStore((state) => state.exportJourneyMarkdown);
  const exportJourneyPrintHtml = useStoryStore((state) => state.exportJourneyPrintHtml);
  const storyTitle = useStoryStore((state) => state.storyData?.metadata?.title ?? 'Narramorph');
  const hasJourney = useStoryStore((state) => state.progress.visitEvents.length > 0);

  const exportMarkdown = (): void => {
    const exportedAt = new Date().toISOString();
    downloadTextFile(
      journeyExportFilename(storyTitle, exportedAt, 'md'),
      'text/markdown',
      exportJourneyMarkdown(exportedAt),
    );
  };

  const openPrintView = (): void => {
    const exportedAt = new Date().toISOString();
    openHtmlDocument(
      journeyExportFilename(storyTitle, exportedAt, 'html'),
      exportJourneyPrintHtml(exportedAt),
    );
  };

  return { hasJourney, exportMarkdown, openPrintView };
}
