# Phase 4 execution record

Phase 4 ports Project-Leibniz's last reader-facing strengths into Narramorph — optional compositional prose beats, condition-aware edge prose, an export-grade visit-event log, and an accessible journey export — then archives Project-Leibniz once its parity/rejection gate passes and the owner accepts the Narramorph implementations. Narramorph remains the sole implementation target and the only journey-state authority.

**Status: in progress.** The contract-lock groundwork is complete; Batches 4.1–4.6 are pending. No deployment, production release, repository archive, canonical prose change, or authored runtime-prose change has occurred.

## Scope and immutable inputs

| Repository | Role | Verified commit | Mutation policy |
| --- | --- | --- | --- |
| Narramorph | Sole implementation target and journey-state authority | Phase 3 closure `3e29a030f43623c9b798b8e3fcf8f5a4868e9fec` | Feature branch and protected-main PRs only |
| Eternal_Return_Manuscript | Canonical terminology/voice reference | `6720e76202951e24102997e2b8ef23e08445ab33` | Read-only; prose edits only through the manuscript content-approval workflow with provenance |
| Project-Leibniz | Frozen conceptual reference | `4f3f4600b8782aac5000b45dd64378baf318e1df` | Read-only until the Batch 4.5 gate passes and the owner accepts; archived in 4.6 |
| eternal-return-digital-self | Frozen control repository | `392eef6c6f87b8064c8cc51d91b6f029b0e32d5b` | Read-only and expected unchanged (archived in Phase 6) |

New Phase 4 contract identity (design-locked, not yet persisted): journey visit-event log `org.narramorph.visit-event@1.0.0` (ADR 0004). The persisted `visitEvents` log and save schema `1.3.0` land in Batch 4.3.

Preserved Phase 3 contract identities (unchanged unless a versioned change is deliberate and recorded):

- SelectionReason `org.narramorph.selection-reason@1.0.0`
- Story Package schema `1.1.0`; interactive package `eternal-return@1.1.0`
- Package content hash `d596c66da6392e145872eb3a1fff3b248e88fee5b9343d2a61109ff8815a1062`
- Save schema `1.2.0`
- Literary release `eternal-return-literary-v1.0.1`

## Guardrails carried into Phase 4

- Narramorph is the only implementation target and the sole journey-state authority. Project-Leibniz's Mongo backend, React Context state, and singleton mutable rule engine are not imported; they are explicitly rejected in Batch 4.5.
- No canonical manuscript prose edits. Any runtime wording change in 4.1/4.2 requires the manuscript content-approval workflow and is recorded with provenance.
- Selection stays deterministic and byte-invariant: prose beats, edge prose, export, and the visit log must never change which content is selected. Proven with behavioral tests, as in Phase 3.
- A saved or exported journey must reopen and export byte-identically. Resolved snapshots are stored where a later content update could otherwise rewrite an old journey (ADR 0004).
- Project-Leibniz is not archived until every one of the seven archive-gate conditions below is proven **and** the owner accepts the Narramorph implementations.

## Sequencing decision (contract lock before 4.1)

The 4.3 `VisitEvent` must carry a selected beat ID (from 4.1) and a bridge ID (from 4.2). To avoid designing selected-phrasing history twice, the `VisitEvent` record shape is **locked before Batch 4.1** in [ADR 0004](../adr/0004-journey-visit-event-log.md). Batch order then proceeds 4.1 → 4.2 → 4.3 (mechanics) → 4.4 → 4.5 → 4.6, with each batch writing into the one locked contract. 4.3 still lands before 4.4.

## Batch tracking

