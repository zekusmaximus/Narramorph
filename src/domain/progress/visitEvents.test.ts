import { describe, expect, it } from 'vitest';

import type { SelectionReason, StoryPackageIdentity, VisitEvent } from '@/types';
import { isVisitEvent } from '@/types';

import {
  VISIT_EVENT_LOG_LIMITS,
  appendVisitEvent,
  buildVisitEvent,
  type VisitEventInput,
} from './visitEvents';

const storyPackage: StoryPackageIdentity = {
  storyId: 'eternal-return',
  storyVersion: '1.1.0',
  schemaVersion: '1.1.0',
  contentHash: 'd596c66da6392e145872eb3a1fff3b248e88fee5b9343d2a61109ff8815a1062',
};

const reason: SelectionReason = {
  contract: 'org.narramorph.selection-reason',
  schemaVersion: '1.0.0',
  selectionKind: 'passage-variation',
  outcome: 'exact',
  templateKey: 'selection.first_visit',
  parameters: {},
  triggers: [],
};

function makeInput(overrides: Partial<VisitEventInput> = {}): VisitEventInput {
  return {
    sequence: 0,
    nodeId: 'arch-L1',
    storyPackage,
    visitNumber: 1,
    variationId: 'arch-L1-001',
    selectedBeatIds: [],
    bridgeId: null,
    content: '# Opening\n\nThe archive remembers.',
    reason,
    readerChoice: null,
    recordedAt: '2026-07-16T00:00:00.000Z',
    ...overrides,
  };
}

describe('buildVisitEvent', () => {
  it('produces a valid, guard-passing event with a sha256 resolved-text hash', () => {
    const event = buildVisitEvent(makeInput());
    expect(isVisitEvent(event)).toBe(true);
    expect(event.resolvedText.hash).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(event.resolvedText.content).toBe('# Opening\n\nThe archive remembers.');
    expect(event.resolvedText.byteLength).toBe(
      new TextEncoder().encode('# Opening\n\nThe archive remembers.').length,
    );
  });

  it('carries selected beats, a bridge, and a reader choice into the locked shape', () => {
    const event = buildVisitEvent(
      makeInput({
        selectedBeatIds: ['b0a', 'b1a'],
        bridgeId: 'edge-1',
        fragmentLabel: 'conv',
        readerChoice: { kind: 'ending', value: 'Preserve the Pattern' },
      }),
    );
    expect(event.selection.beatIds).toEqual(['b0a', 'b1a']);
    expect(event.selection.fragmentLabel).toBe('conv');
    expect(event.bridgeId).toBe('edge-1');
    expect(event.readerChoice).toEqual({ kind: 'ending', value: 'Preserve the Pattern' });
  });

  it('hashes different resolved prose to different digests', () => {
    const a = buildVisitEvent(makeInput({ content: 'first' }));
    const b = buildVisitEvent(makeInput({ content: 'second' }));
    expect(a.resolvedText.hash).not.toBe(b.resolvedText.hash);
  });

  it('snapshots resolved bridge prose into bridgeText, or null when no bridge showed', () => {
    const withBridge = buildVisitEvent(
      makeInput({ bridgeId: 'edge-1', bridgeContent: 'You cross into the Algorithm.' }),
    );
    expect(withBridge.bridgeText).toEqual({
      format: 'markdown',
      content: 'You cross into the Algorithm.',
      hash: expect.stringMatching(/^sha256:[0-9a-f]{64}$/),
      byteLength: 29,
    });
    expect(isVisitEvent(withBridge)).toBe(true);

    const withoutBridge = buildVisitEvent(makeInput());
    expect(withoutBridge.bridgeText).toBeNull();
    expect(isVisitEvent(withoutBridge)).toBe(true);
  });
});

describe('appendVisitEvent', () => {
  const base = buildVisitEvent(makeInput());

  it('appends a fresh event without mutating the input array', () => {
    const events: VisitEvent[] = [];
    const next = appendVisitEvent(events, base);
    expect(next).toHaveLength(1);
    expect(events).toHaveLength(0);
  });

  it('is idempotent on the (sequence, nodeId, fragmentLabel) triple', () => {
    const once = appendVisitEvent([], base);
    const twice = appendVisitEvent(once, buildVisitEvent(makeInput()));
    expect(twice).toBe(once);
  });

  it('keeps distinct L3 fragments at the same sequence', () => {
    const arch = buildVisitEvent(makeInput({ fragmentLabel: 'arch' }));
    const algo = buildVisitEvent(makeInput({ fragmentLabel: 'algo' }));
    const log = appendVisitEvent(appendVisitEvent([], arch), algo);
    expect(log).toHaveLength(2);
  });

  it('drops the oldest events when the count limit is exceeded', () => {
    let log: VisitEvent[] = [];
    for (let i = 0; i < 5; i++) {
      log = appendVisitEvent(log, buildVisitEvent(makeInput({ sequence: i })), {
        maxEvents: 3,
        maxTotalResolvedBytes: VISIT_EVENT_LOG_LIMITS.maxTotalResolvedBytes,
      });
    }
    expect(log).toHaveLength(3);
    expect(log.map((event) => event.sequence)).toEqual([2, 3, 4]);
  });

  it('drops the oldest events when the total resolved-byte budget is exceeded', () => {
    const big = 'x'.repeat(1000);
    let log: VisitEvent[] = [];
    for (let i = 0; i < 5; i++) {
      log = appendVisitEvent(log, buildVisitEvent(makeInput({ sequence: i, content: big })), {
        maxEvents: 1000,
        maxTotalResolvedBytes: 2500,
      });
    }
    // Each event is ~1000 bytes; a 2500-byte budget keeps only the two newest.
    expect(log.map((event) => event.sequence)).toEqual([3, 4]);
  });
});
