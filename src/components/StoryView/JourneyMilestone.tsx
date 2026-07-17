import { Download, Printer } from 'lucide-react';
import type { ReactElement } from 'react';

import { useJourneyExport } from '@/hooks/useJourneyExport';
import type { Theme } from '@/types';

interface JourneyMilestoneProps {
  theme: Theme;
}

/**
 * Offered when a reader reaches an ending (Phase 7.3): a non-nagging invitation
 * to save the journey at this milestone — the same on-device export as the
 * progress dialog, surfaced where it is most meaningful. It appears only at an
 * ending and only once there is something to export; it never interrupts the
 * prose.
 */
export function JourneyMilestone({ theme }: JourneyMilestoneProps): ReactElement | null {
  const { hasJourney, exportMarkdown, openPrintView } = useJourneyExport();

  if (!hasJourney) {
    return null;
  }

  const palette =
    theme === 'light'
      ? 'border-slate-300 bg-slate-50 text-slate-700'
      : theme === 'sepia'
        ? 'border-amber-900/25 bg-amber-100/45 text-amber-950'
        : 'border-cyan-900/60 bg-cyan-950/20 text-slate-200';
  const buttonBase =
    theme === 'dark'
      ? 'border-cyan-100/30 bg-cyan-950/60 text-cyan-50 hover:border-cyan-100/60'
      : 'border-slate-400/50 bg-white/70 text-slate-800 hover:border-slate-500';

  return (
    <section
      aria-labelledby="journey-milestone-title"
      data-testid="journey-milestone"
      className={`mx-4 mb-4 rounded-lg border px-4 py-3 sm:mx-6 ${palette}`}
    >
      <h3 id="journey-milestone-title" className="font-serif text-base sm:text-lg">
        You’ve reached an ending
      </h3>
      <p className="mt-1 max-w-prose text-sm leading-relaxed opacity-90">
        Keep the journey you experienced — the passages you read, in the order you read them, saved
        on this device.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={exportMarkdown}
          className={`flex min-h-11 items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 ${buttonBase}`}
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Save your journey
        </button>
        <button
          type="button"
          onClick={openPrintView}
          className={`flex min-h-11 items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 ${buttonBase}`}
        >
          <Printer className="h-4 w-4" aria-hidden="true" />
          Print-friendly view
        </button>
      </div>
    </section>
  );
}
