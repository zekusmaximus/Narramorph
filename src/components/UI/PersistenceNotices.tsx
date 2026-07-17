import { type ReactElement } from 'react';

import { useJourneySaveFile } from '@/hooks/useJourneySaveFile';
import { useStoryStore } from '@/stores';
import { downloadTextFile } from '@/utils/journeyDownload';

const bannerClass =
  'pointer-events-auto w-full max-w-md rounded-lg border border-white/15 bg-slate-900/95 px-4 py-3 shadow-xl shadow-black/40 backdrop-blur';
const dismissClass =
  'shrink-0 rounded px-2 py-1 text-xs font-medium text-slate-300 underline decoration-dotted underline-offset-2 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300';
const actionClass =
  'inline-flex min-h-9 items-center rounded border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium text-slate-100 transition-colors hover:border-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300';

/**
 * Honest, dismissible, non-blocking reader signals for persistence events
 * (Phase 7.4): a save that could not be read (quarantined, its raw bytes
 * retrievable), a save that failed to write (e.g. storage quota), and a save
 * that was migrated up from an earlier version. Each is a passive `status`
 * region over the map — never a blocking modal — so a reader can keep reading.
 * Everything is local; nothing is uploaded.
 */
export function PersistenceNotices(): ReactElement | null {
  const corruptSaveQuarantined = useStoryStore((state) => state.corruptSaveQuarantined);
  const lastSaveFailed = useStoryStore((state) => state.lastSaveFailed);
  const migrationCount = useStoryStore((state) => state.lastLoadMigrations.length);
  const readQuarantinedSave = useStoryStore((state) => state.readQuarantinedSave);
  const dismissCorruptSaveNotice = useStoryStore((state) => state.dismissCorruptSaveNotice);
  const dismissSaveFailureNotice = useStoryStore((state) => state.dismissSaveFailureNotice);
  const dismissMigrationNotice = useStoryStore((state) => state.dismissMigrationNotice);
  const { exportSaveFile } = useJourneySaveFile();

  if (!corruptSaveQuarantined && !lastSaveFailed && migrationCount === 0) {
    return null;
  }

  const downloadUnreadable = (): void => {
    const raw = readQuarantinedSave();
    if (raw !== null) {
      downloadTextFile('narramorph-unreadable-save.txt', 'text/plain', raw);
    }
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
      {corruptSaveQuarantined && (
        <section role="status" aria-label="Save recovery" className={bannerClass}>
          <p className="text-sm text-slate-100">
            We couldn’t read your previous save on this device, so we set it aside and started
            fresh. You can download the unreadable data to keep or inspect it.
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <button type="button" onClick={downloadUnreadable} className={actionClass}>
              Download the unreadable data
            </button>
            <button type="button" onClick={dismissCorruptSaveNotice} className={dismissClass}>
              Dismiss
            </button>
          </div>
        </section>
      )}

      {lastSaveFailed && (
        <section role="status" aria-label="Saving problem" className={bannerClass}>
          <p className="text-sm text-slate-100">
            Your progress may not be saving on this device — storage could be full. Export a save
            file to keep your journey safe.
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <button type="button" onClick={exportSaveFile} className={actionClass}>
              Export a save file
            </button>
            <button type="button" onClick={dismissSaveFailureNotice} className={dismissClass}>
              Dismiss
            </button>
          </div>
        </section>
      )}

      {migrationCount > 0 && (
        <section role="status" aria-label="Save updated" className={bannerClass}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-100">
              We updated your save from an earlier version of the story.
            </p>
            <button type="button" onClick={dismissMigrationNotice} className={dismissClass}>
              Dismiss
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
