import type { ReaderChoice, SelectionReason, StoryPackageIdentity, VisitEvent } from '@/types';
import { VISIT_EVENT_CONTRACT, VISIT_EVENT_SCHEMA_VERSION } from '@/types';

import { sha256Hex } from '../hash/sha256';

/**
 * Bounds on the local visit-event log so a single device's history cannot grow without limit. A
 * complete L1→L4 journey produces on the order of tens of events; these caps only engage under
 * pathological revisiting. When a cap is reached the oldest events are dropped, so their resolved
 * snapshots can no longer be exported — the export surfaces that gap rather than reconstructing it.
 */
export const VISIT_EVENT_LOG_LIMITS = {
  maxEvents: 1000,
  maxTotalResolvedBytes: 2_000_000,
} as const;

export interface VisitEventInput {
  sequence: number;
  nodeId: string;
  storyPackage: StoryPackageIdentity;
  visitNumber: number;
  variationId: string | null;
  selectedBeatIds: string[];
  fragmentLabel?: string;
  bridgeId: string | null;
  /** The exact resolved bridge Markdown the reader saw at entry, or null when no bridge showed. */
  bridgeContent?: string | null;
  /** The exact resolved Markdown the reader saw. */
  content: string;
  reason: SelectionReason | null;
  readerChoice: ReaderChoice | null;
  /** ISO-8601 timestamp taken from the persisted visit, never `Date.now()`. */
  recordedAt: string;
}

function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

/** Builds an immutable `VisitEvent` that snapshots the resolved prose the reader saw. */
export function buildVisitEvent(input: VisitEventInput): VisitEvent {
  return {
    contract: VISIT_EVENT_CONTRACT,
    schemaVersion: VISIT_EVENT_SCHEMA_VERSION,
    sequence: input.sequence,
    nodeId: input.nodeId,
    storyPackage: { ...input.storyPackage },
    visitNumber: input.visitNumber,
    selection: {
      variationId: input.variationId,
      beatIds: [...input.selectedBeatIds],
      ...(input.fragmentLabel ? { fragmentLabel: input.fragmentLabel } : {}),
    },
    bridgeId: input.bridgeId,
    bridgeText:
      input.bridgeContent == null
        ? null
        : {
            format: 'markdown',
            content: input.bridgeContent,
            hash: `sha256:${sha256Hex(input.bridgeContent)}`,
            byteLength: utf8ByteLength(input.bridgeContent),
          },
    resolvedText: {
      format: 'markdown',
      content: input.content,
      hash: `sha256:${sha256Hex(input.content)}`,
      byteLength: utf8ByteLength(input.content),
    },
    reason: input.reason,
    readerChoice: input.readerChoice,
    recordedAt: input.recordedAt,
  };
}

function isSameEncounter(a: VisitEvent, b: VisitEvent): boolean {
  return (
    a.sequence === b.sequence &&
    a.nodeId === b.nodeId &&
    (a.selection.fragmentLabel ?? null) === (b.selection.fragmentLabel ?? null)
  );
}

/**
 * Appends a visit event once. The (sequence, nodeId, fragmentLabel) triple is the idempotency
 * boundary — matching `selectionRecords` — so React Strict Mode remounts cannot double-log. When
 * the log exceeds `VISIT_EVENT_LOG_LIMITS`, the oldest events are dropped to stay within bounds.
 */
export function appendVisitEvent(
  events: VisitEvent[],
  next: VisitEvent,
  limits: { maxEvents: number; maxTotalResolvedBytes: number } = VISIT_EVENT_LOG_LIMITS,
): VisitEvent[] {
  if (events.some((event) => isSameEncounter(event, next))) {
    return events;
  }

  let result = [...events, next];

  while (result.length > limits.maxEvents) {
    result = result.slice(1);
  }

  let totalBytes = result.reduce((sum, event) => sum + event.resolvedText.byteLength, 0);
  while (result.length > 1 && totalBytes > limits.maxTotalResolvedBytes) {
    const dropped = result[0];
    if (!dropped) {
      break;
    }
    totalBytes -= dropped.resolvedText.byteLength;
    result = result.slice(1);
  }

  return result;
}
