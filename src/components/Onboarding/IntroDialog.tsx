import type { ReactElement } from 'react';

import { RecordSheetDialog } from '@/components/Layout/RecordSheetDialog';

import { AnimatedNodeDemo } from './AnimatedNodeDemo';
import {
  INTRO_BEGIN_LABEL,
  INTRO_EYEBROW,
  INTRO_HELP_CLOSE_LABEL,
  INTRO_HELP_HINT,
  INTRO_PREMISE,
  INTRO_SKIP_LABEL,
  INTRO_STEPS,
  INTRO_TITLE,
} from './introContent';

/** How the intro was opened: automatically on first run, or on demand from Help. */
export type IntroOrigin = 'first-run' | 'help';

interface IntroDialogProps {
  open: boolean;
  /** First run shows a "skip"/"begin" framing; Help shows a "close" framing. */
  origin: IntroOrigin;
  onClose: () => void;
  reduceMotion: boolean;
}

/**
 * The orientation guide, refit onto the shared {@link RecordSheetDialog} anatomy.
 * It is a proper modal dialog (labelled, `aria-modal`) with focus containment,
 * restoration, Escape, and background inerting supplied by the record sheet's
 * `useDialogFocus`. The single accessible panel covers premise → choose a
 * perspective → open a passage (with a static sample) → path sensitivity →
 * return/revisit, with the meaning always in text.
 */
export function IntroDialog({
  open,
  origin,
  onClose,
  reduceMotion,
}: IntroDialogProps): ReactElement | null {
  if (!open) {
    return null;
  }

  const isFirstRun = origin === 'first-run';
  const dismissLabel = isFirstRun ? INTRO_SKIP_LABEL : 'Close guide';
  const primaryLabel = isFirstRun ? INTRO_BEGIN_LABEL : INTRO_HELP_CLOSE_LABEL;

  return (
    <RecordSheetDialog
      open={open}
      onClose={onClose}
      reduceMotion={reduceMotion}
      classification={INTRO_EYEBROW}
      title={INTRO_TITLE}
      titleId="intro-title"
      closeLabel={dismissLabel}
      panelProps={{ 'data-testid': 'intro-dialog', 'data-intro-origin': origin }}
      footer={
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            data-testid="intro-primary-action"
            className="min-h-11 border border-[#2b3b44] bg-[#132027] px-5 font-mono text-[12px] tracking-[0.08em] text-[#a5f3fc] uppercase transition-colors hover:bg-[#17303a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a5f3fc]"
          >
            {primaryLabel}
          </button>
        </div>
      }
    >
      <p className="text-[13px] leading-relaxed text-[#b7c6ce]">{INTRO_PREMISE}</p>

      <ol className="mt-5 space-y-5">
        {INTRO_STEPS.map((step, index) => (
          <li key={step.id} className="flex min-w-0 gap-3" data-intro-step={step.id}>
            <span
              aria-hidden="true"
              className="mt-px shrink-0 font-mono text-[11px] text-[#a5f3fc]"
            >
              {String(index + 1).padStart(2, '0')}
            </span>
            <div className="min-w-0">
              <h3 className="text-[13px] font-semibold text-[#eef4f6]">{step.heading}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-[#93a5ae]">{step.body}</p>
              {step.withDemo && <AnimatedNodeDemo reduceMotion={reduceMotion} />}
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-5 border-t border-[#1d2b33] pt-4 font-mono text-[11px] tracking-[0.04em] text-[#8fa3ad]">
        {INTRO_HELP_HINT}
      </p>
    </RecordSheetDialog>
  );
}
