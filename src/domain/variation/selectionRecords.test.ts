import { describe, expect, it } from 'vitest';

import type { SelectionRecord, SelectionReason } from '@/types';

import { appendSelectionRecord, createSelectionExcerpt } from './selectionRecords';

const reason: SelectionReason = {
  contract: 'org.narramorph.selection-reason',
  schemaVersion: '1.0.0',
  selectionKind: 'passage-variation',
  outcome: 'exact',
  templateKey: 'selection.first_visit',
  parameters: {},
  triggers: [],
};

function record(overrides: Partial<SelectionRecord> = {}): SelectionRecord {
  return {
    sequence: 1,
    nodeId: 'arch-L1-internal',
    passageTitle: 'The First Fragment',
    excerpt: 'Reader prose',
    variationId: 'variation-internal-001',
    selectedAt: '2026-07-15T12:00:00.000Z',
    visitNumber: 1,
    reason,
    explanation: 'This version meets you on your first visit to this passage.',
    ...overrides,
  };
}

describe('selection record snapshots', () => {
  it('creates bounded plain-text excerpts from Markdown', () => {
    expect(
      createSelectionExcerpt(
        '# Heading\n\nA **quiet** [linked phrase](https://example.com) with `code` and more words.',
        48,
      ),
    ).toBe('Heading A quiet linked phrase with code and…');
  });

  it('deduplicates Strict Mode effects within one visit and fragment', () => {
    const first = record();
    const records = appendSelectionRecord([], first);

    expect(appendSelectionRecord(records, record({ variationId: 'later-effect' }))).toBe(records);
  });

  it('allows distinct L3 fragments and later visits to append', () => {
    const records = appendSelectionRecord([], record({ fragmentLabel: 'Archaeologist' }));
    const secondFragment = appendSelectionRecord(
      records,
      record({ fragmentLabel: 'Algorithm', variationId: 'algo-internal' }),
    );
    const laterVisit = appendSelectionRecord(
      secondFragment,
      record({ sequence: 2, fragmentLabel: 'Archaeologist' }),
    );

    expect(laterVisit).toHaveLength(3);
  });
});
