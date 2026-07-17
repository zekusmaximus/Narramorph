import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';

import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';
import type { LineHeight, TextSize, Theme, TransformationState } from '@/types';

import { MarkdownContent } from './MarkdownContent';
import { readingSurfaceClass } from './readingTypography';
import { loadScrollPosition, saveScrollPosition } from './scrollMemory';

/** Below this offset a passage is "at the top": no back-to-top control needed. */
const BACK_TO_TOP_THRESHOLD_PX = 600;

interface StoryContentProps {
  content: string;
  transformationState: TransformationState;
  textSize: TextSize;
  lineHeight?: LineHeight;
  theme: Theme;
  /** Scroll-memory key (the passage's nodeId). Scroll is remembered per key. */
  scrollKey?: string;
  /** When true (URL restore/reload), resume the saved scroll; else start at top. */
  resumeScroll?: boolean;
}

export function StoryContent({
  content,
  transformationState,
  textSize,
  lineHeight,
  theme,
  scrollKey,
  resumeScroll = false,
}: StoryContentProps): ReactElement {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const reduceMotion = useReducedMotionPreference();

  const updateReadingProgress = useCallback((): void => {
    const scrollRegion = scrollRef.current;
    if (!scrollRegion) {
      return;
    }

    const scrollableDistance = scrollRegion.scrollHeight - scrollRegion.clientHeight;
    const nextProgress =
      scrollableDistance <= 0
        ? 100
        : Math.round((scrollRegion.scrollTop / scrollableDistance) * 100);
    setReadingProgress(Math.max(0, Math.min(100, nextProgress)));
    setShowBackToTop(scrollRegion.scrollTop > BACK_TO_TOP_THRESHOLD_PX);
  }, []);

  // Persist the scroll offset for the current content so an interrupted read
  // (including a reload) resumes where it left off.
  const handleScroll = useCallback((): void => {
    updateReadingProgress();
    const scrollRegion = scrollRef.current;
    if (scrollRegion && scrollKey) {
      saveScrollPosition(scrollKey, scrollRegion.scrollTop);
    }
  }, [scrollKey, updateReadingProgress]);

  const scrollToTop = useCallback((): void => {
    const scrollRegion = scrollRef.current;
    if (!scrollRegion) {
      return;
    }
    scrollRegion.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    scrollRegion.focus({ preventScroll: true });
  }, [reduceMotion]);

  useEffect(() => {
    const scrollRegion = scrollRef.current;
    if (!scrollRegion) {
      return undefined;
    }

    // Resume the saved offset only when this open is a URL restore (reload /
    // Back / deep-link); a deliberate open starts at the top of the passage.
    const savedTop = resumeScroll && scrollKey ? loadScrollPosition(scrollKey) : null;
    scrollRegion.scrollTop = savedTop ?? 0;
    updateReadingProgress();
    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => updateReadingProgress());
    observer?.observe(scrollRegion);
    window.addEventListener('resize', updateReadingProgress);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', updateReadingProgress);
    };
  }, [content, scrollKey, resumeScroll, updateReadingProgress]);

  const surfaceClass =
    theme === 'sepia'
      ? 'bg-[#f3ead7] text-[#382f25]'
      : theme === 'light'
        ? 'bg-[#f6f4ef] text-slate-900'
        : 'bg-[#0b1015] text-slate-200';

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        data-testid="story-scroll-region"
        role="region"
        aria-label="Story passage"
        tabIndex={0}
        className={`relative min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain ${surfaceClass}`}
        onScroll={handleScroll}
      >
        <div
          className={`sticky top-0 z-10 border-b px-5 py-2 backdrop-blur-md sm:px-8 ${
            theme === 'dark'
              ? 'border-white/5 bg-[#0b1015]/90 text-slate-400'
              : 'border-black/5 bg-white/80 text-slate-500'
          }`}
        >
          <div className="mx-auto flex min-w-0 max-w-[44rem] flex-wrap items-center gap-x-3 gap-y-2">
            <span className="min-w-0 text-[0.65rem] uppercase tracking-[0.2em]">
              Passage progress
            </span>
            <div
              role="progressbar"
              aria-label="Passage reading progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={readingProgress}
              className="h-px min-w-16 flex-1 basis-24 overflow-hidden bg-current opacity-40"
            >
              <div
                className="h-full bg-cyan-500 transition-[width] duration-150"
                style={{ width: `${readingProgress}%` }}
              />
            </div>
            <span className="min-w-8 shrink-0 text-right text-xs tabular-nums">
              {readingProgress}%
            </span>
          </div>
        </div>
        <div
          className={`mx-auto w-full min-w-0 max-w-[44rem] break-words px-5 pb-14 pt-8 font-serif tracking-[0.01em] [overflow-wrap:anywhere] sm:px-8 sm:pb-16 sm:pt-10 ${readingSurfaceClass(
            textSize,
            lineHeight,
          )}`}
        >
          {reduceMotion ? (
            <div className="max-w-none" data-testid="story-passage">
              <MarkdownContent content={content} />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={transformationState}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="max-w-none"
                data-testid="story-passage"
              >
                <MarkdownContent content={content} />
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
      {showBackToTop && (
        <button
          type="button"
          onClick={scrollToTop}
          data-testid="back-to-top"
          className={`absolute bottom-4 right-4 z-20 flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium shadow-lg backdrop-blur transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 ${
            theme === 'dark'
              ? 'border-white/15 bg-[#11191e]/90 text-slate-100 hover:border-cyan-200/40'
              : 'border-black/10 bg-white/90 text-slate-700 hover:border-slate-400'
          }`}
        >
          <ArrowUp className="h-4 w-4" aria-hidden="true" />
          Back to top
        </button>
      )}
    </div>
  );
}
