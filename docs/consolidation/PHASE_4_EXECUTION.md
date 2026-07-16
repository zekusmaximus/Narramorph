# Phase 4 execution record

Phase 4 ports Project-Leibniz's last reader-facing strengths into Narramorph — optional compositional prose beats, condition-aware edge prose, an export-grade visit-event log, and an accessible journey export — then archives Project-Leibniz once its parity/rejection gate passes and the owner accepts the Narramorph implementations. Narramorph remains the sole implementation target and the only journey-state authority.

**Status: in progress.** Batches 4.0–4.4 are complete on the feature branch (contract lock, prose beats, edge prose, the persisted visit-event log, and the accessible journey export). Batches 4.1 and 4.2 left their authored-prose work for the batched editorial pass bundled with 4.6. Batch 4.5 (Leibniz parity/archive gate) and Batch 4.6 (archive) remain, and require owner acceptance. No deployment, production release, repository archive, canonical prose change, or authored runtime-prose change has occurred.

## Scope and immutable inputs

| Repository | Role | Verified commit | Mutation policy |
| --- | --- | --- | --- |
| Narramorph | Sole implementation target and journey-state authority | Phase 3 closure `3e29a030f43623c9b798b8e3fcf8f5a4868e9fec` | Feature branch and protected-main PRs only |
| Eternal_Return_Manuscript | Canonical terminology/voice reference | `6720e76202951e24102997e2b8ef23e08445ab33` | Read-only; prose edits only through the manuscript content-approval workflow with provenance |
| Project-Leibniz | Frozen conceptual reference | `4f3f4600b8782aac5000b45dd64378baf318e1df` | Read-only until the Batch 4.5 gate passes and the owner accepts; archived in 4.6 |
| eternal-return-digital-self | Frozen control repository | `392eef6c6f87b8064c8cc51d91b6f029b0e32d5b` | Read-only and expected unchanged (archived in Phase 6) |

New Phase 4 contract identity: journey visit-event log `org.narramorph.visit-event@1.0.0` (ADR 0004), locked in Batch 4.0 and persisted as the `visitEvents` log with save schema `1.3.0` in Batch 4.3.

Preserved Phase 3 contract identities (unchanged unless a versioned change is deliberate and recorded):

