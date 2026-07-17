import { motion } from 'framer-motion';
import { Archive, ChevronRight } from 'lucide-react';
import { useMemo, type ReactElement } from 'react';

import { useMapInteractionAdapter } from '@/components/map/useMapInteractionAdapter';
import { useStoryStore } from '@/stores';
import type { CharacterType } from '@/types';

const PERSPECTIVE_PRESENTATION: Record<
  CharacterType,
  { label: string; era: string; accent: string; marker: string }
> = {
  archaeologist: {
    label: 'The Archaeologist',
    era: '2047',
    accent: 'border-sky-300/35 hover:border-sky-200/70 hover:bg-sky-200/10',
    marker: 'A',
  },
  algorithm: {
    label: 'The Algorithm',
    era: '2151',
    accent: 'border-emerald-300/35 hover:border-emerald-200/70 hover:bg-emerald-200/10',
    marker: 'Σ',
  },
  'last-human': {
    label: 'The Last Human',
    era: '2383',
    accent: 'border-rose-300/35 hover:border-rose-200/70 hover:bg-rose-200/10',
    marker: 'H',
  },
  'multi-perspective': {
    label: 'The Convergence',
    era: 'beyond',
    accent: 'border-violet-300/35 hover:border-violet-200/70 hover:bg-violet-200/10',
    marker: '∴',
  },
};

/** A compact invitation into the story, backed by the existing map interaction contract. */
export function OpeningExperience(): ReactElement {
  const adapter = useMapInteractionAdapter('2d');
  const storyData = useStoryStore((state) => state.storyData);
  const visitedCount = useStoryStore((state) => Object.keys(state.progress.visitedNodes).length);
  const entryNodes = useMemo(
    () => adapter.nodes.filter(({ node, available }) => node.layer === 1 && available),
    [adapter.nodes],
  );
  const hasBegun = visitedCount > 0;

  return (
    <section
      aria-labelledby="opening-title"
      tabIndex={-1}
      data-has-begun={hasBegun}
      className={`relative flex-none overflow-x-hidden overflow-y-auto overscroll-contain border-b border-cyan-100/10 bg-[#0d151a] px-4 text-stone-100 sm:px-6 ${
        hasBegun ? 'max-h-[34dvh] py-3 sm:py-3.5' : 'max-h-[50dvh] py-4 sm:py-5'
      }`}
    >
      <div
        className="pointer-events-none absolute inset-0 archive-intro-texture"
        aria-hidden="true"
      />
      <div className="cosmic-atmosphere absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-7xl gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(36rem,1.25fr)] lg:items-end">
        <div className="min-w-0">
          {!hasBegun && (
            <div className="mb-1.5 flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.24em] text-cyan-100/60">
              <Archive aria-hidden="true" className="h-3.5 w-3.5" />
              <span>Recovered archive · signal 01</span>
            </div>
          )}
          <motion.h1
            id="opening-title"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`font-serif leading-tight text-stone-50 ${
              hasBegun ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'
            }`}
          >
            {storyData?.metadata.title ?? 'Eternal Return of the Digital Self'}
          </motion.h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-[0.95rem]">
            {hasBegun
              ? 'The archive remembers your path. Choose a perspective to return to the story.'
              : 'Three witnesses survived in the signal. Choose a perspective and enter the story.'}
          </p>
        </div>

        <div className="min-w-0">
          <p className="mb-2 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-amber-100/70">
            {hasBegun ? 'Continue through a perspective' : 'Begin with a perspective'}
          </p>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,6.5rem),1fr))] gap-2 sm:gap-3">
            {entryNodes.map(({ node }) => {
              const presentation = PERSPECTIVE_PRESENTATION[node.character];
              return (
                <button
                  key={node.id}
                  type="button"
                  data-testid={`perspective-entry-${node.id}`}
                  onClick={() => adapter.activate(node.id)}
                  className={`group min-w-0 rounded-lg border bg-black/20 px-2.5 py-2.5 text-left shadow-sm transition-colors sm:px-3.5 ${presentation.accent}`}
                  aria-label={`Enter the story through ${presentation.label}`}
                >
                  <span className="flex items-start justify-between gap-1">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-current/30 font-serif text-sm text-stone-100">
                      {presentation.marker}
                    </span>
                    <ChevronRight
                      aria-hidden="true"
                      className="mt-1 h-4 w-4 shrink-0 text-stone-400 transition-transform group-hover:translate-x-0.5 group-hover:text-stone-100"
                    />
                  </span>
                  <span className="mt-2 block min-h-9 font-serif text-sm leading-tight text-stone-100 sm:min-h-0 sm:text-base">
                    {presentation.label}
                  </span>
                  <span className="mt-0.5 block break-words font-mono text-[0.6rem] uppercase tracking-[0.18em] text-stone-400 [overflow-wrap:anywhere]">
                    transmission {presentation.era}
                  </span>
                </button>
              );
            })}
            {entryNodes.length === 0 && (
              <div
                role="status"
                className="col-span-full rounded-lg border border-white/10 bg-black/20 px-4 py-5 text-center text-sm text-slate-400"
              >
                Recovering the first passages…
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
