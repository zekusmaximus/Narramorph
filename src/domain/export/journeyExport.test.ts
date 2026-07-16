import { describe, expect, it } from 'vitest';

import { buildVisitEvent } from '@/domain/progress/visitEvents';
import type { SelectionReason, SelectionRecord, StoryPackageIdentity, VisitEvent } from '@/types';
import { isVisitEvent } from '@/types';

import {
  JOURNEY_EXPORT_LICENSE_NOTICE,
  buildJourneyMarkdown,
  buildJourneyPrintHtml,
  buildJourneyTitleMap,
  encounterKey,
  journeyExportFilename,
  markdownToHtml,
  orderedVisitEvents,
} from './journeyExport';

const storyPackage: StoryPackageIdentity = {
  storyId: 'eternal-return',
  storyVersion: '1.1.0',
  schemaVersion: '1.1.0',
  contentHash: 'd596c66da6392e145872eb3a1fff3b248e88fee5b9343d2a61109ff8815a1062',
};

const metadata = {
  storyTitle: 'Eternal Return of the Digital Self',
  author: 'Narramorph Fiction',
  storyPackage,
  appVersion: '0.1.0',
  saveVersion: '1.3.0',
  exportedAt: '2026-07-16T12:00:00.000Z',
};

function reason(
  templateKey: SelectionReason['templateKey'] = 'selection.first_visit',
): SelectionReason {
  return {
    contract: 'org.narramorph.selection-reason',
    schemaVersion: '1.0.0',
    selectionKind: 'passage-variation',
    outcome: 'exact',
    templateKey,
    parameters: {},
    triggers: [],
  };
}

function event(overrides: {
  sequence: number;
  nodeId: string;
  content: string;
  visitNumber?: number;
  variationId?: string | null;
  beatIds?: string[];
  bridgeId?: string | null;
  bridgeContent?: string | null;
  fragmentLabel?: string;
  readerChoice?: VisitEvent['readerChoice'];
  withReason?: boolean;
}): VisitEvent {
  return buildVisitEvent({
    sequence: overrides.sequence,
    nodeId: overrides.nodeId,
    storyPackage,
    visitNumber: overrides.visitNumber ?? 1,
    variationId: overrides.variationId ?? `${overrides.nodeId}-v1`,
    selectedBeatIds: overrides.beatIds ?? [],
    ...(overrides.fragmentLabel ? { fragmentLabel: overrides.fragmentLabel } : {}),
    bridgeId: overrides.bridgeId ?? null,
    bridgeContent: overrides.bridgeContent ?? null,
    content: overrides.content,
    reason: overrides.withReason === false ? null : reason(),
    readerChoice: overrides.readerChoice ?? null,
    recordedAt: '2026-07-16T00:00:00.000Z',
  });
}

describe('orderedVisitEvents', () => {
  it('orders by sequence and keeps array order for equal sequences (L3 fragments)', () => {
    const events = [
      event({ sequence: 2, nodeId: 'arch-L1', content: 'third' }),
      event({ sequence: 1, nodeId: 'conv-L3', content: 'arch section', fragmentLabel: 'arch' }),
      event({ sequence: 1, nodeId: 'conv-L3', content: 'algo section', fragmentLabel: 'algo' }),
    ];
    const ordered = orderedVisitEvents(events);
    expect(ordered.map((e) => e.resolvedText.content)).toEqual([
      'arch section',
      'algo section',
      'third',
    ]);
  });
});

