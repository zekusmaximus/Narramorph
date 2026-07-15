import type { ReactElement } from 'react';

import { renderSelectionReason } from '@/domain/variation/selectionReason';
import type { SelectionReason, Theme } from '@/types';

interface SelectionDisclosureProps {
  reason: SelectionReason | null;
  theme?: Theme;
}

/** Optional, native disclosure for the current adaptive decision. */
export function SelectionDisclosure({
  reason,
  theme = 'dark',
}: SelectionDisclosureProps): ReactElement | null {
  if (!reason) {
    return null;
  }

  const palette =
    theme === 'light'
      ? 'border-slate-300 bg-slate-50 text-slate-700'
      : theme === 'sepia'
        ? 'border-amber-900/25 bg-amber-100/45 text-amber-950'
        : 'border-cyan-900/60 bg-cyan-950/20 text-slate-300';

  return (
    <details
      data-testid="selection-disclosure"
      className={`mx-4 mb-4 rounded-lg border px-4 py-3 text-sm sm:mx-6 ${palette}`}
    >
      <summary className="min-h-11 cursor-pointer content-center font-medium underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400">
        Why this version?
      </summary>
      <p className="mt-2 max-w-prose leading-relaxed" data-testid="selection-explanation">
        {renderSelectionReason(reason)}
      </p>
    </details>
  );
}
