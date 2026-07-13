import { type ReactElement } from 'react';

import { useDialogFocus } from '@/hooks/useDialogFocus';

interface ErrorRecoveryDialogProps {
  onReturnToMap: () => void;
}

export function ErrorRecoveryDialog({ onReturnToMap }: ErrorRecoveryDialogProps): ReactElement {
  const dialogRef = useDialogFocus(true, onReturnToMap, {
    initialFocusSelector: '#error-recovery-title',
    restoreFocus: () => document.querySelector<HTMLElement>('[data-story-map-focus-target]'),
  });

  return (
    <div
      ref={dialogRef}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="error-recovery-title"
      aria-describedby="error-recovery-description"
      tabIndex={-1}
      className="absolute inset-0 z-50 flex items-center justify-center bg-[#0a0e12]/95 p-6 text-slate-100"
    >
      <div className="max-w-md rounded-lg border border-amber-100/20 bg-[#11191e] p-6 text-center shadow-2xl">
        <h2 id="error-recovery-title" tabIndex={-1} className="mb-3 font-serif text-2xl">
          This passage could not be opened
        </h2>
        <p id="error-recovery-description" className="mb-5 text-sm leading-6 text-slate-300">
          The archive lost its place for a moment. Your reading path is safe, and the map remains
          ready.
        </p>
        <button
          type="button"
          onClick={onReturnToMap}
          className="min-h-11 rounded-md border border-cyan-100/30 bg-cyan-950/70 px-4 py-2 font-medium text-cyan-50 hover:bg-cyan-900/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-100"
        >
          Return to map
        </button>
      </div>
    </div>
  );
}