describe('buildJourneyMarkdown', () => {
  const events = [
    event({ sequence: 0, nodeId: 'arch-L1', content: 'The archive remembers.' }),
    event({ sequence: 1, nodeId: 'algo-L1', content: 'Seven processes examine.', visitNumber: 1 }),
  ];

  it('includes a title page, license notice, and passages in order', () => {
    const md = buildJourneyMarkdown(events, metadata);
    expect(md).toContain('# Eternal Return of the Digital Self — your journey');
    expect(md).toContain('Passages experienced: 2');
    expect(md).toContain('Story package: eternal-return@1.1.0');
    expect(md).toContain('The archive remembers.');
    expect(md).toContain('Seven processes examine.');
    expect(md.indexOf('The archive remembers.')).toBeLessThan(
      md.indexOf('Seven processes examine.'),
    );
    expect(md).toContain(JOURNEY_EXPORT_LICENSE_NOTICE);
  });

  it('is deterministic: identical inputs produce byte-identical output', () => {
    expect(buildJourneyMarkdown(events, metadata)).toBe(buildJourneyMarkdown(events, metadata));
  });

  it('re-exports a saved journey byte-identically after a save/reopen round-trip', () => {
    const journey = [
      event({ sequence: 0, nodeId: 'arch-L1', content: 'The archive remembers.', beatIds: ['b0'] }),
      event({
        sequence: 1,
        nodeId: 'algo-L2-invest',
        content: 'Seven processes examine.',
        bridgeId: 'algo-L1__algo-L2-invest__from-archaeologist',
        bridgeContent:
          "You cross from the archaeologist's careful hands into the Algorithm's arithmetic — the same fragment, counted differently.",
      }),
    ];
    const before = buildJourneyMarkdown(journey, metadata);

    // Simulate persistence: the visit-event log is serialized on save and rehydrated on reopen.
    const rehydrated = JSON.parse(JSON.stringify(journey)) as VisitEvent[];
    expect(rehydrated.every(isVisitEvent)).toBe(true);
    expect(rehydrated[1]?.bridgeText?.content).toBe(journey[1]?.bridgeText?.content);

    // Export reads only the stored snapshots, so a reopened journey re-exports byte-for-byte.
    expect(buildJourneyMarkdown(rehydrated, metadata)).toBe(before);
  });

  it('renders the resolved bridge prose as a blockquote before its passage', () => {
    const withBridge = [
      event({ sequence: 0, nodeId: 'arch-L1', content: 'The archive remembers.' }),
      event({
        sequence: 1,
        nodeId: 'algo-L2-invest',
        content: 'Seven processes examine.',
        bridgeId: 'edge-1',
        bridgeContent: 'You cross into the Algorithm’s arithmetic.',
      }),
    ];
    const md = buildJourneyMarkdown(withBridge, metadata);
    expect(md).toContain('> You cross into the Algorithm’s arithmetic.');
    // The bridge precedes the passage prose it introduced.
    expect(md.indexOf('> You cross into the Algorithm')).toBeLessThan(
      md.indexOf('Seven processes examine.'),
    );

    const html = buildJourneyPrintHtml(withBridge, metadata);
    expect(html).toContain(
      '<blockquote class="passage-transition" role="note" aria-label="Passage transition">',
    );
    expect(html).toContain('You cross into the Algorithm');
  });

  it('emits ordinal passage labels and no internal IDs by default', () => {
    const md = buildJourneyMarkdown(events, metadata);
    expect(md).toContain('## Passage 1');
    expect(md).toContain('## Passage 2');
    expect(md).not.toContain('arch-L1');
    expect(md).not.toContain('algo-L1');
    expect(md).not.toContain('sha256:');
    expect(md).not.toContain('-v1');
  });

  it('enriches headings with reader-safe titles from the aligned ledger', () => {
    const records: SelectionRecord[] = [
      {
        sequence: 0,
        nodeId: 'arch-L1',
        passageTitle: 'The Archaeologist Wakes',
        excerpt: '',
        variationId: 'arch-L1-v1',
        selectedAt: '',
        visitNumber: 1,
        reason: reason(),
        explanation: '',
      },
    ];
    const titles = buildJourneyTitleMap(records);
    const md = buildJourneyMarkdown(events, metadata, { titles });
    expect(md).toContain('## 1. The Archaeologist Wakes');
    expect(md).toContain('## Passage 2'); // no ledger title -> ordinal fallback
  });

  it('exposes internal IDs only under the diagnostic option', () => {
    const md = buildJourneyMarkdown(events, metadata, { diagnostic: true });
    expect(md).toContain('node=arch-L1');
    expect(md).toContain('hash=sha256:');
    expect(md).toContain('Content hash:');
  });

  it('records endings reached from reader choices', () => {
    const withEnding = [
      ...events,
      event({
        sequence: 2,
        nodeId: 'ending-preserve',
        content: 'The pattern holds.',
        readerChoice: { kind: 'ending', value: 'Preserve the Pattern' },
      }),
    ];
    const md = buildJourneyMarkdown(withEnding, metadata);
    expect(md).toContain('Ending reached: Preserve the Pattern');
  });

  it('labels an empty (migrated) journey as not reproducible instead of blank', () => {
    const md = buildJourneyMarkdown([], metadata);
    expect(md).toContain('Passages experienced: 0');
    expect(md).toContain('cannot be reproduced here');
    expect(md).toContain(JOURNEY_EXPORT_LICENSE_NOTICE);
  });

  it('warns that earlier passages are missing when the first captured event is not the first visit', () => {
    // A partially-migrated (or size-trimmed) log: the earliest surviving event has a non-zero
    // sequence, so earlier passages were experienced but have no snapshot.
    const partial = [
      event({ sequence: 8, nodeId: 'algo-L2', content: 'Later prose.' }),
      event({ sequence: 9, nodeId: 'hum-L2', content: 'Later still.' }),
    ];
    const md = buildJourneyMarkdown(partial, metadata);
    expect(md).toContain('renumbered from the first one that was captured');
    expect(md).toContain('## Passage 1');
    const html = buildJourneyPrintHtml(partial, metadata);
    expect(html).toContain('renumbered from the first one that was captured');
  });

  it('does not warn about missing passages for a complete journey from the first visit', () => {
    const complete = [event({ sequence: 0, nodeId: 'arch-L1', content: 'From the start.' })];
    expect(buildJourneyMarkdown(complete, metadata)).not.toContain('renumbered from');
  });

  it('exports the stored snapshot verbatim regardless of any later content', () => {
    // The event carries the prose the reader saw; export never consults current story content.
    const snapshot = 'Exact prose the reader saw — untouched.';
    const md = buildJourneyMarkdown(
      [event({ sequence: 0, nodeId: 'arch-L1', content: snapshot })],
      metadata,
    );
    expect(md).toContain(snapshot);
  });

  it('handles revisits (repeat passages) as separate ordered entries', () => {
    const revisits = [
      event({ sequence: 0, nodeId: 'arch-L1', content: 'First visit prose.', visitNumber: 1 }),
      event({ sequence: 3, nodeId: 'arch-L1', content: 'Return visit prose.', visitNumber: 2 }),
    ];
    const md = buildJourneyMarkdown(revisits, metadata);
    expect(md).toContain('## Passage 1');
    expect(md).toContain('## Passage 2');
    expect(md.indexOf('First visit prose.')).toBeLessThan(md.indexOf('Return visit prose.'));
  });

  it('preserves Unicode and long passages intact', () => {
    const unicode = 'café ☕ — 消え去る記憶 — 𝓮𝓽𝓮𝓻𝓷𝓪𝓵';
    const long = 'word '.repeat(4000).trim();
    const md = buildJourneyMarkdown(
      [
        event({ sequence: 0, nodeId: 'arch-L1', content: unicode }),
        event({ sequence: 1, nodeId: 'algo-L1', content: long }),
      ],
      metadata,
    );
    expect(md).toContain(unicode);
    expect(md).toContain(long);
  });

  it('can omit adaptation notes', () => {
    const withNote = [event({ sequence: 0, nodeId: 'arch-L1', content: 'p', withReason: true })];
    const withNotes = buildJourneyMarkdown(withNote, metadata, { includeAdaptationNotes: true });
    const withoutNotes = buildJourneyMarkdown(withNote, metadata, {
      includeAdaptationNotes: false,
    });
    expect(withNotes).toContain('> ');
    expect(withoutNotes).not.toContain('\n> ');
  });
});

