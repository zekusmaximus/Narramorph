import { motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';

import { useDialogFocus } from '@/hooks/useDialogFocus';

interface RecordSheetDialogProps {
  open: boolean;
  onClose: () => void;
  /** Machine metadata line, e.g. `READER PREFERENCES · FORM R-3` (mono, uppercased by caller). */
  classification: string;
  /** Serif record title. */
  title: string;
  /** DOM id for the title element; also drives `aria-labelledby` + initial focus. */
  titleId: string;
  /** Accessible label for the close control. */
  closeLabel: string;
  children: ReactNode;
  reduceMotion: boolean;
  /** Panel max width in px. Settings/Intro use 520; Progress uses 560. */
  maxWidth?: number;
  /** Optional pinned footer, rendered below the scroll region (above the rule affordance). */
  footer?: ReactNode;
  /**
   * When the caller can count what lies below the fold, the overflow affordance
   * reads `SCROLL FOR {N} MORE ↓`; otherwise a static `SCROLL FOR MORE ↓` is used.
   * Either only appears while the body is scrollable and not scrolled to the end.
   */
  scrollMoreCount?: number;
  /** Extra data-* / test hooks spread onto the panel. */
  panelProps?: Record<string, string>;
}

/**
 * The one Accession dialog anatomy: a card-catalogue record sheet. Every utility
 * dialog (settings, progress, orientation) renders through this so backdrop,
 * panel, header double-rule, scroll affordance, motion, and — crucially — the
 * accessibility contract (focus trap, Escape, restoration, background inerting
 * via {@link useDialogFocus}, `role="dialog"` + `aria-modal` + labelled title)
 * are defined exactly once.
 */
export function RecordSheetDialog({
  open,
  onClose,
  classification,
  title,
  titleId,
  closeLabel,
  children,
  reduceMotion,
  maxWidth = 520,
  footer,
  scrollMoreCount,
  panelProps,
}: RecordSheetDialogProps): ReactElement | null {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const handleClose = useCallback(() => onCloseRef.current(), []);
  const dialogRef = useDialogFocus(open, handleClose, {
    initialFocusSelector: `#${titleId}`,
  });

  const bodyRef = useRef<HTMLDivElement>(null);
  const [showScrollHint, setShowScrollHint] = useState(false);

  const syncScrollHint = useCallback(() => {
    const body = bodyRef.current;
    if (!body) {
      setShowScrollHint(false);
      return;
    }
    const scrollable = body.scrollHeight - body.clientHeight > 1;
    const atBottom = body.scrollTop + body.clientHeight >= body.scrollHeight - 1;
    setShowScrollHint(scrollable && !atBottom);
  }, []);

  // Re-measure whenever the dialog opens or its content changes size.
  useEffect(() => {
    if (!open) {
      return undefined;
    }
    syncScrollHint();
    const body = bodyRef.current;
    if (!body) {
      return undefined;
    }
    const observer =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => syncScrollHint()) : null;
    observer?.observe(body);
    return () => observer?.disconnect();
  }, [open, syncScrollHint]);

  if (!open) {
    return null;
  }

  const scrollLabel =
    typeof scrollMoreCount === 'number' && scrollMoreCount > 0
      ? `SCROLL FOR ${scrollMoreCount} MORE ↓`
      : 'SCROLL FOR MORE ↓';

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduceMotion ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.2 }}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#04070a]/72 p-3 sm:items-center sm:p-6"
      onClick={handleClose}
    >
      <motion.div
        {...panelProps}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={
          reduceMotion
            ? { opacity: 0, transition: { duration: 0 } }
            : { opacity: 0, transition: { duration: 0.15 } }
        }
        transition={{ duration: reduceMotion ? 0 : 0.2, ease: 'easeOut' }}
        style={{ maxWidth }}
        className="my-auto flex max-h-[calc(100dvh-1.5rem)] w-full min-w-0 flex-col overflow-hidden border border-[#2b3b44] bg-[#0d1318] text-[#b7c6ce] shadow-[0_24px_60px_rgba(0,0,0,0.6)] sm:max-h-[calc(100dvh-3rem)]"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header band with a double-rule bottom (hairline + offset shadow). */}
        <div className="relative shrink-0 border-b border-[#2a3a42] px-5 pt-4 pb-3.5 shadow-[0_3px_0_-2px_#16242b]">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div className="min-w-0">
              <p className="font-mono text-[11px] font-medium tracking-[0.16em] text-[#8fa3ad] uppercase [overflow-wrap:anywhere]">
                {classification}
              </p>
              <h2
                id={titleId}
                tabIndex={-1}
                className="mt-1.5 font-serif text-[20px] leading-tight font-semibold break-words text-[#eef4f6] [overflow-wrap:anywhere] sm:text-[21px]"
              >
                {title}
              </h2>
            </div>
            <button
              type="button"
              onClick={handleClose}
              aria-label={closeLabel}
              className="relative flex h-7 w-7 shrink-0 items-center justify-center border border-[#2b3b44] text-[#8fa3ad] transition-colors after:absolute after:-inset-2 after:content-[''] hover:bg-white/5 hover:text-[#eef4f6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a5f3fc]"
            >
              <span aria-hidden="true" className="font-mono text-sm leading-none">
                ×
              </span>
            </button>
          </div>
        </div>

        {/* Scrollable body with a bottom fade overflow affordance. */}
        <div className="relative min-h-0 flex-1">
          <div
            ref={bodyRef}
            onScroll={syncScrollHint}
            className="max-h-[min(70vh,640px)] overflow-y-auto px-5 py-5"
          >
            {children}
          </div>
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-x-0 bottom-0 h-11 bg-gradient-to-t from-[#0d1318] to-transparent transition-opacity duration-150 ${
              showScrollHint ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </div>

        {footer && <div className="shrink-0 border-t border-[#1d2b33] px-5 py-3">{footer}</div>}

        {showScrollHint && (
          <div className="shrink-0 border-t border-[#1d2b33] px-5 py-1.5">
            <p className="font-mono text-[10px] tracking-[0.14em] text-[#8fa3ad] uppercase">
              {scrollLabel}
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/**
 * Shared inner heading: a mono `01`/`02` section index in selection cyan next to
 * an Inter section heading. Callers can tune the heading ink to match a sheet.
 */
export function SectionHeading({
  index,
  children,
  headingClassName = 'text-[#dfe8ec]',
}: {
  index: string;
  children: ReactNode;
  headingClassName?: string;
}): ReactElement {
  return (
    <div className="mb-2 flex items-baseline gap-2">
      <span aria-hidden="true" className="font-mono text-[11px] text-[#a5f3fc]">
        {index}
      </span>
      <span className={`text-[13px] font-semibold ${headingClassName}`}>{children}</span>
    </div>
  );
}

/**
 * The selection stamp used across the record sheets: a mono `[×]` when set and a
 * mono `[ ]` when not. Decorative — the real state lives on the input/aria.
 */
export function Stamp({ checked }: { checked: boolean }): ReactElement {
  return (
    <span
      aria-hidden="true"
      className={`font-mono text-[11px] ${checked ? 'text-[#a5f3fc]' : 'text-[#7e929c]'}`}
    >
      {checked ? '[×]' : '[ ]'}
    </span>
  );
}