- SelectionReason `org.narramorph.selection-reason@1.0.0`
- Story Package schema `1.1.0`; interactive package `eternal-return@1.1.0`
- Package content hash `d596c66da6392e145872eb3a1fff3b248e88fee5b9343d2a61109ff8815a1062`
- Save schema `1.2.0` → **`1.3.0`** in Batch 4.3 (deliberate; adds the persisted `visitEvents` log with an explicit migration)
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
| 4.2 condition-aware edge prose | [#151](https://github.com/zekusmaximus/Narramorph/issues/151) | `claude/eternal-return-phase-4-tbrhvp` | _not opened_ | Mechanism landed; authored prose pending approval |
| 4.3 export-grade visit event log | [#152](https://github.com/zekusmaximus/Narramorph/issues/152) | `claude/eternal-return-phase-4-tbrhvp` | _not opened_ | Complete (branch) |
| 4.4 accessible journey export (Markdown + print HTML) | [#153](https://github.com/zekusmaximus/Narramorph/issues/153) | `claude/eternal-return-phase-4-tbrhvp` | _not opened_ | Complete (branch) |
| 4.5 Leibniz parity/rejection review (archive gate) | [#154](https://github.com/zekusmaximus/Narramorph/issues/154) | `claude/eternal-return-phase-4-tbrhvp` | _not opened_ | Gate 1–6 satisfied; owner acceptance (7) pending |
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

**Deferred (content-approval gated) — owner elected the batched editorial pass**

- Converting one reference node per perspective into beats — the roadmap's editorial-quality comparison — is an authored-prose change requiring the operator's explicit sign-off on the exact wording, recorded with provenance per ADR 0002. The owner has elected to run this authored-prose conversion in one batched editorial pass **together with Batch 4.6**, rather than convert a node now; the 4.1 acceptance gate is met by the mechanism plus the byte-invariance proof, and no downstream batch depends on the conversion. No authored runtime prose or manuscript prose changed in this batch.
- Exact reopen replay of a _conditional_ beat resolution is guaranteed once Batch 4.3 snapshots the resolved text in the `VisitEvent` log. Every shipped passage stays on the byte-invariant identity path until a node opts into beats, so no saved journey changes today.

## Batch 4.2 — condition-aware edge prose

**Status: mechanism landed; authored bridge prose pending content approval.**

**Acceptance gate**

- At least one journey reads more smoothly without changing graph progression.
- Edge prose has provenance, validation, explanation, and export coverage.

**Mechanism delivered**

- `src/types/Story.ts` adds an optional `bridge` to `Connection`: ordered alternative phrasings, each with an optional Phase 3 journey condition and `priority`, plus per-edge `omitWhenUnmatched`. Bridges are optional, so every existing connection is unchanged.
- `src/domain/bridges/edgeBridge.ts` provides `resolveEdgeBridge` (deterministic selection mirroring prose beats: condition → highest priority → author-order tie-break → first-alternative fallback or omission) and `resolveEntryBridge`, which finds the connection for the crossed edge (forward, or reverse when bidirectional) and resolves its bridge. The resolved `bridgeId` feeds the locked `VisitEvent.bridgeId` (Batch 4.3) and journey export (Batch 4.4).
- **Bounds:** `EDGE_BRIDGE_LIMITS` (max 6 alternatives per edge, max 400 characters per fragment) and `validateEdgeBridges` enforce them, so edge prose cannot become an unbounded second content system. Over-limit bridges are a content error, not a silent truncation.
- **Render at entry, accessibly:** `useEdgeBridge` derives the "from" node from the reading path (correct across revisits) and resolves the bridge; `StoryBridge` renders it as a static `role="note"` block ("Passage transition") inside the reading flow above the passage — never a timed or auto-dismissed element, so assistive technology can always read it, and it carries no interactive controls. It is not treated as a separate visited node. Wired into `StoryView` and guarded, so with no authored bridges the shipped reader is byte-for-byte unchanged.

**Evidence**

- `src/domain/bridges/edgeBridge.test.ts` (15 tests): no-bridge null, author-order and priority selection with tie-break, omission, deterministic fallback, determinism, forward/reverse/one-way edge matching, and all three bound violations.
- `src/components/StoryView/StoryBridge.test.tsx` (2 tests): static labelled note renders the prose; no interactive controls (cannot trap focus).
- Local verification on Node `22.22.2`: `type-check` pass; `lint:ci` 0 errors / 32 warnings (baseline held); `test:run` 50 files / 275 tests passed (was 258; +17); `story:package:validate` all valid with `eternal-return@1.1.0` hash `d596c66da6392e145872eb3a1fff3b248e88fee5b9343d2a61109ff8815a1062` unchanged; `build` pass. Core `reader-journey` and `accessibility-confidence` Chromium specs pass against the installed browser (the pinned headless-shell revision is absent in this sandbox; the full matrix runs in protected-main CI).

**Deferred (content-approval gated)**

- Authoring the bridge prose that makes at least one journey "read more smoothly" is an authored-prose change requiring the operator's explicit sign-off with provenance per ADR 0002; the owner has elected to run it in the batched editorial pass **together with Batch 4.6**. Provenance, explanation, and export coverage for authored bridges complete alongside that content and Batches 4.3/4.4, which persist and export the resolved `bridgeId`. No authored runtime prose or manuscript prose changed in this batch.

## Batch 4.3 — export-grade visit event log

**Status: complete.**

**Why before export:** replaying the current story against final state can produce text different from what the reader saw. Export must use an immutable record of the experienced journey.

**Acceptance gate**

- Exported text exactly matches the text observed at each visit, including revisits.
- Old saves remain readable and are clearly labeled when exact reconstruction is impossible.

**Delivered**

- `UserProgress.visitEvents` is a persisted, append-only log of the locked `org.narramorph.visit-event@1.0.0` shape. The store writes one event per experienced passage in `recordActiveVisitSelection`, snapshotting the **exact resolved prose** the reader saw plus the selected variation, the 4.1 `selectedBeatIds`, the 4.2 `bridgeId`, the selection reason, the reader choice (e.g. the ending reached), and a timestamp taken from the persisted visit — never `Date.now()`. Storing the snapshot is what makes a saved or exported journey reproducible even after later content changes.
- `src/domain/hash/sha256.ts` is a compact synchronous SHA-256 (verified against FIPS 180-4 vectors) used for the `sha256:<hex>` resolved-text integrity hash; `src/domain/progress/visitEvents.ts` builds events and appends them idempotently on the `(sequence, nodeId, fragmentLabel)` triple, matching the selection ledger so Strict Mode cannot double-log.
- **Migration:** save schema is now `1.3.0`. `prepareSavedState` appends a `visit-events` migration that gives pre-`1.3.0` saves an empty log rather than reconstructing prose; those earlier visits carry no snapshot and are labeled not-exactly-reproducible at export time.
- **Size limits:** `VISIT_EVENT_LOG_LIMITS` caps the log (1,000 events / ~2 MB resolved prose) and drops the oldest events past the cap; a full L1→L4 journey uses tens of events, so the caps only engage under pathological revisiting.
- **Privacy:** [`docs/VISIT_HISTORY_PRIVACY.md`](../VISIT_HISTORY_PRIVACY.md) documents what the log stores, that it stays on-device and is never transmitted, its bounds, and that reset clears it.

**Evidence**

- `src/domain/hash/sha256.test.ts` (4): empty, `abc`, multi-block, and UTF-8 vectors. `src/domain/progress/visitEvents.test.ts` (8): guard-valid build, sha256 hash format, beats/bridge/choice threading, idempotency, distinct L3 fragments, and both size-limit trims. `src/domain/progress/saveState.test.ts` adds the `1.3.0` visit-events migration case.
- Local verification on Node `22.22.2`: `type-check` pass; `lint:ci` 0 errors / 32 warnings (baseline held); `test:run` 52 files / 288 tests passed (was 275; +13); `story:package:validate` all valid with `eternal-return@1.1.0` hash `d596c66da6392e145872eb3a1fff3b248e88fee5b9343d2a61109ff8815a1062` unchanged; `build` pass. Save/reload Chromium journeys (`reader-journey`, `phase-3-path-coverage`) pass against the installed browser, including the byte-identical saved-state reload proof.
- New identity: save schema `1.3.0` (deliberate, migrated from `1.2.0`). Story Package, SelectionReason, literary release, and all prose digests unchanged. No authored runtime prose or manuscript prose changed.

## Batch 4.4 — accessible journey export

**Status: complete.**

**Acceptance gate**

- A complete L1→L4 journey exports without omissions or reordering.
- Export works offline and contains no internal IDs unless a diagnostic option is chosen.

**Delivered**

- `src/domain/export/journeyExport.ts` — pure, deterministic builders that read the `visitEvents` log (ADR 0004) and render the exact resolved prose in experienced order, never re-running selection or reading current content:
  - `buildJourneyMarkdown` — title page (story title/author, package identity, app + save versions, endings reached, injected export timestamp), passages in order with ordinal or ledger-title headings, optional adaptation notes (from the Phase 3 reason), and the content-license notice. No internal IDs unless `diagnostic` is set.
  - `markdownToHtml` + `buildJourneyPrintHtml` — a self-contained, offline, accessible print-friendly HTML document (document language, semantic headings, print `@media` CSS, no external references or scripts). `markdownToHtml` mirrors `MarkdownContent` exactly (frontmatter strip, paragraph split, bold-then-italic with italic only on non-bold segments) and HTML-escapes every emitted segment, so the print view matches the on-screen reading.
  - `journeyExportFilename` — deterministic, diacritic- and unsafe-character-sanitized filenames; `buildJourneyTitleMap` joins reader-safe passage titles from the aligned selection ledger by the shared `(sequence, nodeId, fragmentLabel)` key.
- Store actions `exportJourneyMarkdown` / `exportJourneyPrintHtml` build from persisted state with an injected timestamp; `src/utils/journeyDownload.ts` performs the browser-only download / new-tab open (isolated from the pure builders). `JourneyExportActions` adds accessible, user-initiated "Export journey (Markdown)" and "Print-friendly view" controls inside the focus-trapped progress dialog, disabled until a journey exists, explaining that history stays on-device.
- EPUB/PDF deferred per the roadmap until Markdown and print HTML are stable.
- Known limitation: faithful export of authored _edge prose_ additionally requires storing the resolved bridge text in the snapshot; this lands with the 4.6 editorial pass that authors bridges (no bridges ship today, so no edge prose is omitted).

**Evidence**

- `src/domain/export/journeyExport.test.ts` (23) covers ordering with L3 fragments, revisits, endings, empty/migrated labeling, snapshot-over-current-content, Unicode + long passages, no-IDs-by-default vs diagnostic, title enrichment, determinism/byte-identity, `markdownToHtml` bold/italic/escape/frontmatter and no-live-tags, print-HTML offline/self-contained, and filename sanitization. `src/components/Layout/JourneyExportActions.test.tsx` (3) covers the accessible download/print actions and the disabled empty state.
- Adversarial multi-lens review workflow (determinism, ID-leak/injection, ordering/omissions/migration, on-screen parity, accessibility/offline) with independent per-finding verification confirmed four issues, all fixed: a WCAG 2.5.3 label-in-name mismatch on the export buttons (accessible name now equals the visible label); per-passage `<section aria-label>` region-landmark proliferation (now `<article>`); two independent export-timestamp clock reads (now one click-time timestamp threaded through filename and document); and a partially-migrated/size-trimmed log that renumbered from 1 with no warning (now emits an "earlier passages not captured" notice, covered by tests). The determinism-in-builder, on-screen-parity, and HTML-injection lenses found nothing.
- Local verification on Node `22.22.2`: `type-check` pass; `lint:ci` 0 errors / 32 warnings (baseline held); `test:run` 54 files / 316 tests passed (was 288; +28); `story:package:validate` all valid with `eternal-return@1.1.0` hash `d596c66da6392e145872eb3a1fff3b248e88fee5b9343d2a61109ff8815a1062` unchanged; `build` pass. Save/reload and progress-dialog Chromium journeys (`reader-journey`, `responsive-experience`) pass against the installed browser. No authored prose, Story Package, save schema, or literary release change.

## Batch 4.5 — Leibniz parity/rejection review (archive gate)

**Status: gate satisfied except owner acceptance.** Conditions 1–6 are met and evidenced; condition 7 (owner acceptance) is the pending gate that blocks Batch 4.6. No archive action taken.

**Explicit rejections recorded** in [ADR 0005](../adr/0005-project-leibniz-rejected-architectures.md): Project-Leibniz's Express/Mongoose/MongoDB backend, the React Context/reducer journey-state tree, the mutable module-singleton rule engine, and the D3 force-map visual — each with rationale and the Narramorph replacement.

**Method:** the full [parity review](PHASE_4_LEIBNIZ_PARITY.md) re-ran the extraction-matrix inventory against Project-Leibniz (read-only clone at `4f3f4600b8782aac5000b45dd64378baf318e1df`). Each of the nine capabilities was assessed by one agent and adversarially verified by a second (18 agents); **all nine dispositions were verified CONFIRMED** — six migrated (conditions, explanations, prose beats, edge prose, journey export, adaptation ledger), three rejected (backend, Context state, D3 visual). Deliberate divergences (rejected generic flags, reader-safe single-explanation surface, bounded single-alternative edges, byte-preserving beat joins, deferred edge-prose-in-export) are recorded in the parity doc as intentional choices, not missing migrations. A behavior-named end-to-end regression `src/domain/reader/journeyPipeline.test.ts` proves the ported capabilities interoperate (condition-selected phrasing → snapshot → exact export across revisits).

### Project-Leibniz archive-gate conditions

Project-Leibniz may be archived only when all seven are proven **and** the owner accepts the Narramorph implementations:

1. every extraction-matrix item is migrated or rejected — **SATISFIED** (9/9 dispositioned and verified; [matrix](FEATURE_EXTRACTION_MATRIX.md) updated);
2. Narramorph has no runtime/build dependency on Project-Leibniz — **SATISFIED** (no `project-leibniz`/`mongo`/`express`/`mongoose` references in `src/`/`tools/` or either `package.json`);
3. Narramorph's replacement features pass unit and browser tests — **SATISFIED** (unit suite green; Phase 3/4 Chromium journeys pass);
4. source attribution and licensing are complete — **SATISFIED** (clean-room reimplementations; extraction matrix, ADR 0003/0005, `docs/PROVENANCE.md`, licenses; Project-Leibniz frozen with its own license/notice);
5. Project-Leibniz's credential has been rotated/revoked — **SATISFIED** (Batch 0.2: compromised Atlas user and both IP access-list entries deleted; no credential in-repo);
6. open issues have been migrated or closed — **SATISFIED** (Project-Leibniz has zero open issues; authoritative backlog is in Narramorph);
7. the owner has accepted the Narramorph implementations — **PENDING** (owner action; blocks Batch 4.6).

**Evidence**

- [Phase 4 Leibniz parity review](PHASE_4_LEIBNIZ_PARITY.md), [ADR 0005](../adr/0005-project-leibniz-rejected-architectures.md), updated [extraction matrix](FEATURE_EXTRACTION_MATRIX.md), and the behavior-named regression `src/domain/reader/journeyPipeline.test.ts` (4 tests).
- Local verification on Node `22.22.2`: `type-check` pass; `lint:ci` 0 errors / 32 warnings (baseline held); `test:run` 55 files / 320 tests passed (was 316; +4); `story:package:validate` `eternal-return@1.1.0` hash `d596c66da6392e145872eb3a1fff3b248e88fee5b9343d2a61109ff8815a1062` unchanged; `build` pass. No runtime code, authored prose, Story Package, save schema, or literary release change.

## Batch 4.6 — archive Project-Leibniz

**Precondition:** Batch 4.5 gate fully satisfied and owner acceptance recorded. Not started.

**Bundled editorial pass:** by owner decision, the deferred authored-prose work from Batches 4.1 (one reference beat conversion per perspective) and 4.2 (bridge prose that makes a journey read more smoothly) is authored and approved here, together with the archive, rather than earlier. Each authored change follows the ADR 0002 approval workflow with recorded provenance.

**Evidence**

- Final `reference-final` tag, README archive notice, issue disposition, secret/deploy-hook removal, and GitHub archive toggle (history preserved): _TBD_.

## Closure evidence

- _TBD_ once Batches 4.1–4.6 meet their gates and epic [#93](https://github.com/zekusmaximus/Narramorph/issues/93) is updated.
