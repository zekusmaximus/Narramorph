import { describe, expect, it } from 'vitest';

import type { ConditionContext, ProseBeat, Variation } from '@/types';

import { DEFAULT_BEAT_JOINER, resolveProseBeats } from './proseBeats';

function makeContext(overrides: Partial<ConditionContext> = {}): ConditionContext {
  return {
    nodeId: 'arch-L1',
    awareness: 40,
    journeyPattern: 'started-stayed',
    pathPhilosophy: 'accept',
    visitCount: 1,
    transformationState: 'initial',
    characterVisitPercentages: { archaeologist: 100, algorithm: 0, lastHuman: 0 },
    readingPath: ['arch-L1'],
    visitCounts: { 'arch-L1': 1 },
    startingCharacter: 'archaeologist',
    ...overrides,
  };
}

function makeVariation(overrides: Partial<Variation> = {}): Variation {
  return {
    variationId: 'arch-L1-001',
    schemaVersion: '1.0.0',
    id: 'arch-L1-001',
    sectionType: 'initial_state',
    transformationState: 'initial',
    journeyPattern: 'started-stayed',
    philosophyDominant: 'accept',
    awarenessLevel: 'low',
    content: '# Opening\n\nThe archive remembers.',
    metadata: {
      variationId: 'arch-L1-001',
      nodeId: 'arch-L1',
      section: 'initial_state',
      layer: 1,
      wordCount: 5,
      createdDate: '2026-07-15',
      journeyPattern: 'started-stayed',
      journeyCode: 'ss',
      philosophyDominant: 'accept',
      philosophyCode: 'a',
      awarenessLevel: 'low',
      awarenessCode: 'l',
      awarenessRange: [0, 34],
      readableLabel: 'Opening',
      humanDescription: 'Opening passage',
    },
    ...overrides,
  };
}

describe('resolveProseBeats identity path', () => {
  it('returns content byte-for-byte unchanged when there are no beats', () => {
    const variation = makeVariation({ content: 'Exact prose — untouched.\n\nSecond paragraph.' });
    const resolved = resolveProseBeats(variation, makeContext());
    expect(resolved.content).toBe('Exact prose — untouched.\n\nSecond paragraph.');
    expect(resolved.selectedBeatIds).toEqual([]);
  });

  it('treats an empty beats array as the identity path', () => {
    const variation = makeVariation({ proseBeats: [] });
    const resolved = resolveProseBeats(variation, makeContext());
    expect(resolved.content).toBe(variation.content);
    expect(resolved.selectedBeatIds).toEqual([]);
  });
});

describe('resolveProseBeats composition', () => {
  it('composes beats in ascending ordinal order regardless of declared order', () => {
    const beats: ProseBeat[] = [
      { id: 'b2', ordinal: 1, alternatives: [{ id: 'b2a', content: 'Second.' }] },
      { id: 'b0', ordinal: 0, alternatives: [{ id: 'b0a', content: 'First.' }] },
    ];
    const resolved = resolveProseBeats(makeVariation({ proseBeats: beats }), makeContext());
    expect(resolved.content).toBe(`First.${DEFAULT_BEAT_JOINER}Second.`);
    expect(resolved.selectedBeatIds).toEqual(['b0a', 'b2a']);
  });

  it('honors a custom beat joiner', () => {
    const beats: ProseBeat[] = [
      { id: 'b0', ordinal: 0, alternatives: [{ id: 'b0a', content: 'A' }] },
      { id: 'b1', ordinal: 1, alternatives: [{ id: 'b1a', content: 'B' }] },
    ];
    const resolved = resolveProseBeats(
      makeVariation({ proseBeats: beats, beatJoiner: ' ' }),
      makeContext(),
    );
    expect(resolved.content).toBe('A B');
  });
});

