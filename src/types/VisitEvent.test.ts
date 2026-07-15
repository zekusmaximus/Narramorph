import { describe, expect, it } from 'vitest';

import {
  VISIT_EVENT_CONTRACT,
  VISIT_EVENT_SCHEMA_VERSION,
  isResolvedTextHash,
  isVisitEvent,
  type VisitEvent,
} from './VisitEvent';

/**
 * These tests lock the ADR 0004 `VisitEvent` record shape before Batch 4.1 writes selected-beat
 * history into it. They are structural: they prove the contract identity, the required fields, and
 * the guard that will validate persisted data at the save boundary in Batch 4.3.
 */

function makeValidEvent(overrides: Partial<VisitEvent> = {}): VisitEvent {
  return {
    contract: VISIT_EVENT_CONTRACT,
    schemaVersion: VISIT_EVENT_SCHEMA_VERSION,
    sequence: 0,
    nodeId: 'arch-L1',
    storyPackage: {
      storyId: 'eternal-return',
      storyVersion: '1.1.0',
      schemaVersion: '1.1.0',
      contentHash: 'd596c66da6392e145872eb3a1fff3b248e88fee5b9343d2a61109ff8815a1062',
    },
    visitNumber: 1,
    selection: {
      variationId: 'spv1_var_000000000000000000000001',
      beatIds: [],
      fragmentLabel: undefined,
    },
    bridgeId: null,
    resolvedText: {
      format: 'markdown',
      content: '# Opening\n\nThe archive remembers.',
      hash: 'sha256:0000000000000000000000000000000000000000000000000000000000000000',
      byteLength: 33,
    },
    reason: null,
    readerChoice: null,
    recordedAt: '2026-07-15T00:00:00.000Z',
    ...overrides,
  };
}

describe('VisitEvent contract identity', () => {
  it('pins the contract and schema version', () => {
    expect(VISIT_EVENT_CONTRACT).toBe('org.narramorph.visit-event');
    expect(VISIT_EVENT_SCHEMA_VERSION).toBe('1.0.0');
  });
});

describe('isResolvedTextHash', () => {
  it('accepts "<algorithm>:<lowercase-hex>" digests', () => {
    expect(isResolvedTextHash('sha256:abc123')).toBe(true);
    expect(isResolvedTextHash('sha256:' + '0'.repeat(64))).toBe(true);
  });

  it('rejects malformed or non-hex digests', () => {
    expect(isResolvedTextHash('sha256:ABC')).toBe(false); // uppercase hex
    expect(isResolvedTextHash('deadbeef')).toBe(false); // missing algorithm
    expect(isResolvedTextHash('sha256:')).toBe(false); // empty hex
    expect(isResolvedTextHash(42)).toBe(false);
  });
});

describe('isVisitEvent guard', () => {
  it('accepts a fully-formed event', () => {
    expect(isVisitEvent(makeValidEvent())).toBe(true);
  });

  it('accepts beats and a bridge once later batches populate them', () => {
    const withBeats = makeValidEvent({
      selection: {
        variationId: 'spv1_var_000000000000000000000001',
        beatIds: ['spv1_bet_000000000000000000000001', 'spv1_bet_000000000000000000000002'],
      },
      bridgeId: 'spv1_edg_000000000000000000000009',
    });
    expect(isVisitEvent(withBeats)).toBe(true);
  });

  it('rejects a foreign or missing contract', () => {
    expect(isVisitEvent(makeValidEvent({ contract: 'org.other.thing' as never }))).toBe(false);
    expect(isVisitEvent({ ...makeValidEvent(), contract: undefined })).toBe(false);
  });

  it('rejects a non-integer or negative sequence', () => {
    expect(isVisitEvent(makeValidEvent({ sequence: -1 }))).toBe(false);
    expect(isVisitEvent(makeValidEvent({ sequence: 1.5 }))).toBe(false);
  });

  it('requires a resolved-text snapshot with a valid integrity hash', () => {
    const badHash = makeValidEvent();
    badHash.resolvedText = { ...badHash.resolvedText, hash: 'not-a-hash' };
    expect(isVisitEvent(badHash)).toBe(false);

    const badFormat = makeValidEvent();
    (badFormat.resolvedText as { format: string }).format = 'html';
    expect(isVisitEvent(badFormat)).toBe(false);
  });

  it('requires a full story-package identity', () => {
    const event = makeValidEvent();
    (event as { storyPackage: unknown }).storyPackage = { storyId: 'eternal-return' };
    expect(isVisitEvent(event)).toBe(false);
  });

  it('requires beatIds to be an array of strings', () => {
    const event = makeValidEvent();
    (event.selection as { beatIds: unknown }).beatIds = 'spv1_bet_1';
    expect(isVisitEvent(event)).toBe(false);
  });

  it('allows a null bridge but rejects a non-string bridge', () => {
    expect(isVisitEvent(makeValidEvent({ bridgeId: null }))).toBe(true);
    expect(isVisitEvent(makeValidEvent({ bridgeId: 123 as never }))).toBe(false);
  });

  it('rejects non-objects', () => {
    expect(isVisitEvent(null)).toBe(false);
    expect(isVisitEvent('event')).toBe(false);
    expect(isVisitEvent(undefined)).toBe(false);
  });
});
