# ADR 0004: Export-grade journey visit-event log

- Status: Accepted
- Date: July 15, 2026
- Decision owners: repository owner and product consolidation program
- Phase: 4, contract lock preceding Batches 4.1–4.4

## Context

Phase 4 ports three remaining Project-Leibniz reader-facing strengths into Narramorph: optional compositional prose beats (4.1), condition-aware edge prose (4.2), and an accessible journey export (4.4). Batch 4.3 must produce an immutable, export-grade record of the journey the reader actually experienced, because replaying the current story against final state can produce text different from what the reader originally saw — especially once prose beats (4.1) and edge prose (4.2) make a passage's rendered text depend on journey state.

The roadmap sequences these as 4.1 → 4.2 → 4.3 → 4.4, but the 4.3 record must carry a **selected beat ID** produced by 4.1 and a **bridge ID** produced by 4.2. If 4.1 first invents its own persistence for "which phrasing did the reader see," and 4.3 later generalizes it, selected-phrasing history is designed twice and may require two save migrations. This ADR therefore **locks the `VisitEvent` record shape before 4.1 authors any beat-selection history**, so every later batch writes into one contract.

Phase 3 already established the relevant seams:

- `SelectionRecord` (`src/types/Store.ts`) is an immutable, sequenced, persisted snapshot of one adaptive decision. It carries `sequence`, `nodeId`, `passageTitle`, `excerpt`, `variationId`, optional `fragmentLabel`, `selectedAt`, `visitNumber`, the `SelectionReason`, and a rendered `explanation`. It is evidence, never an input to selection.
- `SelectionReason` (`org.narramorph.selection-reason@1.0.0`) is a closed, reader-safe reason contract reused unchanged here.
- Save schema is `1.2.0` with an explicit ordered `SaveMigration[]` list in `src/domain/progress/saveState.ts`.
- The Story Package identity is `eternal-return@1.1.0`, schema `1.1.0`, hash `d596c66da6392e145872eb3a1fff3b248e88fee5b9343d2a61109ff8815a1062`; literary release `eternal-return-literary-v1.0.1`. None of these change as a consequence of this ADR.

## Decision

### One export-grade journey log

A new versioned `VisitEvent` is the export-grade record of one experienced passage encounter, in reading order. Its contract is `org.narramorph.visit-event@1.0.0`. The persisted, append-only log `visitEvents: VisitEvent[]` is added to `UserProgress` in Batch 4.3. Like `selectionRecords`, it is evidence of what happened — it never drives awareness, unlocking, progression, or future selection.

### Store the resolved snapshot, not a reproduction recipe

A `VisitEvent` stores the **exact resolved prose the reader saw** (`resolvedText.content`, the rendered Markdown) plus an integrity hash and byte length. This is the source of truth for export. Immutable identifiers (`storyPackage`, `selection.variationId`, `selection.beatIds`, `bridgeId`) are retained for provenance and explanation, **not** as the reproduction mechanism. Storing the snapshot is what guarantees a saved or exported journey reopens and re-exports byte-identically even after a later content update rewrites the underlying variation, beat, or bridge. This directly satisfies the Phase 4 guardrail: "Store resolved snapshots where a later content update could otherwise rewrite an old journey."

### Locked record shape

```ts
interface VisitEvent {
  contract: 'org.narramorph.visit-event';
  schemaVersion: '1.0.0';
  sequence: number; // monotonic, 0-based; the passage's position in experienced reading order
  nodeId: string; // internal node/passage ID — diagnostic only, never rendered to the reader
  storyPackage: StoryPackageIdentity; // exact package that produced this text
  visitNumber: number; // per-node visit count at the moment of this encounter
  selection: {
    variationId: string | null; // whole-passage variation, when one was selected
    beatIds: string[]; // ordered resolved prose-beat IDs (Batch 4.1); [] until beats exist
    fragmentLabel?: string; // e.g. an L3 convergence section label
  };
  bridgeId: string | null; // edge/bridge prose shown on entry (Batch 4.2); null until edge prose exists
  resolvedText: {
    format: 'markdown';
    content: string; // exact rendered prose the reader saw — the export source of truth
    hash: string; // integrity digest of `content`, formatted "<algorithm>:<lowercase-hex>"
    byteLength: number; // UTF-8 byte length of `content`
  };
  reason: SelectionReason | null; // Phase 3 reason contract, reused unchanged
  readerChoice: ReaderChoice | null; // an explicit reader decision at this passage, if any
  recordedAt: string; // ISO-8601; sourced from the persisted visit timestamp, never Date.now() at export
}

interface ReaderChoice {
  kind: 'l2-philosophy' | 'ending'; // extended deliberately, never an arbitrary flag bag
  value: string; // reader-safe value, e.g. "acceptance" or "Preserve the Pattern"
}
```

