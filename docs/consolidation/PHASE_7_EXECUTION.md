# Phase 7 execution record

Phase 7 turns the capabilities integrated across Phases 0–6 into **one intentional end-to-end reader product** rather than a collection of imported features (roadmap Phase 7, batches 7.1–7.5). This document is the running evidence record (mirrors [PHASE_5_EXECUTION.md](PHASE_5_EXECUTION.md) and [PHASE_6_EXECUTION.md](PHASE_6_EXECUTION.md)); it is updated as batches land and the epic [#93](https://github.com/zekusmaximus/Narramorph/issues/93) is ticked only at merge.

**Status: Batch 7.1 (canonical reader journey) — design proposed, awaiting owner direction before code.** The canonical reader-journey state map, the label-consistency inventory across 2D / 3D / progress / reader, and the moderated first-time-usability script are drafted in [PHASE_7_1_CANONICAL_JOURNEY.md](PHASE_7_1_CANONICAL_JOURNEY.md). The 7.2 modal-reader-vs-route-addressable architecture fork is surfaced there for the owner to weigh in on before any 7.2 code. No runtime code has changed; no contract identity has moved.

## Scope and immutable inputs

| Repository | Role | Verified commit | Mutation policy |
| --- | --- | --- | --- |
| Narramorph | Sole implementation target | Phase 6 merge `145b79b` (PR [#170](https://github.com/zekusmaximus/Narramorph/pull/170); branch base) | Feature branch `claude/eternal-return-phase-7-yoq34q`; owner opens/merges PRs (merge commit, never squash) |
| Eternal_Return_Manuscript | Canonical literary/editorial source ("M") | accepted release `eternal-return-literary-v1.0.2` at `6870cae5` | Read-only; add only if 7.1/7.3 need approved character/voice terminology (M-R) |
| eternal-return-digital-self | Frozen visual/interaction prototype ("P") | `392eef6c` | Archived/frozen; N never fetches or depends on it (ADR 0001). Not needed for Phase 7 |

Tracking issues: Phase 7.1 — [#171](https://github.com/zekusmaximus/Narramorph/issues/171). Parent epic: #93.

## Contract identities to preserve (verified against committed bytes at start)

Phase 7 is UX/product work. It must not move any contract identity **except** that Batch 7.4 may deliberately bump the **save schema** (with the identity-pin checklist below). Verified on the branch base:

| Contract | Identity | Verification |
| --- | --- | --- |
| Story Package | `eternal-return@1.3.0`, schema `1.1.0`, content hash `80f3d5a210c5d2814b224c86ec6d47fe8b418408f7133ee337b66b8d535efb50` | `src/config/eternalReturnPackageIdentity.json` (exact match) |
| Concordance | schema `1.1.0`, `eternal-return.v1.json` sha256 `c779795f006879ec13a530a4da34202a4ce16a03ef96c7a7e11993486f2c7e36` | `sha256sum story-packages/concordance/eternal-return.v1.json` (matches the Phase 6 record) |
| Literary release (accepted) | `eternal-return-literary-v1.0.2` at M `6870cae5` | runtime package intentionally keeps `editorialReleaseId v1.0.1` as build-time provenance — do not "fix" |
| SelectionReason | `org.narramorph.selection-reason@1.0.0` | unchanged |
| VisitEvent | `org.narramorph.visit-event@1.0.0` (optional additive `bridgeText`) | `src/types` + ADR 0004 addendum |
| Save schema / app | save `1.3.0` (`CURRENT_SAVE_VERSION`), app `0.1.0` (`CURRENT_APP_VERSION`) | `src/domain/progress/saveState.ts` |

**Identity-pin checklist — if Batch 7.4 bumps the SAVE SCHEMA**, update/verify all of: `src/domain/progress/saveState.ts` (`CURRENT_SAVE_VERSION`) + its tests; the ordered `SaveMigration[]` path and its tests; and the e2e specs asserting saved-journey identity (`e2e/phase-2-vertical-slice.spec.ts`). Phase 7 must not touch **package** identity (the full package pin list is in [PHASE_6_EXECUTION.md](PHASE_6_EXECUTION.md)).

## Token discipline (owner directive)

No multi-agent audit fan-outs. This record and the batch designs are produced with direct file reads, mechanical validators, and inline verification. Ask before anything token-expensive.

## Gate baselines to hold (from the Phase 6 merge)

- `lint:ci` **0 errors / 0 warnings** (ceiling 120; hold 0/0).
- `test:run` **395** app tests; conversion/tools suite **160** tests.
- `content:validate:canon:strict` **errors=0**, waived **31**, warnings **~6,116**.
- CSS bundle budget `totalCssBytes` **72,500** / gzip **13,700** (`config/bundle-budgets.json` — raise deliberately with a documented reason only if a 7.x feature legitimately grows it).
- Core Chromium journeys green; protected-main CI additionally runs `literary:stage` / `literary:slice:stage` against `eternal-return-literary-v1.0.2` and the full 17-scenario matrix.
- Playwright in the sandbox: run via a throwaway override config pointing `executablePath` at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, capture the **real** exit code, then delete the config (never commit it). Pre-build first.

---

## Batch 7.1 — Define and implement the canonical reader journey ([#171](https://github.com/zekusmaximus/Narramorph/issues/171))

**Status: design proposed; awaiting owner direction before code.** This is a product/architecture-fork batch, so the design is proposed before any code per the Phase 4/5/6 workflow. The full proposal — the authoritative first-run state map, the label-consistency inventory, the restructured progress model, the revisitation-discovery options, the list of duplicate/history-only controls to remove, the moderated first-time-usability script (the 7.1 gate), and the surfaced 7.2 reader-architecture fork — is in **[PHASE_7_1_CANONICAL_JOURNEY.md](PHASE_7_1_CANONICAL_JOURNEY.md)**.

Owner decisions requested before code (see the design doc for full trade-offs):

1. **Canonical UI lexicon** — one term per concept (e.g. the content unit: "passage" vs "fragment", given "Fragment 2749-A" is a canonical in-fiction object).
2. **Progress model** — restructure the progress dialog to the four roadmap axes (passages opened / paths explored / endings reached / adaptations discovered).
3. **Revisitation discovery** — how prominently to signal that reopening a passage may change it, without forcing it.
4. **7.2 fork (surfaced now, decided before 7.2 code)** — keep the modal reader (hardened), history-sync the modal (hash-addressable), or migrate to a route-addressable reader.

No fabricated usability results: the moderated session and label walk-through are owner/tester-run; this record will capture their real findings when they run.

---

## Batches 7.2–7.5 — not yet started

- **7.2 — Long-passage reading.** Blocked on the reader-architecture decision surfaced in 7.1. Then: landmarks, visible progress, scroll restoration, text-size/line-height/theme prefs, continuation actions, no modal traps; preserve exact visit semantics; test print/selection/zoom/mobile/keyboard/ interrupted sessions.
- **7.3 — Explanations + export without overwhelming prose.** "Why this version?" as secondary disclosure; concise literary ledger language; export at milestones/endings; a setting to include/exclude adaptation notes; usability-test disclosure.
- **7.4 — Persistence, recovery, reader control.** Finalize save-schema versioning; explicit "new journey", reset confirmation, export-before-reset, corrupt-save recovery, storage-quota handling, consent-respecting migration telemetry; import of a machine-readable save (extend `importProgress`/`exportProgress`, distinct from the literary Markdown export). Identity-pin checklist applies if the save schema bumps.
- **7.5 — Manual accessibility + inclusive-design validation.** Manual AT passes (owner/external); automate what is automatable (axe/keyboard/reduced-motion e2e); validate the graph's semantic alternative (2D map + SceneNodeList); release accessibility checklist + public accessibility statement with known limitations; fix blockers before beta.
