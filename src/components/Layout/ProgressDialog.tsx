import type { ReactElement } from 'react';

import type { CharacterType, ReadingStats, StoryNode, UserProgress } from '@/types';

import { AdaptationLedger } from './AdaptationLedger';
import { JourneyControlActions } from './JourneyControlActions';
import { JourneyExportActions } from './JourneyExportActions';
import { buildNarrativePath, buildProgressSummary } from './progressPresentation';
import { RecordSheetDialog } from './RecordSheetDialog';

interface ProgressDialogProps {
  open: boolean;
  onClose: () => void;
  progress: UserProgress;
  stats: ReadingStats;
  nodes: ReadonlyMap<string, StoryNode>;
  reduceMotion: boolean;
}

/** Perspective ink (readable text) and short tag code, keyed by character. */
const PERSPECTIVE: Record<CharacterType, { ink: string; fill: string; code: string }> = {
  archaeologist: { ink: '#7db2ec', fill: '#4a90e2', code: 'ARCH' },
  algorithm: { ink: '#50C878', fill: '#50c878', code: 'ALGO' },
  'last-human': { ink: '#E74C3C', fill: '#e74c3c', code: 'HUMAN' },
  'multi-perspective': { ink: '#b07cc9', fill: '#9b59b6', code: 'CONV' },
};

const NEUTRAL_INK = '#b7c6ce';

export function ProgressDialog({
  open,
  onClose,
  progress,
  stats,
  nodes,
  reduceMotion,
}: ProgressDialogProps): ReactElement | null {
  if (!open) {
    return null;
  }
  const narrativePath = buildNarrativePath(progress.readingPath, nodes);
  const summary = buildProgressSummary(progress, nodes);

  const ledger: ReadonlyArray<{
    label: string;
    value: number;
    denominator?: number;
    testId?: string;
  }> = [
    {
      label: 'PASSAGES',
      value: summary.passagesOpened,
      denominator: summary.totalPassages,
      testId: 'progress-passages-opened',
    },
    { label: 'PATHS', value: summary.pathsExplored },
    { label: 'ENDINGS', value: summary.endingsReached, denominator: summary.totalEndings },
    { label: 'ADAPTATIONS', value: summary.adaptationsDiscovered },
  ];

  const perspectiveRows = [
    {
      label: 'The Archaeologist',
      character: 'archaeologist' as const,
      counts: stats.characterBreakdown.archaeologist,
    },
    {
      label: 'The Algorithm',
      character: 'algorithm' as const,
      counts: stats.characterBreakdown.algorithm,
    },
    {
      label: 'The Last Human',
      character: 'last-human' as const,
      counts: stats.characterBreakdown.lastHuman,
    },
  ];

  return (
    <RecordSheetDialog
      open={open}
      onClose={onClose}
      reduceMotion={reduceMotion}
      classification="READER RECORD · FORM P-1"
      title="Your path through the archive"
      titleId="reading-progress-title"
      closeLabel="Close reading progress"
      maxWidth={560}
    >
      <div className="space-y-5">
        {/* One ruled ledger row — neutral ink, no colored tiles. */}
        <div className="grid grid-cols-2 border border-[#2b3b44] sm:grid-cols-4">
          {ledger.map(({ label, value, denominator, testId }) => (
            <div
              key={label}
              className="border-r border-b border-[#1d2b33] px-3 py-3 sm:border-b-0 sm:last:border-r-0"
            >
              <div className="font-mono text-[10px] font-medium tracking-[0.12em] text-[#93a5ae]">
                {label}
              </div>
              <div
                data-testid={testId}
                className="mt-1 font-mono text-[22px] font-semibold text-[#eef4f6] tabular-nums"
              >
                {value}
                {typeof denominator === 'number' && (
                  <span className="text-[14px] text-[#8fa3ad]">/{denominator}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {narrativePath.length > 0 && (
          <section className="border border-[#1d2b33]">
            <h3 className="border-b border-[#1d2b33] px-4 py-2.5 font-mono text-[11px] tracking-[0.14em] text-[#8fa3ad] uppercase">
              The path you left behind
            </h3>
            <ol>
              {narrativePath.map((entry, index) => {
                const perspective = entry.character ? PERSPECTIVE[entry.character] : null;
                const tag = perspective
                  ? `${perspective.code}${entry.occurrence > 1 ? ` · ×${entry.occurrence}` : ''}`
                  : '';
                return (
                  <li
                    key={`${progress.readingPath.length - narrativePath.length + index}`}
                    className="flex items-baseline justify-between gap-3 border-b border-[#1d2b33] px-4 py-2 last:border-b-0"
                  >
                    <p className="min-w-0 text-[13px] text-[#b7c6ce]">
                      <span className="text-[#93a5ae]">{entry.action}</span>{' '}
                      <cite
                        className="font-serif font-semibold not-italic"
                        style={{ color: perspective ? perspective.ink : NEUTRAL_INK }}
                      >
                        {entry.title}
                      </cite>
                    </p>
                    {tag && (
                      <span className="shrink-0 font-mono text-[11px] whitespace-nowrap text-[#93a5ae]">
                        {tag}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
            {progress.readingPath.length > 10 && (
              <p className="border-t border-[#1d2b33] px-4 py-2 font-mono text-[10px] tracking-[0.12em] text-[#93a5ae] uppercase">
                Showing the latest 10 of {progress.readingPath.length} encounters
              </p>
            )}
          </section>
        )}

        <AdaptationLedger records={progress.selectionRecords} />

        <JourneyExportActions />

        <JourneyControlActions />

        <section className="border border-[#1d2b33]">
          <h3 className="border-b border-[#1d2b33] px-4 py-2.5 font-mono text-[11px] tracking-[0.14em] text-[#8fa3ad] uppercase">
            By perspective
          </h3>
          <div>
            {perspectiveRows.map(({ label, character, counts }) => {
              const perspective = PERSPECTIVE[character];
              return (
                <div
                  key={label}
                  className="flex items-center justify-between gap-3 border-b border-[#1d2b33] px-4 py-2 last:border-b-0"
                >
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="h-[14px] w-[14px] shrink-0 border border-[#38505b]"
                      style={{ backgroundColor: perspective.fill }}
                    />
                    <span className="text-[13px]" style={{ color: perspective.ink }}>
                      {label}
                    </span>
                  </div>
                  <span className="font-mono text-[12px] text-[#93a5ae] tabular-nums">
                    {counts.visited}/{counts.total}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </RecordSheetDialog>
  );
}
