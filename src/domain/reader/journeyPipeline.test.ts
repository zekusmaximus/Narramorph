import { describe, expect, it } from 'vitest';

import { resolveEntryBridge } from '@/domain/bridges/edgeBridge';
import { buildJourneyMarkdown } from '@/domain/export/journeyExport';
import { appendVisitEvent, buildVisitEvent } from '@/domain/progress/visitEvents';
import { resolveProseBeats } from '@/domain/variation/proseBeats';
import type {
  ConditionContext,
  Connection,
  ConnectionVisualProperties,
  StoryPackageIdentity,
  Variation,
  VisitEvent,
} from '@/types';

/**
 * Integration regression for the reader capabilities ported into Narramorph across Phases 3–4:
 * order-dependent conditions, compositional prose beats, condition-aware edge prose, the immutable
 * visit-event log, and the exact journey export. The tests are named by behavior, not by the
 * reference repository they came from. They assert that the pieces compose: a condition-selected
 * phrasing is what gets snapshotted, and the snapshot is what the export reproduces — exactly.
 */

const storyPackage: StoryPackageIdentity = {
  storyId: 'eternal-return',
  storyVersion: '1.1.0',
  schemaVersion: '1.1.0',
  contentHash: 'd596c66da6392e145872eb3a1fff3b248e88fee5b9343d2a61109ff8815a1062',
};

const metadata = {
  storyTitle: 'Eternal Return of the Digital Self',
  storyPackage,
  appVersion: '0.1.0',
  saveVersion: '1.3.0',
  exportedAt: '2026-07-16T12:00:00.000Z',
};

function context(overrides: Partial<ConditionContext> = {}): ConditionContext {
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

const beatVariation: Variation = {
  variationId: 'arch-L1-001',
  schemaVersion: '1.0.0',
  id: 'arch-L1-001',
  sectionType: 'initial_state',
  transformationState: 'initial',
  journeyPattern: 'started-stayed',
  philosophyDominant: 'accept',
  awarenessLevel: 'low',
  content: 'Whole-passage fallback.',
  metadata: {
    variationId: 'arch-L1-001',
    nodeId: 'arch-L1',
    section: 'initial_state',
    layer: 1,
    wordCount: 3,
    createdDate: '2026-07-16',
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
  proseBeats: [
    { id: 'b0', ordinal: 0, alternatives: [{ id: 'open', content: 'The archive stirs.' }] },
    {
      id: 'b1',
      ordinal: 1,
      alternatives: [
        {
          id: 'returning',
          content: 'You have walked this corridor before.',
          condition: { kind: 'visitCount', passageId: 'arch-L1', comparison: 'gte', value: 2 },
        },
        { id: 'first', content: 'The corridor is new to you.' },
      ],
    },
  ],
};

function snapshotVisit(
  sequence: number,
  nodeId: string,
  resolved: { content: string; selectedBeatIds: string[] },
): VisitEvent {
  return buildVisitEvent({
    sequence,
    nodeId,
    storyPackage,
    visitNumber: 1,
    variationId: 'arch-L1-001',
    selectedBeatIds: resolved.selectedBeatIds,
    bridgeId: null,
    content: resolved.content,
    reason: null,
    readerChoice: null,
    recordedAt: '2026-07-16T00:00:00.000Z',
  });
}

describe('experienced-journey reader pipeline', () => {
  it('exports the exact condition-selected phrasing the reader saw, in order', () => {
    // First visit: the unconditional beat is selected.
    const firstResolved = resolveProseBeats(
      beatVariation,
      context({ visitCounts: { 'arch-L1': 1 } }),
    );
    expect(firstResolved.content).toBe('The archive stirs.\n\nThe corridor is new to you.');

    let log: VisitEvent[] = [];
    log = appendVisitEvent(log, snapshotVisit(0, 'arch-L1', firstResolved));

    const markdown = buildJourneyMarkdown(log, metadata);
    // The export reproduces exactly the beats that were resolved and snapshotted.
    expect(markdown).toContain('The archive stirs.\n\nThe corridor is new to you.');
  });

  it('reproduces a revisit with different order-dependent phrasing without rewriting the earlier visit', () => {
    const firstResolved = resolveProseBeats(
      beatVariation,
      context({ visitCounts: { 'arch-L1': 1 } }),
    );
    const returnResolved = resolveProseBeats(
      beatVariation,
      context({ visitCounts: { 'arch-L1': 2 } }),
    );
    expect(returnResolved.content).toBe(
      'The archive stirs.\n\nYou have walked this corridor before.',
    );

    let log: VisitEvent[] = [];
    log = appendVisitEvent(log, snapshotVisit(0, 'arch-L1', firstResolved));
    log = appendVisitEvent(log, snapshotVisit(3, 'arch-L1', returnResolved));

    const markdown = buildJourneyMarkdown(log, metadata);
    // Both distinct phrasings survive in experienced order; the first is not overwritten.
    const firstIndex = markdown.indexOf('The corridor is new to you.');
    const returnIndex = markdown.indexOf('You have walked this corridor before.');
    expect(firstIndex).toBeGreaterThan(-1);
    expect(returnIndex).toBeGreaterThan(firstIndex);
  });

  it('resolves condition-aware edge prose for the traversal the reader actually crossed', () => {
    const visualProperties = {} as ConnectionVisualProperties;
    const connection: Connection = {
      id: 'arch-to-algo',
      sourceId: 'arch-L1',
      targetId: 'algo-L1',
      type: 'temporal',
      bidirectional: false,
      visualProperties,
      bridge: {
        alternatives: [{ id: 'bridge-1', content: 'From the archive into the engine.' }],
      },
    };
    const connections = new Map<string, Connection>([[connection.id, connection]]);

    const resolved = resolveEntryBridge(connections, 'arch-L1', 'algo-L1', context());
    expect(resolved).toEqual({
      bridgeId: 'bridge-1',
      content: 'From the archive into the engine.',
    });
    // No crossed edge -> no bridge.
    expect(resolveEntryBridge(connections, null, 'algo-L1', context())).toBeNull();
  });

  it('keeps beat resolution deterministic across the pipeline', () => {
    const ctx = context({ visitCounts: { 'arch-L1': 2 } });
    expect(resolveProseBeats(beatVariation, ctx)).toEqual(resolveProseBeats(beatVariation, ctx));
  });
});
