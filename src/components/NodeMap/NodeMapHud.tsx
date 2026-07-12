import type { ReactElement } from 'react';

import { NodeTooltip } from './NodeTooltip';

interface NodeMapHudProps {
  totalNodes: number;
  visitedCount: number;
  hoveredNodeId: string | null;
  tooltipPosition: { x: number; y: number };
  showTooltip: boolean;
}

export function NodeMapHud({
  totalNodes,
  visitedCount,
  hoveredNodeId,
  tooltipPosition,
  showTooltip,
}: NodeMapHudProps): ReactElement {
  const progressPercent = totalNodes > 0 ? Math.round((visitedCount / totalNodes) * 100) : 0;

  return (
    <>
      <section
        aria-label="Archive map status"
        className="pointer-events-none absolute left-3 top-3 z-10 w-56 max-w-[calc(100%_-_1.5rem)] rounded-md border border-slate-500/20 bg-[#0b1016]/85 px-3 py-2.5 text-slate-300 shadow-lg shadow-black/20 backdrop-blur-md sm:left-4 sm:top-4"
      >
        <div className="flex items-baseline justify-between gap-4">
          <p className="font-serif text-sm tracking-wide text-slate-100">Archive map</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400">
            {visitedCount}/{totalNodes} opened
          </p>
        </div>
        <div
          className="mt-2 h-px overflow-hidden bg-slate-700/70"
          role="progressbar"
          aria-label="Archive fragments opened"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPercent}
        >
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
      </section>

      {showTooltip && (
        <div className="hidden md:block">
          <NodeTooltip nodeId={hoveredNodeId} position={tooltipPosition} />
        </div>
      )}
    </>
  );
}
