# Phase 7 execution record

Phase 7 turns the capabilities integrated across Phases 0–6 into **one intentional end-to-end reader product** rather than a collection of imported features (roadmap Phase 7, batches 7.1–7.5). This document is the running evidence record (mirrors [PHASE_5_EXECUTION.md](PHASE_5_EXECUTION.md) and [PHASE_6_EXECUTION.md](PHASE_6_EXECUTION.md)); it is updated as batches land and the epic [#93](https://github.com/zekusmaximus/Narramorph/issues/93) is ticked only at merge.

**Status: Batch 7.1 — implemented (usability gate is owner/tester-run). Batch 7.2 — design proposed, awaiting owner confirmation before code.** 7.1's lexicon unification, four-axis progress model, 2D/3D reader parity, and one-time revisitation hint are implemented (design in [PHASE_7_1_CANONICAL_JOURNEY.md](PHASE_7_1_CANONICAL_JOURNEY.md); owner accepted all four forks). 7.2's long-passage design — grounded in measured content data (only the 3 L4 endings are genuinely long; 0/1,305 passages have section structure) — recommends keeping passages whole with scroll restoration + hash-addressability + a line-height preference ([PHASE_7_2_LONG_PASSAGE.md](PHASE_7_2_LONG_PASSAGE.md)). No contract identity has moved.

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

**Complete on the feature branch (usability gate is owner/tester-run).** The design was proposed before any code (product/architecture fork) and is in **[PHASE_7_1_CANONICAL_JOURNEY.md](PHASE_7_1_CANONICAL_JOURNEY.md)**: the authoritative first-run state map, the label-consistency inventory + single lexicon, the four-axis progress model, the revisitation-discovery options, the duplicate/history-only controls to reconcile, the moderated first-time-usability script (the gate), and the surfaced 7.2 reader-architecture fork.

**Owner decisions (accepted; see the design doc §8):** (1) content unit = **"passage"** (reserving "fragment" for the in-fiction artifact), recommended lexicon defaults for the rest; (2) **four-axis** progress model; (3) revisitation **option B** (marker + one-time dismissible hint); (4) reader architecture = **history-synced modal (hash-addressable)** — 7.1 reconciles the 2D/3D reader consistently; the history/hash wiring lands in 7.2.

**What shipped (interface chrome only; no authored runtime prose, ADR 0002):**

- **One lexicon across 2D / 3D / progress / reader.** The content unit is **"passage"** everywhere (retiring the UI-unit senses of "fragment"/"node"); the aggregate coverage verb is **"opened"** (retiring "encountered"/"traced"/"charted"/"veiled"/"illuminated"), while per-passage return count stays "visit N" (a distinct concept). Unavailable is **"locked"**; the map is **"Story map"** (2D) / **"Story map (3D view)"** / **"Passage list"** (the 3D companion). The reader's close is one pair — icon **"Close"** + text **"Return to map"** — identical in both readers. Perspective names use the full "The …" set everywhere (fixing the progress "By perspective" list, which used "Human"). Touched: `AppFooter`, `AppHeader`, `layoutPresentation`, `NodeMap`, `NodeMapHud`, `NodeTooltip`, `StoryNodeAncillary`, `SceneNodeList`, `NarromorphCanvas`, `StoryHeader`, `ContentPanel3D`, `OpeningExperience`, `Home`, `storyPresentation`, the onboarding copy (`introContent`), and the coupled focus-restore selectors in `StoryView`/`L3AssemblyView`. The intro was materially reworded, so `INTRO_VERSION` bumped `1 → 2` (device-local; off the save schema). One a11y-naming fix: the map HUD status region became **"Map reading status"** so it does not substring-collide with the "Story map" region.
- **Four-axis progress model.** `buildProgressSummary` (in `progressPresentation.ts`, unit-tested) derives **passages opened / paths explored / endings reached / adaptations discovered** from existing `UserProgress` data; `ProgressDialog` shows those four tiles and the near-synonym percentages ("Archive charted" / "World explored") are gone. The single headline percentage stays in the footer.
- **2D/3D reader parity.** `ContentPanel3D` now shares the 2D reader's entry **bridge** (`StoryBridge`) and **continuation footer** (`StoryFooter`, so a branch can be followed in 3D), records the full visit selection (beats/bridge/reader-choice) for export parity, uses one reading-time source, and drops the divergent live "Time spent" timer. Close/return labels match the 2D reader.
- **Revisitation discovery (option B).** A single, dismissible **`RevisitHint`** appears once the reader has opened a passage and is back on the map (never while reading, never before there is anything to revisit, never again once dismissed), backed by a device-local `narramorph-revisit-hint-seen` marker (`revisitHint.ts`, off the save schema). It is `pointer-events-none` except its dismiss button, so it never blocks the map; opened passages carry the accessible "opened" status on the map and in the list.
- **Picker recedes after the reader has begun.** `OpeningExperience` tightens (smaller cap, dropped eyebrow, smaller title) once the reader has any visits, so the map is the primary surface on return.

**Usability gate (owner/tester-run — not fabricated).** The moderated first-time session and the label-consistency walk-through are the [design doc §7](PHASE_7_1_CANONICAL_JOURNEY.md) protocol; their real findings will be recorded here when the owner runs them.

### Gate evidence (local, Node 22, on the feature branch)

- `type-check`: pass. `lint:ci`: **0 errors / 0 warnings** (baseline held).
- `test:run`: **407 tests pass** (was 395; +12 — `buildProgressSummary` 2, `revisitHint` 5, `RevisitHint` 5; renamed/updated assertions elsewhere). Conversion/tools suite: **160** (unchanged; no content code touched).
- `story:package:validate`: `eternal-return@1.3.0` hash `80f3d5a2…` (identity unchanged). `content:validate:runtime`: 8. `content:validate:canon:strict`: **errors=0**, warnings=6116, waived=31, expired=0 (baseline exact). `literary:validate` / `literary:slice:validate`: valid against `eternal-return@1.3.0` / `eternal-return-literary-v1.0.2`.
- `build`: pass. `bundle:check`: pass — CSS **68.53 KiB / 12.98 KiB gzip**, under the 72,500 / 13,700 budget (no budget change needed). No package or save-schema identity moved; no dependency on P.
- Playwright via the throwaway sandbox-Chromium (1194) override config (deleted, never committed): the **functional suite is 18/18 passed, real exit code 0** (all specs except the CPU-sensitive performance-boundaries). Updated/verified coverage: first-run intro (passage lexicon), the reader journey with the unified **Close**/**Return to map** labels, the 2D **"Story map"** region + 3D **"Story map (3D view)"** / **"Passage list"** naming (and the a11y-name-collision fix for the map status region), keyboard focus containment/restoration, responsive/200%-text, reduced-motion, and the WebGL-loss → 2D fallback. The `performance-boundaries` LCP checks are **environment-limited in the sandbox** (measured ~13 s vs the 3 s / 8 s budgets under container CPU contention; `playwright.config` itself notes these need an uncontended profile) — **not a 7.1 regression** (nothing in 7.1 touches the initial bundle materially, and the revisit hint is not rendered on first load; `bundle:check` initial JS held under budget). They run on real hardware in protected-main CI's 17-scenario matrix.

---

## Batch 7.2 — Refine the long-passage reading experience ([#172](https://github.com/zekusmaximus/Narramorph/issues/172))

**Design proposed; awaiting owner confirmation before code.** Full proposal (grounded in measured content data): **[PHASE_7_2_LONG_PASSAGE.md](PHASE_7_2_LONG_PASSAGE.md)**. Key findings and direction:

- **Measured:** 1,305 content strings — median ~1,221 words (~6 min); 935 are 5–10 min; only **7 exceed 3,000 words, all L4 endings (~43–48 min)**. L3 convergence is already segmented (`L3AssemblyView`). **0 of 1,305 passages have markdown headings** (unstructured literary prose).
- **Segmentation fork → keep passages whole** (recommended): no authored section structure exists and the long reads are unbroken endings; artificial/authored landmarks would be a content change (ADR 0002), not 7.2 UX. Long-read comfort comes from scroll restoration + visible progress (already shipped) + line-height pref + back-to-top + hash-addressability.
- **Reader architecture** (owner-decided in 7.1): history-synced, **hash-addressable** modal (`#/passage/:nodeId`) so browser **Back closes the reader** and passages are bookmarkable, **preserving `useDialogFocus`** containment/restoration and exact visit semantics (Back = Close = finalize visit).
- **Scroll restoration** keyed by node + variation (device-local, off the save schema); **line-height** as an additive, defaulted `UserPreferences` field (no save-schema bump).

Owner confirmations requested before code: (1) keep passages whole; (2) line-height as an additive saved preference. See design doc §8.

## Batches 7.3–7.5 — not yet started

- **7.3 — Explanations + export without overwhelming prose.** "Why this version?" as secondary disclosure; concise literary ledger language; export at milestones/endings; a setting to include/exclude adaptation notes; usability-test disclosure.
- **7.4 — Persistence, recovery, reader control.** Finalize save-schema versioning; explicit "new journey", reset confirmation, export-before-reset, corrupt-save recovery, storage-quota handling, consent-respecting migration telemetry; import of a machine-readable save (extend `importProgress`/`exportProgress`, distinct from the literary Markdown export). Identity-pin checklist applies if the save schema bumps.
- **7.5 — Manual accessibility + inclusive-design validation.** Manual AT passes (owner/external); automate what is automatable (axe/keyboard/reduced-motion e2e); validate the graph's semantic alternative (2D map + SceneNodeList); release accessibility checklist + public accessibility statement with known limitations; fix blockers before beta.
