import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState, type ReactElement } from 'react';

import { PassageListNav } from '@/components/map/PassageListNav';
import { getCharacterLabel, getStateLabel } from '@/components/StoryView/storyPresentation';
import { useStoryStore } from '@/stores/storyStore';
import { PERSPECTIVE_INK } from '@/styles/designTokens';
import type { CharacterType } from '@/types';

const PERSPECTIVE_CODE: Record<CharacterType, string> = {
  archaeologist: 'ARCH',
  algorithm: 'ALGO',
  'last-human': 'HUMAN',
  'multi-perspective': 'CONV',
};

const LAYER_LABEL: Record<number, string> = {
  1: 'OPENING PASSAGE',
  2: 'BRANCHING PASSAGE',
  3: 'CONVERGENCE',
  4: 'FINAL PASSAGE',
};

interface NodeMapHudProps {
  totalNodes: number;
  visitedCount: number;
  availableCount: number;
  /** Node currently hovered or focused; drives the inspector state. */
  inspectNodeId: string | null;
  reduceMotion: boolean;
  /** Optional 3D-view toggle supplied by the host page. */
  onToggle3D?: () => void;
}

function InspectorBody({ nodeId }: { nodeId: string }): ReactElement | null {
  const nodes = useStoryStore((state) => state.nodes);
  const getNodeState = useStoryStore((state) => state.getNodeState);

  const node = nodes.get(nodeId);
  if (!node) {
    return null;
  }
  const state = getNodeState(nodeId);
  const ink = PERSPECTIVE_INK[node.character];
  const classification = `${PERSPECTIVE_CODE[node.character]}-L${node.layer} · ${
    LAYER_LABEL[node.layer] ?? 'PASSAGE'
  }`;

  const rows: Array<[string, string]> = [
    ['Perspective', getCharacterLabel(node.character)],
    ['State', getStateLabel(state.currentState)],
    ['Visits', String(state.visitCount)],
    ['Reading time', `${node.metadata.estimatedReadTime}m`],
  ];

  return (
    <div>
      <div className="px-3.5 pt-2.5">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[#8fa3ad]">
          {classification}
        </p>
        <h2
          className="mt-1 font-serif text-[15px] font-semibold leading-tight"
          style={{ color: ink }}
        >
          {node.title}
        </h2>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3.5 gap-y-1 px-3.5 py-2.5">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-[12px] text-[#93a5ae]">{label}</dt>
            <dd className="text-right text-[12px] text-[#eef4f6]">{value}</dd>
          </div>
        ))}
      </dl>
      {node.metadata.criticalPath && (
        <div className="border-t border-[#1d2b33] px-3.5 py-2">
          <p className="font-mono text-[11px] font-medium text-[#e8d9b8]">[×] ESSENTIAL THREAD</p>
        </div>
      )}
    </div>
  );
}

function RestBody({
  visitedCount,
  totalNodes,
  progressPercent,
  lockedCount,
  integrityPercent,
}: {
  visitedCount: number;
  totalNodes: number;
  progressPercent: number;
  lockedCount: number;
  integrityPercent: number;
}): ReactElement {
  return (
    <div>
      <div className="h-0.5 bg-[#1d2b33]">
        <div className="h-full bg-[#a5f3fc]" style={{ width: `${progressPercent}%` }} />
      </div>
      <p className="px-3.5 pt-2 pb-3 text-[12px] font-normal leading-4 text-[#93a5ae]">
        {lockedCount > 0
          ? `Choose an available passage to start reading. ${lockedCount} ${
              lockedCount === 1 ? 'passage is' : 'passages are'
            } still locked.`
          : 'Choose an available passage to start reading.'}
      </p>
      <div className="border-t border-[#1d2b33] px-3.5 py-2">
        <p className="font-mono text-[11px] font-medium tracking-[0.1em] text-[#8fa3ad]">
          SYS INTEGRITY {integrityPercent}%
        </p>
      </div>
      <p className="sr-only">
        {visitedCount} of {totalNodes} passages opened.
      </p>
    </div>
  );
}

