# Phase 7 execution record

Phase 7 turns the capabilities integrated across Phases 0–6 into **one intentional end-to-end reader product** rather than a collection of imported features (roadmap Phase 7, batches 7.1–7.5). This document is the running evidence record (mirrors [PHASE_5_EXECUTION.md](PHASE_5_EXECUTION.md) and [PHASE_6_EXECUTION.md](PHASE_6_EXECUTION.md)); it is updated as batches land and the epic [#93](https://github.com/zekusmaximus/Narramorph/issues/93) is ticked only at merge.

**Status: Batches 7.1, 7.2, and 7.3 — implemented on the feature branch (7.1's + 7.3's usability passes and the 7.5 manual-AT passes remain owner/tester-run).** 7.1 unified the lexicon, the four-axis progress model, 2D/3D reader parity, and the one-time revisitation hint. 7.2 made the reader **hash-addressable** (browser Back closes it; passages bookmarkable) while preserving `useDialogFocus` and exact visit semantics (a `restoreStoryView` path that never records a spurious visit), added reliable scroll restoration for interrupted reads, a line-height preference, back-to-top, and a print stylesheet — keeping passages whole per the measured evidence. 7.3 added an include/exclude-adaptation-notes export preference + a milestone "save your journey" export at endings, keeping "Why this version?" a collapsed secondary disclosure. No contract identity has moved (the new preferences are additive/defaulted; no package/save-schema change).

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

**Complete on the feature branch.** Design proposed before code (grounded in measured content data) and both owner confirmations received: **[PHASE_7_2_LONG_PASSAGE.md](PHASE_7_2_LONG_PASSAGE.md)**.

- **Measured:** 1,305 content strings — median ~1,221 words (~6 min); 935 are 5–10 min; only **7 exceed 3,000 words, all L4 endings (~43–48 min)**. L3 convergence is already segmented (`L3AssemblyView`). **0 of 1,305 passages have markdown headings** (unstructured literary prose).
- **Segmentation → keep passages whole** (owner-confirmed): no authored section structure exists and the long reads are unbroken endings; artificial/authored landmarks would be a content change (ADR 0002).

**What shipped (interface chrome only; no authored runtime prose; no package identity change):**

- **Hash-addressable reader (`useReaderRoute`, `#/passage/:nodeId`).** The open passage is reflected in the URL hash so **browser Back closes the reader** (no modal trap) and a passage is bookmarkable. A thin History-API sync — no router — that **preserves `useDialogFocus`** containment/restoration. Deep links open an available passage (a base map entry first, so Back returns to the map) and land on the map for unknown/locked/L3 targets. Mounted once in `Home`.
- **Exact visit semantics preserved via `restoreStoryView`.** Browser-history navigation (Back/Forward/reload/deep-link) **restores** the reader without recording a new visit — no `visitNode`, no `activeVisit`, so no new `selectionRecord`/`VisitEvent` and no variation-dedup mutation. Only a deliberate click/continuation (`openStoryView`) records a visit. Saved-journey identity is unchanged.
- **Reliable scroll restoration (`scrollMemory`, device-local `sessionStorage`, off the save schema).** Scroll is remembered per node and **restored only on a URL restore** (via the store's `lastReaderOpenWasRestore` flag); a deliberate open starts at the top. An interrupted long read (reload mid-passage) resumes the same passage and offset. Keyed by node (not variation) so a restore that re-selects a different variation still resumes near the reader's place.
- **Line-height preference.** `lineHeight` (`cozy`/`normal`/`relaxed`) added to `UserPreferences` — **additive and defaulted** (absent → `normal`; no save-schema version bump) — plus a Settings control (Cozy/Normal/Airy). A shared `readingSurfaceClass` decouples font size (text size) from leading (line height) across the 2D and 3D readers. Text-size ordering (small < medium < large) is retained.
- **Back-to-top + visible progress.** A keyboard-reachable, reduced-motion-safe "Back to top" control appears once a passage is scrolled down; the shipped passage-progress bar stays.
- **Print stylesheet.** `@media print` drops the app chrome and lets the whole passage flow across pages (the on-screen reader is a fixed, clipped modal).

### Gate evidence (local, Node 22, on the feature branch)

- `type-check`: pass. `lint:ci`: **0 errors / 0 warnings** (baseline held).
- `test:run`: **415 tests pass** (7.2 added `readingTypography` 3, `scrollMemory` 3, `parseReaderHash` 2; net +8 over 7.1's 407, minus one consolidated scroll test). Conversion/tools suite: **160** (unchanged).
- `story:package:validate`: `eternal-return@1.3.0` hash `80f3d5a2…` (unchanged). `content:validate:runtime`: 8. `content:validate:canon:strict`: **errors=0**, warnings=6116, waived=31 (baseline exact). `literary:validate` / `literary:slice:validate`: valid against `v1.0.2`.
- `build`: pass. `bundle:check`: pass — CSS **69.58 KiB / 13.17 KiB gzip**, under the 72,500 / 13,700 budget (the print block + line-height + back-to-top classes; no budget change needed). **No package or save-schema identity moved** (line-height is additive/defaulted; scroll + reader-route state are device-local/transient).
- Playwright via the throwaway sandbox-Chromium (1194) override config (deleted, never committed): **functional suite 21/21 passed, real exit code 0**, including the new `reader-longpassage` spec — hash-addressable open + **browser Back closes the reader**, deep-link/bookmark (available opens; unknown/locked land on the map), and **interrupted-session resume** (reload mid-read restores the same passage + scroll + back-to-top). `performance-boundaries` remains sandbox-CPU-limited and runs on real hardware in protected-main CI.

## Batch 7.3 — Integrate explanations and export without overwhelming the prose ([#173](https://github.com/zekusmaximus/Narramorph/issues/173))

**Complete on the feature branch (the disclosure usability pass is owner-run).** Much of the gate was already met — "Why this version?" is a collapsed native `<details>` after the passage, the adaptation ledger is collapsed with the Phase 3 category-level, reader-safe `SelectionReason` copy, and the export domain already supports `includeAdaptationNotes`. 7.3 closed the remaining deltas. Interface chrome only; no authored runtime prose (ADR 0002); no package or save-schema identity change.

**What shipped:**

- **Include/exclude adaptation notes in exports.** A persisted, additive/defaulted `includeAdaptationNotesInExport` preference (absent → true; no save-schema bump) with an inline toggle beside the export actions, threaded into the store's `exportJourneyMarkdown`/`exportJourneyPrintHtml` (the domain builders already honoured the option). The exported Markdown/print document includes or omits the "why this version" line accordingly.
- **Export at a milestone (endings).** A shared `useJourneyExport` hook backs both entry points; a new `JourneyMilestone` ("You've reached an ending — save your journey") appears in the reader at L4 endings (2D and 3D), reusing the same on-device export — a non-nagging milestone in addition to the progress-dialog export. It never interrupts prose and only shows once there is something to export.
- **Kept "Why this version?" secondary and the ledger literary.** The reader disclosure stays collapsed and after the passage; the aggregate ledger stays in progress history. The ledger copy already reads as reflection (the `SelectionReason` templates are literary, ID-free, canon-quote-free), so no copy change was needed — confirmed against its tests.
- **Usability protocol (owner-run — the gate; not fabricated).** Moderated protocol to test whether the explanations _enhance understanding_ or _prematurely expose mechanics_: with a first-time reader who never opens a disclosure, confirm uninterrupted reading; then ask a curious reader to find "why this version" after a passage and the aggregate ledger; confirm neither felt intrusive and that export at the ending read as an invitation, not a nag. Findings recorded here when the owner runs it.

### Gate evidence (local, Node 22, on the feature branch)

- `type-check`: pass. `lint:ci`: **0 errors / 0 warnings** (baseline held).
- `test:run`: **418 tests pass** (7.3 added `JourneyMilestone` 2 and a `JourneyExportActions` notes-toggle test; the domain omit-notes path was already covered by `journeyExport.test`). Conversion/tools suite: **160** (unchanged).
- `story:package:validate`: `eternal-return@1.3.0` `80f3d5a2…` (unchanged). `canon:strict`: **errors=0**, warnings=6116, waived=31. `literary`/`slice`: valid against `v1.0.2`. `content:validate:runtime`: 8.
- `build`: pass. `bundle:check`: pass — CSS **69.77 KiB / 13.20 KiB gzip**, under the 72,500 / 13,700 budget. **No package or save-schema identity moved** (the notes preference is additive/defaulted).
- Playwright via the throwaway sandbox-Chromium (1194) override config (deleted, never committed): **functional suite 21/21 passed, real exit code 0** — the ending-reaching journeys exercise the new milestone without disrupting the ending flow; the export toggle + milestone are unit-tested.

## Batches 7.4–7.5 — not yet started

- **7.4 — Persistence, recovery, reader control.** Finalize save-schema versioning; explicit "new journey", reset confirmation, export-before-reset, corrupt-save recovery, storage-quota handling, consent-respecting migration telemetry; import of a machine-readable save (extend `importProgress`/`exportProgress`, distinct from the literary Markdown export). Identity-pin checklist applies if the save schema bumps.
- **7.5 — Manual accessibility + inclusive-design validation.** Manual AT passes (owner/external); automate what is automatable (axe/keyboard/reduced-motion e2e); validate the graph's semantic alternative (2D map + SceneNodeList); release accessibility checklist + public accessibility statement with known limitations; fix blockers before beta.
