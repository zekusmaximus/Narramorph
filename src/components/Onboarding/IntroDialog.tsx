import { motion } from 'framer-motion';
import { Compass, X } from 'lucide-react';
import { useCallback, useRef, type ReactElement } from 'react';

import { useDialogFocus } from '@/hooks/useDialogFocus';

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
 * The first-run introduction, rebuilt clean-room from the older prototype's
 * concept in N's architecture. It is a proper modal dialog (labelled,
 * `aria-modal`) with focus containment, restoration, Escape, and background
 * inerting supplied by {@link useDialogFocus} — none of which the prototype had.
 * The single accessible panel covers premise → choose a perspective → open a
 * fragment → path sensitivity → return/revisit, with a semantic animated-node
 * demonstration that has a static reduced-motion equivalent and a text caption.
 */
export function IntroDialog({
  open,
  origin,
  onClose,
  reduceMotion,
}: IntroDialogProps): ReactElement | null {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const handleClose = useCallback(() => onCloseRef.current(), []);
  const dialogRef = useDialogFocus(open, handleClose, {
    initialFocusSelector: '#intro-title',
  });

  if (!open) {
    return null;
  }

  const isFirstRun = origin === 'first-run';
  const dismissLabel = isFirstRun ? INTRO_SKIP_LABEL : 'Close guide';
  const primaryLabel = isFirstRun ? INTRO_BEGIN_LABEL : INTRO_HELP_CLOSE_LABEL;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/85 p-3 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={handleClose}
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="intro-title"
        tabIndex={-1}
        data-testid="intro-dialog"
        data-intro-origin={origin}
        initial={reduceMotion ? false : { scale: 0.97, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={reduceMotion ? undefined : { scale: 0.97, opacity: 0, y: 8 }}
        transition={{ duration: reduceMotion ? 0 : 0.2 }}
        className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-xl min-w-0 overflow-x-hidden overflow-y-auto rounded-xl border border-cyan-200/20 bg-[#0b1015] p-4 text-slate-200 shadow-2xl shadow-black/60 sm:max-h-[calc(100dvh-3rem)] sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cyan-200/20 bg-cyan-200/[0.05] text-cyan-200 sm:flex">
              <Compass className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="break-words text-[0.65rem] uppercase tracking-[0.22em] text-cyan-200/60 [overflow-wrap:anywhere]">
                {INTRO_EYEBROW}
              </p>
              <h2
                id="intro-title"
                tabIndex={-1}
                className="break-words font-serif text-2xl font-semibold text-slate-100 [overflow-wrap:anywhere]"
              >
                {INTRO_TITLE}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-800 hover:text-cyan-100 focus-visible:outline-cyan-200"
            aria-label={dismissLabel}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <p className="text-sm leading-relaxed text-slate-300 sm:text-[0.95rem]">{INTRO_PREMISE}</p>

        <ol className="mt-5 space-y-4">
          {INTRO_STEPS.map((step, index) => (
            <li key={step.id} className="flex min-w-0 gap-3" data-intro-step={step.id}>
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-cyan-200/30 bg-cyan-200/[0.05] font-mono text-xs text-cyan-100"
              >
                {index + 1}
              </span>
              <div className="min-w-0">
                <h3 className="font-serif text-lg font-medium text-slate-100">{step.heading}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">{step.body}</p>
                {step.withDemo && <AnimatedNodeDemo reduceMotion={reduceMotion} />}
              </div>
            </li>
          ))}
        </ol>

        <p className="mt-5 border-t border-slate-800 pt-4 text-sm text-slate-500">
          {INTRO_HELP_HINT}
        </p>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={handleClose}
            data-testid="intro-primary-action"
            className="min-h-11 rounded-lg bg-cyan-200 px-5 py-2.5 font-medium text-slate-950 shadow-lg transition-colors hover:bg-cyan-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-100"
          >
            {primaryLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