export function NodeMapHud({
  totalNodes,
  visitedCount,
  availableCount,
  inspectNodeId,
  reduceMotion,
  onToggle3D,
}: NodeMapHudProps): ReactElement {
  const progressPercent = totalNodes > 0 ? Math.round((visitedCount / totalNodes) * 100) : 0;
  const lockedCount = Math.max(0, totalNodes - availableCount);
  const stats = useStoryStore((state) => state.getReadingStats());
  const integrityPercent = useMemo(
    () => Math.max(0, 100 - Math.min(Math.round((stats.transformationsAvailable / 20) * 100), 100)),
    [stats.transformationsAvailable],
  );

  // Debounce reverting to the rest state so a column sweep of hovers does not flicker.
  const [activeNodeId, setActiveNodeId] = useState<string | null>(inspectNodeId);
  useEffect(() => {
    if (inspectNodeId) {
      setActiveNodeId(inspectNodeId);
      return undefined;
    }
    if (reduceMotion) {
      setActiveNodeId(null);
      return undefined;
    }
    const timer = window.setTimeout(() => setActiveNodeId(null), 300);
    return () => window.clearTimeout(timer);
  }, [inspectNodeId, reduceMotion]);

  const [indexOpen, setIndexOpen] = useState(false);

  const handleToggle3D = (): void => {
    if (onToggle3D) {
      onToggle3D();
      return;
    }
    // Best-effort hook when the host page has not wired a handler: flip the stored
    // preference and broadcast, so a listening shell can react.
    if (typeof window !== 'undefined') {
      const next = localStorage.getItem('narramorph-3d-mode') !== 'true';
      localStorage.setItem('narramorph-3d-mode', String(next));
      window.dispatchEvent(new CustomEvent('narramorph:toggle-3d', { detail: { enabled: next } }));
    }
  };

  const crossfade = reduceMotion
    ? {
        initial: false as const,
        animate: { opacity: 1 },
        exit: { opacity: 1 },
        transition: { duration: 0 },
      }
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.15, ease: 'easeOut' as const },
      };

  return (
    <>
      <section aria-label="Map reading status" className="sr-only" data-testid="archive-map-status">
        <div
          role="progressbar"
          aria-label="Passages opened"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPercent}
        >
          {progressPercent}%
        </div>
      </section>

      <div
        role="status"
        aria-live="polite"
        className="absolute left-4 top-4 z-30 hidden w-60 max-w-[calc(100%_-_2rem)] rounded-none border border-[#2b3b44] bg-[#0d1318] text-[#eef4f6] sm:block"
        data-testid="archive-map-status-visual"
      >
        <div className="flex items-baseline justify-between gap-4 border-b border-[#2a3a42] px-3.5 py-2.5 shadow-[0_3px_0_-2px_#16242b]">
          <p className="font-serif text-[13px] font-semibold text-[#eef4f6]">Story map</p>
          <p className="font-mono text-[11px] font-medium text-[#8fa3ad]">
            {visitedCount}∕{totalNodes} OPENED
          </p>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={activeNodeId ?? 'rest'} {...crossfade}>
            {activeNodeId ? (
              <InspectorBody nodeId={activeNodeId} />
            ) : (
              <RestBody
                visitedCount={visitedCount}
                totalNodes={totalNodes}
                progressPercent={progressPercent}
                lockedCount={lockedCount}
                integrityPercent={integrityPercent}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {!activeNodeId && (
          <>
            <div className="grid grid-cols-2 border-t border-[#1d2b33]">
              <button
                type="button"
                onClick={() => setIndexOpen((open) => !open)}
                aria-pressed={indexOpen}
                className="border-r border-[#1d2b33] px-3.5 py-1.5 text-left font-mono text-[11px] font-medium tracking-[0.1em] text-[#8fa3ad] transition-colors hover:bg-white/5 hover:text-[#eef4f6]"
              >
                INDEX
              </button>
              <button
                type="button"
                onClick={handleToggle3D}
                className="px-3.5 py-1.5 text-left font-mono text-[11px] font-medium tracking-[0.1em] text-[#8fa3ad] transition-colors hover:bg-white/5 hover:text-[#eef4f6]"
              >
                3D VIEW
              </button>
            </div>
            {indexOpen && (
              <div className="max-h-[40vh] overflow-y-auto border-t border-[#1d2b33] px-3.5 pb-3 pt-1">
                <PassageListNav
                  mode="2d"
                  description="Select a passage to open it. This list mirrors the story map."
                />
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
