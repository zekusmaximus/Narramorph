import { useCallback, useRef, useState, type ReactElement } from 'react';

import { useJourneySaveFile } from '@/hooks/useJourneySaveFile';
import { useStoryStore } from '@/stores';

type Panel = 'idle' | 'confirm-reset' | 'confirm-import';

type Result =
  | { kind: 'reset-done' }
  | { kind: 'import-ok'; migrated: boolean }
  | { kind: 'import-error' }
  | null;

const primaryButtonClass =
  'flex min-h-11 items-center justify-center rounded border border-cyan-100/30 bg-cyan-950/60 px-4 py-2 text-sm font-medium text-cyan-50 transition-colors hover:border-cyan-100/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-100';

const neutralButtonClass =
  'flex min-h-11 items-center justify-center rounded border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-gray-100 transition-colors hover:border-white/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-100';

const destructiveButtonClass =
  'flex min-h-11 items-center justify-center rounded border border-rose-400/40 bg-rose-950/30 px-4 py-2 text-sm font-medium text-rose-100 transition-colors hover:border-rose-400/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300';

// Shared framing for the two inline confirmation guards (import / new journey).
const confirmPanelClass = 'mt-3 rounded-md border border-rose-400/40 bg-rose-950/30 p-3';

/**
 * Reader-facing journey control (Phase 7.4): move a journey between devices as a
 * real save file, and start a new journey deliberately. Both destructive paths
 * (replacing on import, resetting on new journey) are guarded and offer an
 * export-first escape, so a journey is never lost to a single stray click.
 *
 * The save file is the machine-readable JSON round-trip — distinct from the
 * literary Markdown/print export beside it. Import is migration-aware. Nothing is
 * uploaded; everything happens on this device.
 */
export function JourneyControlActions(): ReactElement {
  const { exportSaveFile, importSaveFile } = useJourneySaveFile();
  const clearProgress = useStoryStore((state) => state.clearProgress);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [panel, setPanel] = useState<Panel>('idle');
  const [pendingImport, setPendingImport] = useState<{ name: string; text: string } | null>(null);
  const [result, setResult] = useState<Result>(null);

  const focusCancel = useCallback((node: HTMLButtonElement | null) => {
    // Land keyboard focus on the least destructive action when a guard appears.
    node?.focus();
  }, []);

  const closePanel = useCallback(() => {
    setPanel('idle');
    setPendingImport(null);
  }, []);

  const handleFileChosen = useCallback(async (file: File | undefined): Promise<void> => {
    if (!file) {
      return;
    }
    setResult(null);
    const text = await file.text();
    setPendingImport({ name: file.name, text });
    setPanel('confirm-import');
  }, []);

  const confirmImport = useCallback(() => {
    if (!pendingImport) {
      return;
    }
    const outcome = importSaveFile(pendingImport.text);
    if (outcome.ok) {
      setResult({ kind: 'import-ok', migrated: outcome.migrations.length > 0 });
    } else {
      setResult({ kind: 'import-error' });
    }
    closePanel();
  }, [closePanel, importSaveFile, pendingImport]);

  const confirmReset = useCallback(() => {
    clearProgress();
    setResult({ kind: 'reset-done' });
    closePanel();
  }, [clearProgress, closePanel]);

  return (
    <section
      aria-labelledby="journey-control-title"
      className="rounded-lg border border-gray-700/50 bg-gray-900/50 p-4"
    >
      <h3
        id="journey-control-title"
        className="mb-1 text-[0.65rem] uppercase tracking-[0.18em] text-gray-400"
      >
        Manage your journey
      </h3>
      <p className="mb-3 text-sm text-gray-400">
        Move your journey to another device as a save file, or start a new one. Everything stays on
        this device — nothing is uploaded.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(event) => {
          void handleFileChosen(event.target.files?.[0]);
          // Allow re-importing the same file name again later.
          event.target.value = '';
        }}
      />

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={exportSaveFile} className={primaryButtonClass}>
          Export save file
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={neutralButtonClass}
        >
          Import save file
        </button>
        <button
          type="button"
          onClick={() => {
            setResult(null);
            setPanel('confirm-reset');
          }}
          className={neutralButtonClass}
        >
          Start a new journey
        </button>
      </div>

      {panel === 'confirm-import' && pendingImport && (
        <div role="group" aria-label="Confirm import" className={confirmPanelClass}>
          <p className="text-sm text-rose-100">
            Import <span className="font-medium">“{pendingImport.name}”</span>? This replaces your
            current journey on this device. You can export the current one first.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={exportSaveFile} className={neutralButtonClass}>
              Export current first
            </button>
            <button type="button" onClick={confirmImport} className={destructiveButtonClass}>
              Replace my journey
            </button>
            <button
              ref={focusCancel}
              type="button"
              onClick={closePanel}
              className={neutralButtonClass}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {panel === 'confirm-reset' && (
        <div role="group" aria-label="Confirm new journey" className={confirmPanelClass}>
          <p className="text-sm text-rose-100">
            Start a new journey? This clears your reading progress on this device (your reading
            settings are kept) and cannot be undone. You can export a save first.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={exportSaveFile} className={neutralButtonClass}>
              Export first
            </button>
            <button type="button" onClick={confirmReset} className={destructiveButtonClass}>
              Clear and start new
            </button>
            <button
              ref={focusCancel}
              type="button"
              onClick={closePanel}
              className={neutralButtonClass}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {result && (
        <p role="status" className="mt-3 text-sm text-gray-300">
          {result.kind === 'reset-done' && 'Started a new journey.'}
          {result.kind === 'import-ok' &&
            (result.migrated
              ? 'Save imported and updated from an earlier version.'
              : 'Save imported.')}
          {result.kind === 'import-error' &&
            'That file could not be read as a Narramorph save. Your current journey is unchanged.'}
        </p>
      )}
    </section>
  );
}
