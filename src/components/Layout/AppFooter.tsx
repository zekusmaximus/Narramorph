import type { ReactElement } from 'react';

interface AppFooterProps {
  visitedCount: number;
  totalNodes: number;
  progressPercent: number;
}

export function AppFooter({
  visitedCount,
  totalNodes,
  progressPercent,
}: AppFooterProps): ReactElement {
  return (
    <footer className="shrink-0 border-t border-cyan-300/10 bg-[#090d11] text-[0.68rem] text-slate-500">
      <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-3 py-2 sm:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-200/70 shadow-[0_0_8px_rgba(165,243,252,0.45)]" />
          <span className="truncate font-serif tracking-[0.08em] text-slate-400">
            Narramorph Fiction
          </span>
          <span className="hidden uppercase tracking-[0.18em] text-slate-600 sm:inline">
            Archive active
          </span>
        </div>

        <div
          className="flex shrink-0 items-center gap-2 uppercase tracking-[0.12em]"
          aria-label={`${visitedCount} of ${totalNodes} fragments visited, ${progressPercent} percent complete`}
        >
          <span>
            <span className="text-cyan-200">{visitedCount}</span>/{totalNodes} fragments
          </span>
          <span className="text-slate-700" aria-hidden="true">
            ·
          </span>
          <span className="text-emerald-300/80">{progressPercent}% traced</span>
        </div>
      </div>
    </footer>
  );
}
