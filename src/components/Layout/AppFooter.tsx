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
    <footer className="relative h-10 shrink-0 border-t border-[#2a3a42] bg-[#0b1015]">
      <div
        className="absolute left-0 top-0 h-0.5 bg-[#a5f3fc]/85 transition-[width] duration-[600ms]"
        style={{ width: `${progressPercent}%` }}
        aria-hidden="true"
      />
      <div className="mx-auto flex h-full max-w-screen-2xl items-center justify-between gap-x-4 px-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="hidden whitespace-nowrap font-serif text-[12px] font-semibold tracking-[0.08em] text-[#b7c6ce] sm:inline">
            Narramorph Fiction
          </span>
          <a
            href="https://github.com/zekusmaximus/Narramorph/blob/main/docs/ACCESSIBILITY.md"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 whitespace-nowrap font-sans text-[11px] font-normal uppercase tracking-[0.12em] text-[#93a5ae] underline decoration-dotted underline-offset-[3px] transition-colors hover:text-[#a5f3fc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a5f3fc]"
          >
            Accessibility
          </a>
          <a
            href="https://github.com/zekusmaximus/Narramorph/blob/main/docs/PRIVACY.md"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden shrink-0 whitespace-nowrap font-sans text-[11px] font-normal uppercase tracking-[0.12em] text-[#93a5ae] underline decoration-dotted underline-offset-[3px] transition-colors hover:text-[#a5f3fc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a5f3fc] sm:inline"
          >
            Privacy
          </a>
        </div>

        <div
          className="shrink-0 font-mono text-[11px] font-medium tracking-[0.08em] text-[#8fa3ad]"
          aria-label={`${visitedCount} of ${totalNodes} passages opened, ${progressPercent} percent opened`}
        >
          <span className="hidden sm:inline">{progressPercent}% OPENED</span>
          <span className="sm:hidden">
            {visitedCount}∕{totalNodes} · {progressPercent}%
          </span>
        </div>
      </div>
    </footer>
  );
}