describe('markdownToHtml', () => {
  it('renders paragraphs, bold, and italic and escapes HTML', () => {
    const html = markdownToHtml('First **bold** and *italic* line.\n\nSecond & <danger> "quote".');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>italic</em>');
    expect(html).toContain('&amp; &lt;danger&gt; &quot;quote&quot;');
    expect(html.match(/<p>/g)?.length).toBe(2);
  });

  it('does not scan italic markers inside bold spans', () => {
    const html = markdownToHtml('**bold _not italic_ here**');
    expect(html).toContain('<strong>bold _not italic_ here</strong>');
    expect(html).not.toContain('<em>');
  });

  it('strips leading frontmatter like the on-screen renderer', () => {
    const html = markdownToHtml('---\nvariationId: x\n---\nVisible prose.');
    expect(html).toContain('Visible prose.');
    expect(html).not.toContain('variationId');
  });

  it('never emits script tags or attributes derived from content', () => {
    const html = markdownToHtml('<script>alert(1)</script> and <img src=x onerror=y>');
    // Every angle bracket from content is escaped, so no live tag or event-handler attribute exists.
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&lt;img src=x onerror=y&gt;');
  });
});

describe('buildJourneyPrintHtml', () => {
  const events = [event({ sequence: 0, nodeId: 'arch-L1', content: 'The **archive** remembers.' })];

  it('produces a self-contained, offline, accessible document', () => {
    const html = buildJourneyPrintHtml(events, metadata);
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('<h1>');
    expect(html).toContain('<h2>Passage 1</h2>');
    // Each passage is an <article> (heading-navigable), not a labelled region landmark.
    expect(html).toContain('<article class="passage">');
    expect(html).not.toContain('<section class="passage"');
    expect(html).toContain('<strong>archive</strong>');
    expect(html).toContain('@media print');
    expect(html).toContain(JOURNEY_EXPORT_LICENSE_NOTICE);
    // Offline + safe: no external references and no scripts.
    expect(html).not.toContain('<script');
    expect(html).not.toMatch(/https?:\/\//);
  });

  it('is deterministic', () => {
    expect(buildJourneyPrintHtml(events, metadata)).toBe(buildJourneyPrintHtml(events, metadata));
  });

  it('omits internal IDs unless diagnostic is requested', () => {
    expect(buildJourneyPrintHtml(events, metadata)).not.toContain('arch-L1');
    expect(buildJourneyPrintHtml(events, metadata, { diagnostic: true })).toContain('node=arch-L1');
  });
});

describe('journeyExportFilename', () => {
  it('produces a sanitized, deterministic filename', () => {
    expect(
      journeyExportFilename('Eternal Return of the Digital Self', '2026-07-16T12:00:00Z'),
    ).toBe('eternal-return-of-the-digital-self-journey-2026-07-16.md');
  });

  it('strips diacritics and unsafe characters and supports an html extension', () => {
    expect(journeyExportFilename('Café / Journey: "X"', '2026-07-16T00:00:00Z', 'html')).toBe(
      'cafe-journey-x-journey-2026-07-16.html',
    );
  });

  it('falls back to a safe default for an empty title', () => {
    expect(journeyExportFilename('！！！', '2026-07-16T00:00:00Z')).toBe(
      'journey-journey-2026-07-16.md',
    );
  });
});

describe('encounterKey', () => {
  it('matches the visit-event / ledger idempotency triple', () => {
    const e = event({ sequence: 4, nodeId: 'conv-L3', content: 'x', fragmentLabel: 'conv' });
    expect(encounterKey(e)).toBe('4|conv-L3|conv');
  });
});
