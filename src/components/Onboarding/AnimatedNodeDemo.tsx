import type { ReactElement } from 'react';

import { INTRO_DEMO_CAPTION } from './introContent';

interface AnimatedNodeDemoProps {
  /**
   * Retained for API compatibility and honoured by the record-sheet redesign:
   * the demo is now a static sample (no pulsing), so reduced motion changes
   * nothing visually. The resolved preference (OS `prefers-reduced-motion` OR the
   * in-app "Reduce motion" setting) is still recorded on the figure for tests and
   * to guarantee no motion ever runs here.
   */
  reduceMotion: boolean;
}

/**
 * A static Accession sample of a map passage: a real perspective-filled node
 * circle beside a label plaque, captioned so a reader can recognise the pieces on
 * the map. The graphic is decorative (`aria-hidden`); the always-present
 * `<figcaption>` carries the meaning, so nothing lives only in visuals and there
 * is no motion to suppress.
 */
export function AnimatedNodeDemo({ reduceMotion }: AnimatedNodeDemoProps): ReactElement {
  return (
    <figure
      className="my-2 flex flex-col items-center gap-3 border border-[#1d2b33] bg-[#080d10] px-4 py-5"
      data-testid="intro-node-demo"
      data-reduced-motion={reduceMotion}
    >
      <div className="flex items-center gap-3" aria-hidden="true">
        {/* A real node circle, filled with the archaeologist perspective gradient. */}
        <span
          className="h-10 w-10 shrink-0 rounded-full"
          style={{
            background: 'radial-gradient(circle at 38% 32%, #6fa9ea, #4A90E2 60%, #2c5f9e)',
          }}
        />
        {/* A sample label plaque, as it appears beside a passage on the map. */}
        <span className="border border-[rgba(74,144,226,0.35)] bg-[#0b1015]/92 px-2.5 py-1 font-serif text-[12px] text-[#7db2ec]">
          First Documentation
        </span>
        <span className="font-mono text-[10px] tracking-[0.14em] text-[#8fa3ad]">← A PASSAGE</span>
      </div>
      <figcaption className="max-w-xs text-center text-[13px] leading-relaxed text-[#93a5ae]">
        {INTRO_DEMO_CAPTION}
      </figcaption>
    </figure>
  );
}