### Timestamp policy

`recordedAt` is copied from the persisted visit timestamp (`VisitRecord.lastVisited`), which Phase 3 already made deterministic by injecting timestamps at the persistence boundary. Export and reopen never call `Date.now()`, so a journey exports identically on every machine and every replay.

### Resolved-text hash

`resolvedText.hash` is `"<algorithm>:<lowercase-hex>"`. The initial algorithm is `sha256` over the UTF-8 bytes of `resolvedText.content`. Because the full snapshot is stored, the hash is an integrity and tamper-evidence check, not the reproduction path. The concrete synchronous digest implementation for the browser runtime lands with the Batch 4.3 write path; this ADR fixes only the field, its format, and its meaning.

### Relationship to the existing reader ledger

`VisitEvent` embeds everything the Phase 3 "How your journey adapted" ledger needs (`passageTitle` and a reader-safe `excerpt` are derivable from `resolvedText.content`; `reason` and its rendered `explanation` are retained). The selected-phrasing history therefore lives in exactly one place. In Batch 4.3 the `visitEvents` log becomes the single source and the separate `selectionRecords` array is either derived from it or retired; that wiring choice is a 4.3 implementation detail. The **shape locked here is what Batch 4.1 writes into** — 4.1 populates `selection.beatIds`, 4.2 populates `bridgeId`, and neither invents a second history model.

### Save schema and identities

Batch 4.3 extends the save schema to `1.3.0` by appending a `visit-events` migration to the existing ordered `SaveMigration[]`, following the exact pattern that added `selection-records` at `1.2.0`. Saves at `1.2.0` and earlier migrate with an empty `visitEvents` log and are clearly labeled where exact reconstruction of pre-migration prose is impossible. This ADR changes no Story Package identity, no literary release, no authored prose, and no selection outcome. Prose beats, edge prose, export, and this log must never change which content is selected; that invariance is proven with behavioral tests as in Phase 3.

## Consequences

- One immutable contract carries selected variation, selected beats, bridge, resolved snapshot, reader choice, reason, and timestamp — so 4.1, 4.2, 4.3, and 4.4 share it without a second state model.
- A saved or exported journey is reproducible byte-for-byte regardless of later content updates.
- Export (4.4) reads resolved snapshots directly and never re-runs selection, so it cannot drift from what the reader saw.
- Old saves remain readable; where a full snapshot never existed, the record is labeled rather than silently reconstructed.

## Rejected alternatives

- Reproduce prose at export time from identifiers and current content. Rejected: a later content update would rewrite historical journeys.
- Add a second `visitEvents` model in parallel with an independently-evolving beat-selection history in 4.1. Rejected: it designs selected-phrasing history twice and risks a second migration.
- Use `Date.now()` at export for timestamps. Rejected: it breaks deterministic, byte-identical export.
- Introduce an arbitrary reader-flag bag for `readerChoice`. Rejected for the same reason ADR 0003 rejected generic flags: choices are named, typed facts.

## Verification

The decision is implemented when: the `VisitEvent` type and its guards exist and are shape-locked by tests; Batch 4.1 writes `selection.beatIds` into this shape; Batch 4.3 adds the persisted `visitEvents` log with a `1.3.0` migration and a deterministic resolved-text hash; Batch 4.4 exports from stored snapshots and reopen/re-export is byte-identical; and behavioral tests prove selection outcomes are unchanged by the log.

## Related records

- [ADR 0001: repository boundaries](0001-repository-boundaries.md)
- [ADR 0002: content authority and edition semantics](0002-content-authority-and-edition-semantics.md)
- [ADR 0003: adaptive selection conditions and explanations](0003-adaptive-selection-explanations.md)
- [Phase 4 execution record](../consolidation/PHASE_4_EXECUTION.md)
- [Feature extraction matrix](../consolidation/FEATURE_EXTRACTION_MATRIX.md)
