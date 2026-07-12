import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';

import type { TextSize, Theme, TransformationState } from '@/types';

import { MarkdownContent } from './MarkdownContent';

interface StoryContentProps {
  content: string;
  transformationState: TransformationState;
  textSize: TextSize;
  theme: Theme;
}

export function StoryContent({
  content,
  transformationState,
  textSize,
  theme,
}: StoryContentProps): ReactElement {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [readingProgress, setReadingProgress] = useState(0);

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
  }, []);

  useEffect(() => {
    const scrollRegion = scrollRef.current;
    if (!scrollRegion) {
      return undefined;
    }

    scrollRegion.scrollTop = 0;
    setReadingProgress(0);
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
  }, [content, updateReadingProgress]);

  const surfaceClass =
    theme === 'sepia'
      ? 'bg-[#f3ead7] text-[#382f25]'
      : theme === 'light'
        ? 'bg-[#f6f4ef] text-slate-900'
        : 'bg-[#0b1015] text-slate-200';

  return (
    <div
      ref={scrollRef}
      data-testid="story-scroll-region"
      className={`relative min-h-0 flex-1 overflow-y-auto ${surfaceClass}`}
      onScroll={updateReadingProgress}
    >
      <div
        className={`sticky top-0 z-10 border-b px-5 py-2 backdrop-blur-md sm:px-8 ${
          theme === 'dark'
            ? 'border-white/5 bg-[#0b1015]/90 text-slate-400'
            : 'border-black/5 bg-white/80 text-slate-500'
        }`}
      >
        <div className="mx-auto flex max-w-[44rem] items-center gap-3">
          <span className="text-[0.65rem] uppercase tracking-[0.2em]">Passage progress</span>
          <div
            role="progressbar"
            aria-label="Passage reading progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={readingProgress}
            className="h-px flex-1 overflow-hidden bg-current opacity-40"
          >
            <div
              className="h-full bg-cyan-500 transition-[width] duration-150"
              style={{ width: `${readingProgress}%` }}
            />
          </div>
          <span className="w-8 text-right text-xs tabular-nums">{readingProgress}%</span>
        </div>
      </div>
      <div
        className={`mx-auto w-full max-w-[44rem] px-5 pb-14 pt-8 font-serif tracking-[0.01em] sm:px-8 sm:pb-16 sm:pt-10
          ${textSize === 'small' ? 'text-base leading-[1.8]' : ''}
          ${textSize === 'medium' ? 'text-lg leading-[1.85]' : ''}
          ${textSize === 'large' ? 'text-xl leading-[1.9]' : ''}`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={transformationState}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="max-w-none"
          >
            <MarkdownContent content={content} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
