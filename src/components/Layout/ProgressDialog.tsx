import { motion } from 'framer-motion';
import type { ReactElement } from 'react';

import { useDialogFocus } from '@/hooks/useDialogFocus';
import type { ReadingStats, UserProgress } from '@/types';

interface ProgressDialogProps {
  open: boolean;
  onClose: () => void;
  progress: UserProgress;
  stats: ReadingStats;
  visitedCount: number;
  totalNodes: number;
  progressPercent: number;
}

export function ProgressDialog({
  open,
  onClose,
  progress,
  stats,
  visitedCount,
  totalNodes,
  progressPercent,
}: ProgressDialogProps): ReactElement | null {
  const dialogRef = useDialogFocus(open, onClose);
  if (!open) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
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
        className="bg-[#0a0e12] rounded-lg shadow-2xl shadow-cyan-500/20 border border-cyan-500/30 max-w-2xl w-full p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            id="reading-progress-title"
            className="text-2xl font-bold text-cyan-400 font-mono uppercase tracking-wider"
          >
            Reading Progress
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-cyan-400 transition-colors text-xl"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                label: 'Nodes Visited',
                value: `${visitedCount}/${totalNodes}`,
                containerClass: 'bg-cyan-500/10 border-cyan-500/30',
                valueClass: 'text-cyan-400',
              },
              {
                label: 'Story Progress',
                value: `${progressPercent}%`,
                containerClass: 'bg-green-500/10 border-green-500/30',
                valueClass: 'text-green-400',
              },
              {
                label: 'Critical Path',
                value: `${stats.criticalPathNodesVisited}/${stats.criticalPathNodesTotal}`,
                containerClass: 'bg-purple-500/10 border-purple-500/30',
                valueClass: 'text-purple-400',
              },
              {
                label: 'Explored',
                value: `${stats.percentageExplored.toFixed(0)}%`,
                containerClass: 'bg-amber-500/10 border-amber-500/30',
                valueClass: 'text-amber-400',
              },
            ].map(({ label, value, containerClass, valueClass }) => (
              <div key={label} className={`${containerClass} border rounded-lg p-4`}>
                <div className="text-xs text-gray-400 mb-1 font-mono uppercase tracking-wider">
                  {label}
                </div>
                <div className={`${valueClass} text-3xl font-bold font-mono`}>{value}</div>
              </div>
            ))}
          </div>

          {progress.readingPath.length > 0 && (
            <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-4">
              <div className="text-xs font-semibold text-gray-400 mb-2 font-mono uppercase tracking-wider">
                Reading Path
              </div>
              <div className="flex flex-wrap gap-2">
                {progress.readingPath.slice(-10).map((nodeId, index) => (
                  <span
                    key={`${nodeId}-${index}`}
                    className="px-2 py-1 bg-gray-800/50 border border-gray-700/50 rounded text-xs text-cyan-400 font-mono"
                  >
                    {nodeId}
                  </span>
                ))}
              </div>
              {progress.readingPath.length > 10 && (
                <div className="text-xs text-gray-500 mt-2 font-mono">
                  Showing last 10 of {progress.readingPath.length} nodes
                </div>
              )}
            </div>
          )}

          <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-4">
            <div className="text-xs font-semibold text-gray-400 mb-3 font-mono uppercase tracking-wider">
              By Character
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
                      <span className="text-sm text-gray-300 font-mono">{label}</span>
                    </div>
                    <span className={`${valueClass} text-sm font-semibold font-mono`}>
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
