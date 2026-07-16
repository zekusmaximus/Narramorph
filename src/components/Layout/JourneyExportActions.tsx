import { type ReactElement } from 'react';

import { journeyExportFilename } from '@/domain/export/journeyExport';
import { useStoryStore } from '@/stores';
import { downloadTextFile, openHtmlDocument } from '@/utils/journeyDownload';

/**
 * Reader-initiated journey export controls, shown inside the progress dialog beside the adaptation
 * ledger. Each action is a user gesture that builds the export on-device and delivers it locally —
 * nothing is uploaded. The exported document contains the prose the reader saw, never internal IDs.
 */
export function JourneyExportActions(): ReactElement {
  const exportJourneyMarkdown = useStoryStore((state) => state.exportJourneyMarkdown);
  const exportJourneyPrintHtml = useStoryStore((state) => state.exportJourneyPrintHtml);
  const storyTitle = useStoryStore((state) => state.storyData?.metadata?.title ?? 'Narramorph');
  const hasJourney = useStoryStore((state) => state.progress.visitEvents.length > 0);

  const handleMarkdown = (): void => {
    const exportedAt = new Date().toISOString();
    downloadTextFile(
      journeyExportFilename(storyTitle, exportedAt, 'md'),
      'text/markdown',
      exportJourneyMarkdown(exportedAt),
    );
  };

  const handlePrintHtml = (): void => {
    const exportedAt = new Date().toISOString();
    openHtmlDocument(
      journeyExportFilename(storyTitle, exportedAt, 'html'),
      exportJourneyPrintHtml(exportedAt),
    );
  };

  return (
    <section
      aria-labelledby="journey-export-title"
      className="rounded-lg border border-gray-700/50 bg-gray-900/50 p-4"
    >
      <h3
        id="journey-export-title"
        className="mb-1 text-[0.65rem] uppercase tracking-[0.18em] text-gray-400"
      >
        Export your journey
      </h3>
      <p className="mb-3 text-sm text-gray-400">
        Save the passages you read, in order, as a document on this device. Your reading history
        stays local and is never uploaded.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleMarkdown}
          disabled={!hasJourney}
          className="flex min-h-11 items-center justify-center rounded border border-cyan-100/30 bg-cyan-950/60 px-4 py-2 text-sm font-medium text-cyan-50 transition-colors hover:border-cyan-100/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Export journey (Markdown)
        </button>
        <button
          type="button"
          onClick={handlePrintHtml}
          disabled={!hasJourney}
          className="flex min-h-11 items-center justify-center rounded border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-gray-100 transition-colors hover:border-white/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Print-friendly view
        </button>
      </div>
      {!hasJourney && (
        <p className="mt-2 text-xs text-gray-500">
          Read a passage to begin building an exportable journey.
        </p>
      )}
    </section>
  );
}
