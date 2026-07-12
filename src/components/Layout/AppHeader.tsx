import { motion } from 'framer-motion';
import { Archive, ChartNoAxesColumn, Settings } from 'lucide-react';
import type { ReactElement } from 'react';

interface AppHeaderProps {
  visitedCount: number;
  onOpenProgress: () => void;
  onOpenSettings: () => void;
}

export function AppHeader({
  visitedCount,
  onOpenProgress,
  onOpenSettings,
}: AppHeaderProps): ReactElement {
  return (
    <header className="relative z-50 shrink-0 border-b border-cyan-300/15 bg-[#090d11]/95 shadow-[0_8px_30px_rgba(0,0,0,0.28)] backdrop-blur-md">
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-3 px-3 py-2 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/[0.04] text-cyan-200">
            <Archive className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <motion.h1
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35 }}
              className="truncate font-serif text-base font-semibold tracking-[0.08em] text-slate-100 sm:text-lg"
            >
              Narramorph Fiction
            </motion.h1>
            <p className="hidden truncate text-[0.65rem] uppercase tracking-[0.22em] text-slate-500 md:block">
              The archive remembers differently each time
            </p>
          </div>
        </div>

        <nav className="flex shrink-0 items-center gap-2" aria-label="Reader tools">
          <motion.button
            type="button"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="relative flex h-11 w-11 items-center justify-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.04] text-cyan-200 transition-colors hover:border-cyan-200/40 hover:bg-cyan-200/10 focus-visible:outline-cyan-200 sm:w-auto sm:rounded-md sm:px-3"
            onClick={onOpenProgress}
            aria-label={`Open reading progress${visitedCount > 0 ? `, ${visitedCount} fragments visited` : ''}`}
            title="Reading progress"
          >
            <ChartNoAxesColumn className="h-4 w-4" aria-hidden="true" />
            <span className="hidden text-xs uppercase tracking-[0.16em] sm:inline">Progress</span>
            {visitedCount > 0 && (
              <span
                className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan-200 px-1 text-[0.65rem] font-bold text-slate-950 shadow-[0_0_14px_rgba(165,243,252,0.35)]"
                aria-hidden="true"
              >
                {visitedCount}
              </span>
            )}
          </motion.button>

          <motion.button
            type="button"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex h-11 w-11 items-center justify-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/60 text-slate-300 transition-colors hover:border-slate-500 hover:bg-slate-800/80 hover:text-slate-100 focus-visible:outline-cyan-200 sm:w-auto sm:rounded-md sm:px-3"
            onClick={onOpenSettings}
            aria-label="Open reader settings"
            title="Reader settings"
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
            <span className="hidden text-xs uppercase tracking-[0.16em] sm:inline">Settings</span>
          </motion.button>
        </nav>
      </div>
    </header>
  );
}
