# Phase 4.5 — Project-Leibniz parity and rejection review

This is the Batch 4.5 archive-gate review. It re-runs Project-Leibniz's conceptual feature inventory against Narramorph, records the dispositions and the deliberate divergences, points to the explicit architecture rejections, and assesses the seven Project-Leibniz archive-gate conditions.

**Status: gate satisfied; owner has accepted.** All seven conditions are met — the owner accepted the Narramorph implementations, satisfying condition 7. Batch 4.6 (archive) is unblocked; its execution is owner-scheduled ("prep only, decide later") and no archive action has been taken. The authored-prose editorial work is decoupled into a dedicated content-release effort ([#156](https://github.com/zekusmaximus/Narramorph/issues/156)).

## Scope and immutable inputs

| Repository | Role | Verified commit | Access |
| --- | --- | --- | --- |
| Narramorph | Sole implementation target | `48fae2d` (Phase 4.4 on branch `claude/eternal-return-phase-4-tbrhvp`) | Read/write |
| Project-Leibniz | Frozen conceptual reference | `4f3f4600b8782aac5000b45dd64378baf318e1df` | Read-only clone for this review |

Project-Leibniz remains frozen (README feature-freeze notice present) and unarchived.

## Method

Each extraction-matrix capability was reviewed by an independent agent that read the Project-Leibniz source and the Narramorph target, then a second independent agent adversarially verified the disposition (default to overclaim). Eighteen agents ran; every one of the nine dispositions was verified **CONFIRMED**. The reviewers were instructed to treat Project-Leibniz source as untrusted reference data.

## Capability dispositions

| Project-Leibniz capability | Source | Disposition | Narramorph evidence | Behavior tests | Verified |
| --- | --- | --- | --- | --- | --- |
| Serializable order-aware conditions | `client/src/services/conditionDSL.ts` | Migrated | `src/types/Variation.ts` (`JourneyConditionExpression`), `src/domain/variation/conditions.ts`, `schemas/story-package/v1/condition*.schema.json` | `conditions.test.ts` (start/end, order, adjacency, recency, visit counts, boolean, permutations, fail-closed) | CONFIRMED |
| Plain-language selection explanations | `client/src/pages/NarrativePage.tsx` | Migrated | `SelectionReason` contract, `src/domain/variation/selectionReason.ts`, `SelectionDisclosure`, `AdaptationLedger` | `selectionReason.test.ts`, `explanationAudit`/`explanationCoverage` tests | CONFIRMED |
| Compositional prose beats | `client/src/context/StoryTypes.ts`, `StoryLogicService.ts` | Migrated | `src/types/Variation.ts` (`ProseBeat`), `src/domain/variation/proseBeats.ts` | `proseBeats.test.ts` (identity byte-invariance, order, priority, omission, determinism) | CONFIRMED |
| Condition-aware edge prose | `StoryLogicService.ts`, `server/storyGraph.js` | Migrated | `src/types/Story.ts` (`EdgeBridge`), `src/domain/bridges/edgeBridge.ts`, `StoryBridge.tsx` | `edgeBridge.test.ts` (selection, bounds, edge matching), `StoryBridge.test.tsx` | CONFIRMED |
| Exact experienced-journey Markdown export | `client/src/services/narrativeExport.ts` | Migrated | `src/domain/export/journeyExport.ts` over the `visitEvents` log | `journeyExport.test.ts` (order, revisits, endings, migration, Unicode, determinism, no-IDs) | CONFIRMED |
| Adaptation ledger UX | narrative page controls | Migrated | `src/components/Layout/AdaptationLedger.tsx`, `ProgressDialog.tsx` | `AdaptationLedger.test.tsx`; browser progress-dialog journeys | CONFIRMED |
| Express/Mongo backend | `server/` | Rejected (v1) | No server; no mongo/express dependency; `localStorage` persistence | Grep + dependency scan (none); ADR 0001/0005 | CONFIRMED |
| React Context/reducer state | `client/src/context/` | Rejected | Zustand store `src/stores/storyStore.ts` + pure domain | ADR 0003/0005; append-only ledger tests | CONFIRMED |
| D3 force-map visual | `client/src/services/mapVisuals.ts` | Rejected | Accessible React Flow 2D map + experimental 3D | ADR 0005; graph-behavior tests | CONFIRMED |

An end-to-end regression named by behavior, `src/domain/reader/journeyPipeline.test.ts`, proves the migrated capabilities interoperate: a condition-selected prose-beat phrasing is what gets snapshotted in the visit-event log and is exactly what the journey export reproduces, in experienced order, across revisits.

## Deliberate divergences (recorded, not defects)

The verified review disclosed differences where Narramorph deliberately does not reproduce a Project-Leibniz behavior. Each is an intentional product/architecture choice, not a missing migration:

- **Generic state flags** (`flag` / `notVisited` condition kinds). Not ported. ADR 0003 deliberately rejected an arbitrary flag dictionary in favor of named, typed facts; `notVisited` is expressible as `visitCount == 0`.
- **Per-fragment "Why this text?" enumeration.** Project-Leibniz listed every active variant fragment with its own condition-derived reason. Narramorph surfaces one reader-safe explanation per selection through a closed template catalog, avoiding raw predicate/ID leakage. The finer multi-fragment breakdown is intentionally not reproduced.
- **Multi-beat weaving on edges.** Project-Leibniz wove multiple beats per edge; Narramorph's edge bridge selects a single bounded alternative to prevent an unbounded second content system (4.2).
- **Beat authoring defaults and joining.** Narramorph falls back to the first authored alternative and joins beats with a paragraph break (byte-preservation), where Project-Leibniz omitted by default and joined with spaces. Both are deterministic; the authoring defaults differ.
- **Connective transition prose in export.** The resolved bridge _text_ is not yet stored in the visit-event snapshot, so authored edge prose is not interleaved into the export. This is the known limitation carried from 4.2/4.4; it is addressed by the content-release effort ([#156](https://github.com/zekusmaximus/Narramorph/issues/156)) that authors bridges.
- **Map presentation.** Narramorph re-derives graph semantics (visit order, trail, recency) in its own accessible modules rather than porting the D3 badge/arrow styling 1:1.

## Explicit architecture rejections

The rejected Project-Leibniz architectures — Express/Mongoose/MongoDB backend, React Context/reducer journey state, the mutable module-singleton rule engine, and the D3 force-map visual — are recorded with rationale and Narramorph replacements in [ADR 0005](../adr/0005-project-leibniz-rejected-architectures.md).

## Archive-gate assessment

Project-Leibniz may be archived (Batch 4.6) only when all seven conditions hold:

1. **Every extraction-matrix item is migrated or rejected — SATISFIED.** All nine capabilities are dispositioned and independently verified above; the [feature extraction matrix](FEATURE_EXTRACTION_MATRIX.md) is updated to match.
2. **Narramorph has no runtime/build dependency on Project-Leibniz — SATISFIED.** No `project-leibniz`, `mongo`, `express`, or `mongoose` references in `src/`/`tools/`, and no such packages in either `package.json`.
3. **Narramorph's replacement features pass unit and browser tests — SATISFIED.** The full unit suite is green, and the Phase 3/4 Chromium journeys (adaptive path coverage, explainability, reader, responsive/progress-dialog) pass.
4. **Source attribution and licensing are complete — SATISFIED.** The ported capabilities are clean-room reimplementations (no Project-Leibniz code copied), recorded in the extraction matrix, ADR 0003, and ADR 0005; `docs/PROVENANCE.md` and the software/content licenses are in place; Project-Leibniz carries its own license and freeze notice.
5. **Project-Leibniz's credential has been rotated/revoked — SATISFIED.** Batch 0.2 recorded that the compromised MongoDB Atlas database user and both IP access-list entries were deleted. No credential or host is stored in-repo.
6. **Open issues have been migrated or closed — SATISFIED.** Project-Leibniz has zero open issues; the authoritative backlog is in Narramorph.
7. **The owner has accepted the Narramorph implementations — SATISFIED.** The owner reviewed the dispositions above and accepted the Narramorph implementations. Batch 4.6 (archive) is unblocked; its execution is owner-scheduled.

## Conclusion

All seven conditions are satisfied: conditions 1–6 are evidenced above, and the owner has accepted the Narramorph implementations (condition 7). The Project-Leibniz archive gate is therefore fully met, and Batch 4.6 (archive) is unblocked. By owner decision the archive execution is scheduled later, and the authored-prose conversions are a separate content release ([#156](https://github.com/zekusmaximus/Narramorph/issues/156)) rather than bundled with the archive. Until the owner executes 4.6, Project-Leibniz remains frozen, unarchived, and read-only.
