import { motion } from 'framer-motion';
import { ChartNoAxesColumn, HelpCircle, Settings } from 'lucide-react';
import type { ReactElement } from 'react';

import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';

export type HeaderPanel = 'guide' | 'progress' | 'settings';

interface AppHeaderProps {
  visitedCount: number;
  /** Which reader-tool panel is currently open, for the active ledger-cell rule. */
  activePanel?: HeaderPanel | null;
  onOpenProgress: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
}

// Shared ledger-cell chrome. Cells are full-height, square, hairline-separated.
// `border-t-2 border-t-transparent` reserves the 2px band; the active/open cell
// swaps it to border-t-[#a5f3fc] via `activeRule`.
const cellClasses =
  'group flex h-full items-center justify-center border-l border-[#1d2b33] border-t-2 border-t-transparent text-[#c3d2da] transition-colors duration-150 hover:bg-white/[0.04] hover:text-[#eef4f6] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#a5f3fc]';

/** The active ledger-cell top rule (2px cyan), or nothing. */
function activeRule(active: boolean): string {
  return active ? ' border-t-[#a5f3fc] text-[#eef4f6]' : '';
}

const labelClasses =
  'hidden font-sans text-[12px] font-medium uppercase tracking-[0.12em] sm:inline';

export function AppHeader({
  visitedCount,
  activePanel = null,
  onOpenProgress,
  onOpenSettings,
  onOpenHelp,
}: AppHeaderProps): ReactElement {
  const reduceMotion = useReducedMotionPreference();

  return (
    <header className="relative z-50 h-14 shrink-0 border-b border-[#2a3a42] bg-[#0b1015] shadow-[0_3px_0_-2px_#16242b] sm:h-16">
      <a
        href="#main-content"
        className="sr-only z-[60] bg-cyan-100 px-3 py-2 font-medium text-slate-950 focus:not-sr-only focus:absolute focus:left-3 focus:top-2"
      >
        Skip to story
      </a>
      <div className="mx-auto flex h-full max-w-screen-2xl items-center justify-between pl-3 sm:pl-5">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#38505b] font-serif text-[13px] font-semibold text-[#a5f3fc]"
            aria-hidden="true"
          >
            N·F
          </div>
          <div className="flex min-w-0 items-baseline gap-2 sm:gap-3">
            <p className="whitespace-nowrap font-serif text-[17px] font-semibold tracking-[0.03em] text-[#eef4f6]">
              Narramorph Fiction
            </p>
            <span className="hidden whitespace-nowrap font-mono text-[11px] font-medium tracking-[0.08em] text-[#8fa3ad] sm:inline">
              ACC. 2383-001 · SIGNAL 01
            </span>
            <span className="hidden whitespace-nowrap font-sans text-[11px] font-normal uppercase tracking-[0.16em] text-[#93a5ae] md:inline">
              The archive remembers differently each time
            </span>
          </div>
        </div>

        <motion.nav
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.2 }}
          className="flex h-full shrink-0 items-stretch"
          aria-label="Reader tools"
        >
          <button
            type="button"
            className={`${cellClasses}${activeRule(activePanel === 'guide')} w-[46px] sm:w-auto sm:px-5`}
            onClick={onOpenHelp}
            aria-current={activePanel === 'guide' ? 'true' : undefined}
            aria-label="Open the reader’s guide"
            title="Reader’s guide"
          >
            <HelpCircle className="h-4 w-4 sm:hidden" aria-hidden="true" />
            <span className={labelClasses}>Guide</span>
          </button>

          <button
            type="button"
            className={`${cellClasses}${activeRule(activePanel === 'progress')} min-w-[46px] gap-2.5 px-2.5 sm:px-5`}
            onClick={onOpenProgress}
            aria-current={activePanel === 'progress' ? 'true' : undefined}
            aria-label={`Open reading progress${visitedCount > 0 ? `, ${visitedCount} passages opened` : ''}`}
            title="Reading progress"
          >
            <span className={labelClasses}>Progress</span>
            {visitedCount > 0 ? (
              <span
                className="border border-[#38505b] bg-[#0d1318] px-1.5 py-0.5 font-mono text-[11px] font-semibold text-[#a5f3fc]"
                aria-hidden="true"
              >
                {visitedCount}
              </span>
            ) : (
              <ChartNoAxesColumn className="h-4 w-4 sm:hidden" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            className={`${cellClasses}${activeRule(activePanel === 'settings')} w-[46px] border-r border-[#1d2b33] sm:w-auto sm:px-5`}
            onClick={onOpenSettings}
            aria-current={activePanel === 'settings' ? 'true' : undefined}
            aria-label="Open reader settings"
            title="Reader settings"
          >
            <Settings className="h-4 w-4 sm:hidden" aria-hidden="true" />
            <span className={labelClasses}>Settings</span>
          </button>
        </motion.nav>
      </div>
    </header>
  );
}
