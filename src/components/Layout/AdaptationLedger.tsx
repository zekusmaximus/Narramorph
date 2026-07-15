import type { ReactElement } from 'react';

import type { SelectionRecord } from '@/types';

interface AdaptationLedgerProps {
  records: readonly SelectionRecord[];
}

/** Visited-only history. Machine identifiers deliberately remain out of the DOM. */
export function AdaptationLedger({ records }: AdaptationLedgerProps): ReactElement {
  return (
    <details
      data-testid="adaptation-ledger"
      className="rounded-lg border border-cyan-900/60 bg-cyan-950/15 px-4 py-3"
    >
      <summary className="min-h-11 cursor-pointer content-center font-serif text-base text-cyan-100 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 sm:text-lg">
        How your journey adapted
      </summary>

      {records.length === 0 ? (
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          Adaptation notes will appear here as the archive responds to your path.
        </p>
      ) : (
        <ol className="mt-3 space-y-4">
          {records.map((record) => (
            <li
              key={`${record.sequence}-${record.nodeId}-${record.fragmentLabel ?? 'passage'}`}
              className="border-l border-cyan-800/70 pl-3"
            >
              <p className="font-serif text-sm text-cyan-100 sm:text-base">
                {record.passageTitle}
                {record.fragmentLabel && (
                  <span className="font-sans text-xs text-slate-400">
                    {' '}
                    · {record.fragmentLabel}
                  </span>
                )}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Encounter {record.sequence} · visit {record.visitNumber}
              </p>
              {record.excerpt && (
                <blockquote className="my-2 border-l border-slate-700 pl-3 font-serif text-sm italic leading-relaxed text-slate-300">
                  “{record.excerpt}”
                </blockquote>
              )}
              <p className="text-sm leading-relaxed text-slate-300">{record.explanation}</p>
            </li>
          ))}
        </ol>
      )}
    </details>
  );
}