| Batch | Issue | Branch | Pull request | Status |
| --- | --- | --- | --- | --- |
| 4.0 contract lock (ADR 0004, VisitEvent shape) | [#149](https://github.com/zekusmaximus/Narramorph/issues/149) | `claude/eternal-return-phase-4-tbrhvp` | _not opened_ | Complete (branch) |
| 4.1 optional compositional prose beats | [#150](https://github.com/zekusmaximus/Narramorph/issues/150) | `claude/eternal-return-phase-4-tbrhvp` | _not opened_ | Mechanism landed; node conversion pending approval |
| 4.2 condition-aware edge prose | _TBD_ | _TBD_ | _TBD_ | Pending |
| 4.3 export-grade visit event log | _TBD_ | _TBD_ | _TBD_ | Pending |
| 4.4 accessible journey export (Markdown + print HTML) | _TBD_ | _TBD_ | _TBD_ | Pending |
| 4.5 Leibniz parity/rejection review (archive gate) | _TBD_ | _TBD_ | _TBD_ | Pending |
| 4.6 archive Project-Leibniz | _TBD_ | _TBD_ | _TBD_ | Pending |

## Batch 4.0 — contract lock (VisitEvent record shape)

**Deliverables**

- [ADR 0004](../adr/0004-journey-visit-event-log.md) locks the `org.narramorph.visit-event@1.0.0` record shape, the store-the-snapshot decision, the timestamp policy, the resolved-text hash format, the save-schema `1.3.0` plan, and how 4.1 beat IDs / 4.2 bridge IDs slot in.
- `src/types/VisitEvent.ts` defines the shape, a structural persistence guard, and the hash-format check. Design-only: not yet written by the store.
- `src/types/VisitEvent.test.ts` shape-locks the contract identity, required fields, and guard.

**Evidence**

- Tracking issue [#149](https://github.com/zekusmaximus/Narramorph/issues/149) under epic #93.
- Local verification on Node `22.22.2` / npm `10.9.7`:
  - `npm run type-check`: pass.
  - `npm run lint:ci`: 0 errors, 32 warnings — the Phase 3 baseline held (the contract-lock files add no net warnings after formatting).
  - `npm run test:run`: 47 files, 245 tests passed (Phase 3.4 closed at 233; the 12 new `VisitEvent` shape-lock tests account for the increase).
  - `npm run story:package:validate`: all three packages valid; `eternal-return@1.1.0` hash `d596c66da6392e145872eb3a1fff3b248e88fee5b9343d2a61109ff8815a1062`, unchanged from Phase 3.
  - `npm run build`: pass.
  - `npm run test:e2e` (Playwright): the pre-provisioned sandbox ships Chromium revision `1194` while the pinned `@playwright/test@1.61.1` expects headless-shell `1228`, so every scenario fails at browser launch — an environment mismatch, not a regression. Pointed at the installed Chromium, the core `reader-journey` scenarios pass 3/3. This batch imports the `VisitEvent` types into no runtime code, so it has no reader-visible surface for a browser test to exercise; the full 17-scenario Chromium matrix runs in protected-main CI, which provisions the matching browser.
- Story Package identity, save schema `1.2.0`, SelectionReason `org.narramorph.selection-reason@1.0.0`, and literary release `eternal-return-literary-v1.0.1` all unchanged. The `VisitEvent` types are not yet imported by any runtime code, so no selection outcome or reader-visible behavior changed.

## Batch 4.1 — optional compositional prose beats

**Status: mechanism landed; reference-node conversion pending content approval.**

**Acceptance gate**

- Authors can choose between whole-passage variations and compositional beats without duplicating state logic.
- A saved journey reopens with the exact same resolved prose.

**Mechanism delivered**

- `src/types/Variation.ts` adds an optional `proseBeats` representation to the runtime `Variation`: an ordered list of beat slots, each with ordered alternative phrasings that carry an optional journey condition (reusing the Phase 3 `JourneyConditionExpression`), a `priority`, and per-slot `omitWhenUnmatched` behavior, plus an optional `beatJoiner`. Whole-passage variations remain fully supported; a variation without beats is unchanged, so migration is incremental.
- `src/domain/variation/proseBeats.ts` resolves beats into one continuous passage before Markdown rendering. It reuses the pure `evaluateJourneyCondition` evaluator, selects one alternative per slot by condition then highest priority (ties break to author order), applies the deterministic first-alternative fallback or omits the slot, and returns the ordered selected beat IDs for the visit-event log. A beatless variation returns its `content` byte-for-byte unchanged.
- `src/domain/variation/selection.ts` composes the resolved prose inside `selectVariation` and threads `selectedBeatIds` through the result without duplicating any state logic; selection order and matched variation are unchanged.
- `schemas/story-package/v1/prose-beat.schema.json` is extended additively with optional `conditionId`, `priority`, and `omitWhenUnmatched`. Existing single-beat catalogs omit these fields and remain valid; the conversion emitter is unchanged, so the package hash is unaffected.

**Evidence**

- `src/domain/variation/proseBeats.test.ts` (11 tests): byte-identical identity path, empty-beats identity, ordinal ordering, custom joiner, condition-based selection, priority preference, author-order tie-break, omission, deterministic fallback, and determinism (identical inputs → identical output).
- `src/domain/variation/selection.test.ts` adds a byte-invariance case (beatless variation unchanged, `selectedBeatIds` empty) and a composition case (beats compose into the passage; selected beat IDs threaded).
- Local verification on Node `22.22.2`: `type-check` pass; `lint:ci` 0 errors / 32 warnings (baseline held); `test:run` 48 files / 258 tests passed (was 245; +13); `story:package:validate` all valid with `eternal-return@1.1.0` hash `d596c66da6392e145872eb3a1fff3b248e88fee5b9343d2a61109ff8815a1062` unchanged; `build` pass. Core adaptive Chromium journeys (`reader-journey`, `phase-3-path-coverage`) pass against the installed browser (the pinned headless-shell revision is absent in this sandbox; the full matrix runs in protected-main CI).

**Deferred (content-approval gated)**

- Converting one reference node per perspective into beats — the roadmap's editorial-quality comparison — is an authored-prose change requiring the operator's explicit sign-off on the exact wording, recorded with provenance per ADR 0002. No authored runtime prose or manuscript prose changed in this batch.
- Exact reopen replay of a _conditional_ beat resolution is guaranteed once Batch 4.3 snapshots the resolved text in the `VisitEvent` log. Every shipped passage stays on the byte-invariant identity path until a node opts into beats, so no saved journey changes today.

## Batch 4.2 — condition-aware edge prose

**Acceptance gate**

- At least one journey reads more smoothly without changing graph progression.
- Edge prose has provenance, validation, explanation, and export coverage.

**Evidence**

- Bridge schema, render-at-entry behavior, accessibility/animation rules, and bounds: _TBD_.
- Provenance, validation, explanation, and export coverage: _TBD_.
- Local verification and identities: _TBD_.

## Batch 4.3 — export-grade visit event log

**Why before export:** replaying the current story against final state can produce text different from what the reader saw. Export must use an immutable record of the experienced journey.

**Acceptance gate**

- Exported text exactly matches the text observed at each visit, including revisits.
- Old saves remain readable and are clearly labeled when exact reconstruction is impossible.

**Evidence**

- Persisted `visitEvents` log, resolved-text snapshot + deterministic hash, save schema `1.3.0` migration, size limits, and privacy documentation: _TBD_.
- Old-save migration and reconstruction labeling: _TBD_.
- Local verification and identities: _TBD_.

## Batch 4.4 — accessible journey export

**Acceptance gate**

- A complete L1→L4 journey exports without omissions or reordering.
- Export works offline and contains no internal IDs unless a diagnostic option is chosen.

**Evidence**

- Markdown export (title page, versions, journey metadata, passages in experienced order, edge prose, optional adaptation notes, content-license notice), filename sanitization, deterministic fixtures, and a print-friendly HTML view (EPUB/PDF deferred): _TBD_.
- Tests for repeats, branching, endings, migration, Unicode, long passages, and content updates: _TBD_.
- Local verification and identities: _TBD_.

## Batch 4.5 — Leibniz parity/rejection review (archive gate)

**Explicit rejections to record:** Project-Leibniz's Mongo backend, separate React Context state architecture, singleton mutable rule engine, and current visual design (unless a product requirement says otherwise).

### Project-Leibniz archive-gate conditions

Project-Leibniz may be archived only when all seven are proven **and** the owner accepts the Narramorph implementations:

1. every extraction-matrix item is migrated or rejected — _TBD_;
2. Narramorph has no runtime/build dependency on Project-Leibniz — _TBD_;
3. Narramorph's replacement features pass unit and browser tests — _TBD_;
4. source attribution and licensing are complete — _TBD_;
5. Project-Leibniz's credential has been rotated/revoked — _TBD_ (confirmed in Batch 0.2; re-verify);
6. open issues have been migrated or closed — _TBD_;
7. the owner has accepted the Narramorph implementations — _TBD_.

**Evidence**

- Re-run conceptual inventory, condition/ledger/beat/edge/export parity check, behavior-named regression tests, and provenance completeness: _TBD_.

## Batch 4.6 — archive Project-Leibniz

**Precondition:** Batch 4.5 gate fully satisfied and owner acceptance recorded. Not started.

**Evidence**

- Final `reference-final` tag, README archive notice, issue disposition, secret/deploy-hook removal, and GitHub archive toggle (history preserved): _TBD_.

## Closure evidence

- _TBD_ once Batches 4.1–4.6 meet their gates and epic [#93](https://github.com/zekusmaximus/Narramorph/issues/93) is updated.
