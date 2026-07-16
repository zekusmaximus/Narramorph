import { describe, expect, it } from 'vitest';

import type { ConditionContext, Connection, ConnectionVisualProperties } from '@/types';

import {
  EDGE_BRIDGE_LIMITS,
  resolveEdgeBridge,
  resolveEntryBridge,
  validateEdgeBridges,
} from './edgeBridge';

function makeContext(overrides: Partial<ConditionContext> = {}): ConditionContext {
  return {
    nodeId: 'algo-L1',
    awareness: 40,
    journeyPattern: 'started-stayed',
    pathPhilosophy: 'accept',
    visitCount: 1,
    transformationState: 'initial',
    characterVisitPercentages: { archaeologist: 50, algorithm: 50, lastHuman: 0 },
    readingPath: ['arch-L1', 'algo-L1'],
    visitCounts: { 'arch-L1': 1, 'algo-L1': 1 },
    startingCharacter: 'archaeologist',
    ...overrides,
  };
}

const visualProperties = {} as ConnectionVisualProperties;

function makeConnection(overrides: Partial<Connection> = {}): Connection {
  return {
    id: 'arch-to-algo',
    sourceId: 'arch-L1',
    targetId: 'algo-L1',
    type: 'temporal',
    bidirectional: false,
    visualProperties,
    ...overrides,
  };
}

describe('resolveEdgeBridge', () => {
  it('returns null when there is no bridge', () => {
    expect(resolveEdgeBridge(undefined, makeContext())).toBeNull();
  });

  it('selects the first qualifying alternative in author order', () => {
    const resolved = resolveEdgeBridge(
      {
        alternatives: [
          {
            id: 'returning',
            content: 'You cross again.',
            condition: { kind: 'visitCount', passageId: 'arch-L1', comparison: 'gte', value: 2 },
          },
          { id: 'first', content: 'You cross for the first time.' },
        ],
      },
      makeContext(),
    );
    expect(resolved).toEqual({ bridgeId: 'first', content: 'You cross for the first time.' });
  });

  it('prefers the highest priority among qualifying alternatives, ties to author order', () => {
    const resolved = resolveEdgeBridge(
      {
        alternatives: [
          { id: 'a', content: 'a', priority: 2 },
          { id: 'b', content: 'b', priority: 2 },
          { id: 'c', content: 'c', priority: 5 },
        ],
      },
      makeContext(),
    );
    expect(resolved?.bridgeId).toBe('c');
  });

  it('omits when nothing qualifies and omitWhenUnmatched is set', () => {
    const resolved = resolveEdgeBridge(
      {
        omitWhenUnmatched: true,
        alternatives: [
          {
            id: 'only',
            content: 'never',
            condition: { kind: 'visitCount', passageId: 'arch-L1', comparison: 'gte', value: 9 },
          },
        ],
      },
      makeContext(),
    );
    expect(resolved).toBeNull();
  });

  it('uses the deterministic fallback when nothing qualifies and omission is off', () => {
    const resolved = resolveEdgeBridge(
      {
        alternatives: [
          {
            id: 'only',
            content: 'fallback prose',
            condition: { kind: 'visitCount', passageId: 'arch-L1', comparison: 'gte', value: 9 },
          },
        ],
      },
      makeContext(),
    );
    expect(resolved).toEqual({ bridgeId: 'only', content: 'fallback prose' });
  });

  it('is deterministic for identical inputs', () => {
    const bridge = {
      alternatives: [
        {
          id: 'returning',
          content: 'again',
          condition: {
            kind: 'visitCount' as const,
            passageId: 'arch-L1',
            comparison: 'gte' as const,
            value: 1,
          },
        },
        { id: 'first', content: 'first' },
      ],
    };
    const context = makeContext();
    expect(resolveEdgeBridge(bridge, context)).toEqual(resolveEdgeBridge(bridge, context));
  });
});

describe('resolveEntryBridge', () => {
  const bridged = makeConnection({
    bridge: { alternatives: [{ id: 'b1', content: 'Between archive and engine.' }] },
  });
  const connections = new Map<string, Connection>([[bridged.id, bridged]]);

  it('returns null when there is no crossed edge', () => {
    expect(resolveEntryBridge(connections, null, 'algo-L1', makeContext())).toBeNull();
  });

  it('resolves the bridge for a forward edge', () => {
    const resolved = resolveEntryBridge(connections, 'arch-L1', 'algo-L1', makeContext());
    expect(resolved).toEqual({ bridgeId: 'b1', content: 'Between archive and engine.' });
  });

  it('does not match a forward edge in reverse when the connection is one-way', () => {
    expect(resolveEntryBridge(connections, 'algo-L1', 'arch-L1', makeContext())).toBeNull();
  });

  it('matches a bidirectional connection in reverse', () => {
    const twoWay = makeConnection({
      id: 'two-way',
      bidirectional: true,
      bridge: { alternatives: [{ id: 'rev', content: 'Back across.' }] },
    });
    const map = new Map<string, Connection>([[twoWay.id, twoWay]]);
    const resolved = resolveEntryBridge(map, 'algo-L1', 'arch-L1', makeContext());
    expect(resolved?.bridgeId).toBe('rev');
  });

  it('returns null when the matching connection has no bridge', () => {
    const plain = makeConnection({ id: 'plain' });
    const map = new Map<string, Connection>([[plain.id, plain]]);
    expect(resolveEntryBridge(map, 'arch-L1', 'algo-L1', makeContext())).toBeNull();
  });
});

describe('validateEdgeBridges', () => {
  it('accepts connections without bridges and bridges within limits', () => {
    const issues = validateEdgeBridges([
      makeConnection(),
      makeConnection({
        id: 'ok',
        bridge: { alternatives: [{ id: 'a', content: 'short' }] },
      }),
    ]);
    expect(issues).toEqual([]);
  });

  it('flags a bridge with too many alternatives', () => {
    const alternatives = Array.from(
      { length: EDGE_BRIDGE_LIMITS.maxAlternativesPerEdge + 1 },
      (_unused, index) => ({ id: `a${index}`, content: 'x' }),
    );
    const issues = validateEdgeBridges([
      makeConnection({ id: 'too-many', bridge: { alternatives } }),
    ]);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.connectionId).toBe('too-many');
  });

  it('flags a bridge fragment that exceeds the length limit', () => {
    const issues = validateEdgeBridges([
      makeConnection({
        id: 'too-long',
        bridge: {
          alternatives: [{ id: 'a', content: 'x'.repeat(EDGE_BRIDGE_LIMITS.maxContentLength + 1) }],
        },
      }),
    ]);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toContain('the limit is');
  });

  it('flags a bridge with no alternatives', () => {
    const issues = validateEdgeBridges([
      makeConnection({ id: 'empty', bridge: { alternatives: [] } }),
    ]);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toContain('no alternatives');
  });
});
