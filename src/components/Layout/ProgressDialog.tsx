import { motion } from 'framer-motion';
import type { ReactElement } from 'react';

import { useDialogFocus } from '@/hooks/useDialogFocus';
import type { ReadingStats, StoryNode, UserProgress } from '@/types';

import { buildNarrativePath } from './progressPresentation';

interface ProgressDialogProps {
  open: boolean;
  onClose: () => void;
  progress: UserProgress;
  stats: ReadingStats;
  visitedCount: number;
  totalNodes: number;
  progressPercent: number;
  nodes: ReadonlyMap<string, StoryNode>;
}

export function ProgressDialog({
  open,
  onClose,
  progress,
  stats,
  visitedCount,
  totalNodes,
  progressPercent,
  nodes,
}: ProgressDialogProps): ReactElement | null {
  const dialogRef = useDialogFocus(open, onClose);
  if (!open) {
    return null;
  }
  const narrativePath = buildNarrativePath(progress.readingPath, nodes);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-0 backdrop-blur-sm sm:p-4"
      onClick={onClose}
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reading-progress-title"
        tabIndex={-1}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="max-h-[100dvh] w-full max-w-2xl overflow-y-auto rounded-none border border-cyan-900/50 bg-[#090e13] p-5 shadow-2xl shadow-cyan-950/40 sm:max-h-[90vh] sm:rounded-lg sm:p-7"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 id="reading-progress-title" className="font-serif text-2xl text-cyan-100 sm:text-3xl">
            Your path through the archive
          </h2>
          <button
            onClick={onClose}
            type="button"
            className="rounded-full border border-white/10 px-2.5 py-1.5 text-xl text-gray-400 transition-colors hover:bg-white/5 hover:text-cyan-300"
            aria-label="Close reading progress"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            {[
              {
                label: 'Fragments encountered',
                value: `${visitedCount}/${totalNodes}`,
                containerClass: 'bg-cyan-500/10 border-cyan-500/30',
                valueClass: 'text-cyan-400',
              },
              {
                label: 'Archive charted',
                value: `${progressPercent}%`,
                containerClass: 'bg-green-500/10 border-green-500/30',
                valueClass: 'text-green-400',
              },
              {
                label: 'Essential thread',
                value: `${stats.criticalPathNodesVisited}/${stats.criticalPathNodesTotal}`,
                containerClass: 'bg-purple-500/10 border-purple-500/30',
                valueClass: 'text-purple-400',
              },
              {
                label: 'World explored',
                value: `${stats.percentageExplored.toFixed(0)}%`,
                containerClass: 'bg-amber-500/10 border-amber-500/30',
                valueClass: 'text-amber-400',
              },
            ].map(({ label, value, containerClass, valueClass }) => (
              <div key={label} className={`${containerClass} rounded-lg border p-3 sm:p-4`}>
                <div className="mb-1 text-[0.6rem] uppercase tracking-[0.16em] text-gray-400 sm:text-xs">
                  {label}
                </div>
                <div className={`${valueClass} text-2xl font-light tabular-nums sm:text-3xl`}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          {narrativePath.length > 0 && (
            <section className="rounded-lg border border-gray-700/50 bg-gray-900/50 p-4">
              <h3 className="mb-3 text-[0.65rem] uppercase tracking-[0.18em] text-gray-400">
                The path you left behind
              </h3>
              <ol className="space-y-2">
                {narrativePath.map((entry, index) => (
                  <li
                    key={`${progress.readingPath.length - narrativePath.length + index}`}
                    className="border-l border-cyan-900/80 py-1 pl-3"
                  >
                    <p className="font-serif text-sm text-slate-200 sm:text-base">
                      <span className="text-slate-400">{entry.action}</span>{' '}
                      <cite className="not-italic text-cyan-200">“{entry.title}”</cite>
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {entry.characterLabel}
                      {entry.occurrence > 1 && ` · encounter ${entry.occurrence}`}
                    </p>
                  </li>
                ))}
              </ol>
              {progress.readingPath.length > 10 && (
                <p className="mt-3 text-xs text-gray-500">
                  Showing the latest 10 of {progress.readingPath.length} encounters
                </p>
              )}
            </section>
          )}

          <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-4">
            <div className="mb-3 text-[0.65rem] uppercase tracking-[0.18em] text-gray-400">
              By perspective
            </div>
            <div className="space-y-2">
              {[
                {
                  label: 'Archaeologist',
                  counts: stats.characterBreakdown.archaeologist,
                  dotClass: 'bg-cyan-400',
                  valueClass: 'text-cyan-400',
                },
                {
                  label: 'Algorithm',
                  counts: stats.characterBreakdown.algorithm,
                  dotClass: 'bg-green-400',
                  valueClass: 'text-green-400',
                },
                {
                  label: 'Human',
                  counts: stats.characterBreakdown.lastHuman,
                  dotClass: 'bg-red-400',
                  valueClass: 'text-red-400',
                },
              ].map(({ label, counts, dotClass, valueClass }) => {
                return (
                  <div key={label} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`${dotClass} w-3 h-3 rounded-full`} />
                      <span className="text-sm text-gray-300">{label}</span>
                    </div>
                    <span className={`${valueClass} text-sm tabular-nums`}>
                      {counts.visited}/{counts.total}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
