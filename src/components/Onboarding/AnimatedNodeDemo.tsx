import { motion } from 'framer-motion';
import type { ReactElement } from 'react';

import { INTRO_DEMO_CAPTION } from './introContent';

interface AnimatedNodeDemoProps {
  /**
   * When true, no looping motion runs: a static node-and-ring is shown instead.
   * The caller passes the resolved preference (OS `prefers-reduced-motion` OR the
   * in-app "Reduce motion" setting) so this honours both.
   */
  reduceMotion: boolean;
}

/**
 * A semantic, accessible reimagining of the older prototype's animation-only
 * node demo (`.example-node` pulse + `.click-indicator` ripple). The SVG is
 * decorative (`aria-hidden`); the always-present `<figcaption>` carries the
 * explanation, so nothing lives only in motion. Under reduced motion the same
 * shapes render statically.
 */
export function AnimatedNodeDemo({ reduceMotion }: AnimatedNodeDemoProps): ReactElement {
  // Scale animations on SVG shapes must pivot on the shape's own box.
  const centerOrigin = { transformBox: 'fill-box' as const, transformOrigin: 'center' };

  return (
    <figure
      className="my-1 flex flex-col items-center gap-3 rounded-lg border border-cyan-200/15 bg-black/20 px-4 py-4"
      data-testid="intro-node-demo"
      data-reduced-motion={reduceMotion}
    >
      <svg
        viewBox="0 0 120 120"
        role="img"
        aria-hidden="true"
        className="h-24 w-24 shrink-0 overflow-visible"
      >
        {/* Expanding "click" ripple — the invitation to select. */}
        <motion.circle
          cx={60}
          cy={60}
          r={20}
          fill="none"
          stroke="#a5f3fc"
          strokeWidth={2}
          style={centerOrigin}
          initial={false}
          animate={
            reduceMotion
              ? { scale: 1.4, opacity: 0.35 }
              : { scale: [0.85, 1.7], opacity: [0.55, 0] }
          }
          transition={
            reduceMotion ? { duration: 0 } : { duration: 2, repeat: Infinity, ease: 'easeOut' }
          }
        />
        {/* The node itself — a fragment waiting to be opened. */}
        <motion.circle
          cx={60}
          cy={60}
          r={16}
          fill="#22d3ee"
          style={{ ...centerOrigin, filter: 'drop-shadow(0 0 10px rgba(34,211,238,0.55))' }}
          initial={false}
          animate={reduceMotion ? { scale: 1 } : { scale: [1, 1.12, 1] }}
          transition={
            reduceMotion ? { duration: 0 } : { duration: 2, repeat: Infinity, ease: 'easeInOut' }
          }
        />
      </svg>
      <figcaption className="max-w-xs text-center text-sm leading-relaxed text-slate-300">
        {INTRO_DEMO_CAPTION}
      </figcaption>
    </figure>
  );
}
