# Phase 4 execution record

> **Status: NOT STARTED — skeleton only.** This document is a pre-filled template for
> Phase 4 of the [product consolidation roadmap](../eternal-return-product-consolidation-roadmap.md#phase-4--port-compositional-prose-edge-prose-and-journey-export-archive-project-leibniz).
> Every field marked _TBD_ must be replaced with verified evidence as work lands. Do not
> record a batch as complete until its acceptance gate is proven by tests and protected-main CI.

Phase 4 ports Project-Leibniz's remaining reader-facing strengths — compositional prose beats,
condition-aware edge prose, and an export-grade journey export — into Narramorph, then satisfies
the documented parity/rejection gate and archives Project-Leibniz. Narramorph remains the sole
application and journey-state authority throughout. Phase 5 is the next roadmap phase.

## Scope and immutable inputs

Phase 4 is the first phase permitted to change Project-Leibniz (README archive notice and the
GitHub archive toggle) — and only in Batch 4.6, only after the Batch 4.5 archive gate passes.
Every other repository boundary from Phase 3 carries forward unchanged.

| Repository | Role | Verified commit | Mutation policy |
| --- | --- | --- | --- |
| Narramorph | Sole implementation target | _TBD (Phase 4 base commit on `main`)_ | Feature branches and protected-main PRs only |
| Eternal_Return_Manuscript | Canonical terminology/voice reference | `6720e76202951e24102997e2b8ef23e08445ab33` | Read-only unless approved prose/wording change is required by 4.1/4.2 |
| Project-Leibniz | Frozen conceptual reference; archived in 4.6 | `4f3f4600b8782aac5000b45dd64378baf318e1df` | Read-only until the 4.5 gate passes; archive notice + toggle only in 4.6 |
| eternal-return-digital-self | Frozen control repository | `392eef6c6f87b8064c8cc51d91b6f029b0e32d5b` | Read-only and expected unchanged (its own gate is Phase 6) |

No deployment, production release, or canonical manuscript prose edit is in scope. Any runtime
wording change in 4.1/4.2 requires the manuscript repository's content-approval workflow and must
be recorded with provenance.

## Inherited Phase 3 assets (starting point, not new work)

- The Story Package Contract already defines `schemas/story-package/v1/prose-beat.schema.json`
  and references it in `tools/conversion/lib/story-package.ts`, but it is **not yet wired into
  runtime prose resolution**. Batch 4.1 extends and wires this; it does not invent the format.
- `SelectionRecord` (`src/types/Store.ts`) is already an immutable, sequenced, persisted snapshot
  (sequence, nodeId, passageTitle, excerpt, variationId, visitNumber, reason, explanation). It is
  the seed for Batch 4.3's `VisitEvent` and is missing only story-package version, resolved-text
  hash, bridge ID, selected beat IDs, reader choice, and timestamp policy.
- Save schema is at `1.2.0` with an explicit migration list in `src/domain/progress/saveState.ts`.
  Batch 4.3 extends this (e.g. `1.3.0`) using the same migration pattern.
- There is **no journey-export code** in `src/` today. Batch 4.4 is greenfield.
- The completed Phase 3 contract identities carried into Phase 4: SelectionReason
  `org.narramorph.selection-reason@1.0.0`, Story Package schema `1.1.0`, save schema `1.2.0`,
  interactive package `eternal-return@1.1.0`, package hash
  `d596c66da6392e145872eb3a1fff3b248e88fee5b9343d2a61109ff8815a1062`, literary release
  `eternal-return-literary-v1.0.1`.

## Protected-main starting evidence

- Narramorph protected-main run _TBD_ passed at the Phase 4 base commit with all required
  contexts configured.
- All four repositories remain unarchived at their verified commits above. No production release
  exists.
- Consolidation epic [#93](https://github.com/zekusmaximus/Narramorph/issues/93) remains open.

## Local pre-change baseline

Run _TBD (date)_ on Node _TBD_ and npm _TBD_ after clean root and conversion-tool installs:

- `npm run type-check`: _TBD_.
- `npm run lint:ci`: _TBD_ (record warning count against the 32-warning baseline).
- `npm run test:run`: _TBD_ files / _TBD_ tests.
- `npm run story:package:test`: _TBD_.
- `npm run story:package:validate`: _TBD_ (identities must remain unchanged from Phase 3).
- `npm run build`: _TBD_.
- `npm run test:e2e`: _TBD_ Chromium scenarios.

## Batch tracking

| Batch | Issue | Branch | Pull request | Status |
| --- | --- | --- | --- | --- |
| 4.1 optional compositional prose beats | _TBD_ | _TBD_ | _TBD_ | Not started |
| 4.2 condition-aware edge prose | _TBD_ | _TBD_ | _TBD_ | Not started |
| 4.3 export-grade visit event log | _TBD_ | _TBD_ | _TBD_ | Not started |
| 4.4 accessible journey export | _TBD_ | _TBD_ | _TBD_ | Not started |
| 4.5 Leibniz parity and rejection record | _TBD_ | _TBD_ | _TBD_ | Not started |
| 4.6 archive Project-Leibniz | _TBD_ | _TBD_ | _TBD_ | Not started |

Suggested order: 4.1 → 4.2 → 4.3 → 4.4 → 4.5 → 4.6. 4.3 must land before 4.4 (export replays the
immutable visit log). Consider locking the 4.3 `VisitEvent` record shape before 4.1 authors beat
history, so selected-phrasing history is not designed twice.

## Batch 4.1 — Optional compositional prose beats

**Acceptance gate:** authors can choose between whole-passage variations and compositional beats
without duplicating state logic; a saved journey reopens with byte-identical resolved prose.

- Design decisions: _TBD_
- Schema/runtime changes (wiring `prose-beat` into resolution; beat = ordered phrasings +
  condition + priority + omission + deterministic fallback + explanation metadata): _TBD_
- Preservation proof (typography, sanitization, reading-time, export, exact selected-phrasing
  history): _TBD_
- Reference-node conversion (one per perspective) and editorial comparison vs. whole-passage
  variations: _TBD_
- Local verification: _TBD_
- Story Package identity unchanged / explicitly versioned: _TBD_

## Batch 4.2 — Condition-aware edge prose

**Acceptance gate:** at least one journey reads more smoothly without changing graph progression;
edge prose has provenance, validation, explanation, and export coverage.

- Connection/bridge model and per-state variation: _TBD_
- Entry-render and export behavior; bridges are not separate visited nodes unless authored so: _TBD_
- Accessibility/animation rules (assistive tech must read bridges before they change): _TBD_
- Bound limits so edge prose cannot become a second unbounded content system: _TBD_
- Local verification: _TBD_

## Batch 4.3 — Export-grade visit event log

**Acceptance gate:** exported text exactly matches the text observed at each visit, including
revisits; old saves remain readable and are clearly labeled when exact reconstruction is impossible.

- `VisitEvent` contract (versioned): sequence, node/passage ID, story-package version, visit
  number, selected variation/beat IDs, resolved-text hash, bridge ID, selection reasons, reader
  choice, timestamp policy: _TBD_
- Resolved-snapshot vs. reproduce-by-ID decision (store a resolved snapshot where later content
  updates could change old journeys): _TBD_
- Save-schema migration (`1.2.0 → 1.3.0` or as chosen) and graceful degradation for pre-snapshot
  saves: _TBD_
- Size limits and local-history privacy documentation: _TBD_
- Local verification: _TBD_

## Batch 4.4 — Accessible journey export

**Acceptance gate:** a complete L1→L4 journey exports without omissions or reordering; export works
offline and contains no internal IDs unless a diagnostic option is chosen.

- Markdown export (title page, story/package version, journey metadata, passages in experienced
  order, edge prose, optional adaptation notes, content-license notice): _TBD_
- Deterministic output for fixtures; filename sanitization: _TBD_
- Print-friendly HTML view (EPUB/PDF deferred): _TBD_
- User-initiated, accessible download; disclosure of what progress data is included: _TBD_
- Tests (repeats, branching, endings, migration, Unicode, long passages, content updates): _TBD_
- Local verification: _TBD_

## Batch 4.5 — Leibniz parity review and explicit rejection record

**Project-Leibniz archive gate — all seven must be true before Batch 4.6:**

1. every extraction-matrix item is migrated or rejected — _TBD_
2. Narramorph has no runtime/build dependency on Project-Leibniz — _TBD_
3. Narramorph's replacement features pass unit and browser tests — _TBD_
4. source attribution and licensing are complete — _TBD_
5. Project-Leibniz's historical credential has been rotated/revoked — _TBD_
6. open issues have been migrated or closed — _TBD_
7. the owner has accepted the Narramorph implementations — _TBD_

- Re-run of L's conceptual feature inventory against N (conditions, ledger, beats, edge prose,
  export): _TBD_
- Explicit rejections with rationale (Mongo backend, React Context state architecture, singleton
  mutable rule engine, current visual design): _TBD_
- Regression tests named by behavior rather than by the old repository: _TBD_

## Batch 4.6 — Archive Project-Leibniz

**After this batch:** routine agents no longer need Project-Leibniz access; public read access
remains useful only for historical provenance.

- Final release/tag (e.g. `reference-final`): _TBD_
- README archive notice (link to N, features that moved, unsupported/read-only statement): _TBD_
- Issue/discussion disposition; removal of unused deployment hooks and secrets: _TBD_
- GitHub archive toggle applied; history preserved (not deleted): _TBD_
- Destination-link verification from N: _TBD_

## Closure evidence

- Issues _TBD_ closed; implementation PRs merged in dependency order at commits _TBD_.
- Protected-main run _TBD_ passed all required contexts at the final Phase 4 merge commit.
- Contract identities after Phase 4 (record any versioned change; unchanged items must be stated
  explicitly): _TBD_.
- Project-Leibniz archive state confirmed; eternal-return-digital-self remains unchanged and
  unarchived at `392eef6c6f87b8064c8cc51d91b6f029b0e32d5b`.
- Manuscript remained read-only at `6720e76202951e24102997e2b8ef23e08445ab33` unless an approved
  wording change is recorded here with provenance.
- No deployment, production release, or unapproved prose edit occurred. Phase 5 is next; epic #93
  remains open.
