import type { ReactElement } from 'react';

import { NodeTooltip } from './NodeTooltip';

interface NodeMapHudProps {
  totalNodes: number;
  visitedCount: number;
  availableCount: number;
  hoveredNodeId: string | null;
  tooltipPosition: { x: number; y: number };
  showTooltip: boolean;
}

export function NodeMapHud({
  totalNodes,
  visitedCount,
  availableCount,
  hoveredNodeId,
  tooltipPosition,
  showTooltip,
}: NodeMapHudProps): ReactElement {
  const progressPercent = totalNodes > 0 ? Math.round((visitedCount / totalNodes) * 100) : 0;
  const veiledCount = Math.max(0, totalNodes - availableCount);
  const openedSummary = `${visitedCount} of ${totalNodes} archive passages opened`;
  const veiledSummary =
    veiledCount > 0
      ? `${veiledCount} ${veiledCount === 1 ? 'passage remains' : 'passages remain'} veiled and outside the reading order.`
      : 'Every archive passage is now in the reading order.';

  return (
    <>
      <section aria-label="Archive map status" className="sr-only" data-testid="archive-map-status">
        <p role="status" aria-live="polite" aria-atomic="true">
          {openedSummary}. {availableCount} available. {veiledSummary}
        </p>
        <div
          role="progressbar"
          aria-label="Archive passages opened"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPercent}
        >
          {progressPercent}%
        </div>
      </section>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-4 top-4 z-10 hidden w-56 max-w-[calc(100%_-_2rem)] rounded-md border border-slate-500/20 bg-[#0b1016]/85 px-3 py-2.5 text-slate-300 shadow-lg shadow-black/20 backdrop-blur-md sm:block"
        data-testid="archive-map-status-visual"
      >
        <div className="flex items-baseline justify-between gap-4">
          <p className="font-serif text-sm tracking-wide text-slate-100">Archive map</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400">
            {visitedCount}/{totalNodes} opened
          </p>
        </div>
        <div className="mt-2 h-px overflow-hidden bg-slate-700/70">
          <div
            className="h-full bg-cyan-300/60 transition-[width] duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] leading-4 text-slate-400">
          <span className="sm:hidden">Drag to explore, then choose a fragment.</span>
          <span className="hidden sm:inline">
            Choose an illuminated fragment to enter the story.
          </span>
        </p>
        {veiledCount > 0 && (
          <p className="mt-1 text-[10px] leading-4 text-slate-500">{veiledSummary}</p>
        )}
      </div>

      {showTooltip && (
        <div className="hidden md:block">
          <NodeTooltip nodeId={hoveredNodeId} position={tooltipPosition} />
        </div>
      )}
    </>
  );
}
