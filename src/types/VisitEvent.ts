import type { SelectionReason } from './SelectionReason';
import type { StoryPackageIdentity } from './Store';

/**
 * Export-grade journey visit-event contract (ADR 0004).
 *
 * A `VisitEvent` is an immutable record of one experienced passage encounter, stored in reading
 * order. It captures the exact resolved prose the reader saw so a saved or exported journey
 * reopens and re-exports byte-identically even after a later content update rewrites the
 * underlying variation, beat, or bridge.
 *
 * Design-only in this contract-lock step: the shape and its guards are defined and tested here so
 * that Batch 4.1 (prose beats) writes `selection.beatIds` into it, Batch 4.2 (edge prose) writes
 * `bridgeId`, and Batch 4.3 adds the persisted `visitEvents` log with a `1.3.0` save migration. It
 * is not yet written by the store.
 */

export const VISIT_EVENT_CONTRACT = 'org.narramorph.visit-event' as const;
export const VISIT_EVENT_SCHEMA_VERSION = '1.0.0' as const;

/** An explicit, named reader decision made at a passage. Never an arbitrary flag bag (see ADR 0003). */
export type ReaderChoiceKind = 'l2-philosophy' | 'ending';

export interface ReaderChoice {
  kind: ReaderChoiceKind;
  /** Reader-safe value, e.g. "acceptance" or "Preserve the Pattern". Never an internal ID. */
  value: string;
}

/** Which content produced the encounter's prose. */
export interface VisitEventSelection {
  /** Whole-passage variation, when one was selected. */
  variationId: string | null;
  /** Ordered resolved prose-beat IDs (Batch 4.1). Empty until beats exist for the passage. */
  beatIds: string[];
  /** Optional finer-grained label, e.g. an L3 convergence section. */
  fragmentLabel?: string;
}

/** The exact rendered prose the reader saw — the export source of truth. */
export interface ResolvedText {
  format: 'markdown';
  /** Exact rendered Markdown the reader saw. */
  content: string;
  /** Integrity digest of `content`, formatted "<algorithm>:<lowercase-hex>" (initially sha256). */
  hash: string;
  /** UTF-8 byte length of `content`. */
  byteLength: number;
}

export interface VisitEvent {
  contract: typeof VISIT_EVENT_CONTRACT;
  schemaVersion: typeof VISIT_EVENT_SCHEMA_VERSION;
  /** Monotonic, 0-based position of this passage in experienced reading order. */
  sequence: number;
  /** Internal node/passage ID — diagnostic only, never rendered to the reader. */
  nodeId: string;
  /** Exact story package that produced this text. */
  storyPackage: StoryPackageIdentity;
  /** Per-node visit count at the moment of this encounter. */
  visitNumber: number;
  selection: VisitEventSelection;
  /** Edge/bridge prose shown on entry (Batch 4.2). Null until edge prose exists. */
  bridgeId: string | null;
  /**
   * Resolved bridge prose the reader actually saw at entry — the export source of truth for the
   * edge bridge, mirroring `resolvedText` (content release #156; additive extension documented in
   * the ADR 0004 addendum). Optional and backward-compatible: it is `null` when no bridge showed
   * and absent on legacy events persisted before the field existed (all of which had no bridge),
   * so the `org.narramorph.visit-event@1.0.0` contract identity is preserved without a migration.
   */
  bridgeText?: ResolvedText | null;
  resolvedText: ResolvedText;
  /** Phase 3 reason contract, reused unchanged. Null when the encounter carried no adaptive reason. */
  reason: SelectionReason | null;
  /** Explicit reader decision at this passage, if any. */
  readerChoice: ReaderChoice | null;
  /** ISO-8601, sourced from the persisted visit timestamp — never `Date.now()` at export. */
  recordedAt: string;
}

/** Matches "<algorithm>:<lowercase-hex>", e.g. "sha256:ab12…". */
const RESOLVED_TEXT_HASH_PATTERN = /^[a-z0-9-]+:[0-9a-f]+$/;

export function isResolvedTextHash(value: unknown): value is string {
  return typeof value === 'string' && RESOLVED_TEXT_HASH_PATTERN.test(value);
}

/** Structural guard for a `ResolvedText` snapshot (used for both passage and bridge prose). */
export function isResolvedText(value: unknown): value is ResolvedText {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const resolved = value as Record<string, unknown>;
  return (
    resolved.format === 'markdown' &&
    typeof resolved.content === 'string' &&
    typeof resolved.byteLength === 'number' &&
    isResolvedTextHash(resolved.hash)
  );
}

/**
 * Structural guard for a persisted `VisitEvent`. Kept pure and dependency-free so it can validate
 * loaded data at the persistence boundary without React, Zustand, or Node crypto.
 */
export function isVisitEvent(value: unknown): value is VisitEvent {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const event = value as Record<string, unknown>;
  if (
    event.contract !== VISIT_EVENT_CONTRACT ||
    event.schemaVersion !== VISIT_EVENT_SCHEMA_VERSION
  ) {
    return false;
  }
  if (
    typeof event.sequence !== 'number' ||
    !Number.isInteger(event.sequence) ||
    event.sequence < 0
  ) {
    return false;
  }
  if (typeof event.nodeId !== 'string' || event.nodeId.length === 0) {
    return false;
  }
  if (typeof event.visitNumber !== 'number' || !Number.isInteger(event.visitNumber)) {
    return false;
  }
  if (typeof event.recordedAt !== 'string' || event.recordedAt.length === 0) {
    return false;
  }
  if (!(event.bridgeId === null || typeof event.bridgeId === 'string')) {
    return false;
  }

  const storyPackage = event.storyPackage as Record<string, unknown> | null;
  if (
    typeof storyPackage !== 'object' ||
    storyPackage === null ||
    typeof storyPackage.storyId !== 'string' ||
    typeof storyPackage.storyVersion !== 'string' ||
    typeof storyPackage.schemaVersion !== 'string' ||
    typeof storyPackage.contentHash !== 'string'
  ) {
    return false;
  }

  const selection = event.selection as Record<string, unknown> | null;
  if (
    typeof selection !== 'object' ||
    selection === null ||
    !(selection.variationId === null || typeof selection.variationId === 'string') ||
    !Array.isArray(selection.beatIds) ||
    !selection.beatIds.every((id) => typeof id === 'string')
  ) {
    return false;
  }

  if (!isResolvedText(event.resolvedText)) {
    return false;
  }

  // `bridgeText` is an optional, backward-compatible extension: absent or null means no bridge
  // prose was shown; when present it must be a well-formed resolved snapshot.
  if (
    event.bridgeText !== undefined &&
    event.bridgeText !== null &&
    !isResolvedText(event.bridgeText)
  ) {
    return false;
  }

  return true;
}
