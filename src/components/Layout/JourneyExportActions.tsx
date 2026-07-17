import { type ReactElement } from 'react';

import { useJourneyExport } from '@/hooks/useJourneyExport';
import { useStoryStore } from '@/stores';

/**
 * Reader-initiated journey export controls, shown inside the progress dialog beside the adaptation
 * ledger. Each action is a user gesture that builds the export on-device and delivers it locally —
 * nothing is uploaded. The exported document contains the prose the reader saw, never internal IDs.
 * The reader can choose whether to include the adaptation notes (Phase 7.3).
 */
export function JourneyExportActions(): ReactElement {
  const { hasJourney, exportMarkdown, openPrintView } = useJourneyExport();
  const includeAdaptationNotes = useStoryStore(
    (state) => state.preferences.includeAdaptationNotesInExport ?? true,
  );
  const updatePreferences = useStoryStore((state) => state.updatePreferences);

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
      <label className="mb-3 flex cursor-pointer items-start gap-2 text-sm text-gray-300">
        <input
          type="checkbox"
          checked={includeAdaptationNotes}
          onChange={(event) =>
            updatePreferences({ includeAdaptationNotesInExport: event.target.checked })
          }
          className="mt-0.5 h-4 w-4 shrink-0 accent-cyan-200"
        />
        <span>
          Include adaptation notes
          <span className="block text-xs text-gray-500">
            The short “why this version” line under each passage.
          </span>
        </span>
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={exportMarkdown}
          disabled={!hasJourney}
          className="flex min-h-11 items-center justify-center rounded border border-cyan-100/30 bg-cyan-950/60 px-4 py-2 text-sm font-medium text-cyan-50 transition-colors hover:border-cyan-100/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Export journey (Markdown)
        </button>
        <button
          type="button"
          onClick={openPrintView}
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