describe('resolveProseBeats alternative selection', () => {
  const conditionalBeat: ProseBeat = {
    id: 'b0',
    ordinal: 0,
    alternatives: [
      {
        id: 'returning',
        content: 'You return.',
        condition: { kind: 'visitCount', passageId: 'arch-L1', comparison: 'gte', value: 2 },
      },
      { id: 'first', content: 'You arrive.' },
    ],
  };

  it('selects the first qualifying alternative in author order', () => {
    const resolved = resolveProseBeats(
      makeVariation({ proseBeats: [conditionalBeat] }),
      makeContext({ visitCounts: { 'arch-L1': 3 } }),
    );
    expect(resolved.content).toBe('You return.');
    expect(resolved.selectedBeatIds).toEqual(['returning']);
  });

  it('falls back to the unconditional alternative when the condition does not match', () => {
    const resolved = resolveProseBeats(
      makeVariation({ proseBeats: [conditionalBeat] }),
      makeContext({ visitCounts: { 'arch-L1': 1 } }),
    );
    expect(resolved.content).toBe('You arrive.');
    expect(resolved.selectedBeatIds).toEqual(['first']);
  });

  it('prefers the highest priority among qualifying alternatives', () => {
    const beat: ProseBeat = {
      id: 'b0',
      ordinal: 0,
      alternatives: [
        { id: 'low', content: 'low', priority: 1 },
        { id: 'high', content: 'high', priority: 5 },
      ],
    };
    const resolved = resolveProseBeats(makeVariation({ proseBeats: [beat] }), makeContext());
    expect(resolved.content).toBe('high');
    expect(resolved.selectedBeatIds).toEqual(['high']);
  });

  it('breaks priority ties toward the earliest authored alternative', () => {
    const beat: ProseBeat = {
      id: 'b0',
      ordinal: 0,
      alternatives: [
        { id: 'earlier', content: 'earlier', priority: 2 },
        { id: 'later', content: 'later', priority: 2 },
      ],
    };
    const resolved = resolveProseBeats(makeVariation({ proseBeats: [beat] }), makeContext());
    expect(resolved.selectedBeatIds).toEqual(['earlier']);
  });
});

describe('resolveProseBeats omission and fallback', () => {
  const unmatched = {
    id: 'only',
    content: 'conditional',
    condition: {
      kind: 'visitCount' as const,
      passageId: 'arch-L1',
      comparison: 'gte' as const,
      value: 9,
    },
  };

  it('omits a beat with no qualifying alternative when omitWhenUnmatched is set', () => {
    const beats: ProseBeat[] = [
      { id: 'b0', ordinal: 0, alternatives: [{ id: 'kept', content: 'kept' }] },
      { id: 'b1', ordinal: 1, alternatives: [unmatched], omitWhenUnmatched: true },
    ];
    const resolved = resolveProseBeats(makeVariation({ proseBeats: beats }), makeContext());
    expect(resolved.content).toBe('kept');
    expect(resolved.selectedBeatIds).toEqual(['kept']);
  });

  it('uses the deterministic fallback when a beat cannot be matched and omission is off', () => {
    const beats: ProseBeat[] = [{ id: 'b1', ordinal: 0, alternatives: [unmatched] }];
    const resolved = resolveProseBeats(makeVariation({ proseBeats: beats }), makeContext());
    expect(resolved.content).toBe('conditional');
    expect(resolved.selectedBeatIds).toEqual(['only']);
  });
});

describe('resolveProseBeats determinism', () => {
  it('produces identical output for identical inputs', () => {
    const beats: ProseBeat[] = [
      {
        id: 'b0',
        ordinal: 0,
        alternatives: [
          {
            id: 'returning',
            content: 'again',
            condition: { kind: 'visitCount', passageId: 'arch-L1', comparison: 'gte', value: 2 },
          },
          { id: 'first', content: 'first' },
        ],
      },
    ];
    const variation = makeVariation({ proseBeats: beats });
    const context = makeContext({ visitCounts: { 'arch-L1': 4 } });
    const a = resolveProseBeats(variation, context);
    const b = resolveProseBeats(variation, context);
    expect(a).toEqual(b);
  });
});
