import { PERSPECTIVE_COLOR, PERSPECTIVE_INK } from '@/styles/designTokens';
import type { CharacterType, TransformationState } from '@/types';

/**
 * Accession node colours. Every node draws its fill and label ink from the unified
 * perspective tokens — there is no separate neon palette. `CharacterType` and the
 * design-token `PerspectiveKey` share the same four keys, so the map is 1:1.
 */
export interface NodeColors {
  /** Non-text identity fill (node body, ≥ 3:1 on the shell). */
  fill: string;
  /** Readable label / letter ink (≥ 4.5:1 on the shell). */
  ink: string;
}

export function getNodeColors(character: CharacterType): NodeColors {
  return {
    fill: PERSPECTIVE_COLOR[character],
    ink: PERSPECTIVE_INK[character],
  };
}

/**
 * Transformation badge glyphs — a diamond outline on first revisit, a filled diamond
 * once meta-aware. Shape, not colour, carries the meaning (Accession keeps these as
 * neutral metadata stamps).
 */
export function getTransformationBadge(state: TransformationState): string | null {
  if (state === 'firstRevisit') {
    return '◇';
  }
  if (state === 'metaAware') {
    return '◈';
  }
  return null;
}
