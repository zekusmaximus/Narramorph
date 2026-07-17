# Phase 6 execution record

Phase 6 extracts visual/onboarding value from the frozen prototype `eternal-return-digital-self` ("P") and archives it (roadmap Phase 6, batches 6.1–6.6), **after** a focused **Track A** PR clears the Phase 5 carry-overs. This document is the running evidence record (mirrors [PHASE_5_EXECUTION.md](PHASE_5_EXECUTION.md)); it is updated as batches land and the epic [#93](https://github.com/zekusmaximus/Narramorph/issues/93) is ticked only at merge.

**Status: Track A complete on the feature branch — content release `eternal-return@1.3.0`, CTR-012 resolved, and CTR-010 resolved via literary release `eternal-return-literary-v1.0.2`; the 32 lint warnings are cleared (0/0); Batch 6.1 (extraction audit) is complete; Batch 6.2 (first-run introduction) is complete; Batch 6.3 (design tokens + cosmic atmosphere) is complete pending the owner's visual-direction acceptance; Batch 6.4 (3D profiling + semantic node list) is complete; Batch 6.5 (archive-gate review) is complete with conditions 1–6 met (conditions 5 and 7 owner-gated); 6.6 (archive P) is prepped and awaits the owner's go-ahead.**

## Scope and immutable inputs

| Repository | Role | Verified commit | Mutation policy |
| --- | --- | --- | --- |
| Narramorph | Sole implementation target | Phase 5 merge `a8fd8e5ca18fddacac2e2647959479da393b78a9` (branch base) | Feature branch `claude/eternal-return-phase-6-ffg0ql`; owner opens/merges PRs |
| eternal-return-digital-self | Frozen visual/interaction prototype ("P") | `392eef6c6f87b8064c8cc51d91b6f029b0e32d5b` (read-only clone) | Read-only reference; reimplement concepts clean-room in N (ADR 0001) |
| Eternal_Return_Manuscript | Canonical literary/editorial source ("M") | pinned to the accepted release `sourceCommit` `6720e76…` | Read-only; the CTR-010 slice re-issue is owner-gated |

Tracking issues: [#162](https://github.com/zekusmaximus/Narramorph/issues/162) (Phase 6 parent), [#163](https://github.com/zekusmaximus/Narramorph/issues/163) (Track A). Parent epic: #93.

## Decisions taken (recorded for owner review; reversible)

The interactive plan-approval question could not be delivered in a non-interactive session, so the following were adopted with documented, reversible defaults:

- **D-6A1 — Bridge siting.** The pre-approved wording is intrinsically cross-perspective (archaeologist → Algorithm), but the graph has only within-perspective edges. Sited on the real within-perspective edge `algo-L1 → algo-L2-invest`, gated `orderSeen[arch-L1, algo-L1]` with `omitWhenUnmatched`, so the wording only renders for a reader who actually crossed from the archaeologist into the Algorithm. Wording applied verbatim (pre-approved, #156 + D9).
- **D-6A2 — Return-reader beat placement.** Prepended as an opening frame (matches the "returns… once more" phrasing), over an always-qualifying body beat that preserves the original passage byte-for-byte.
- **D-6A3 — VisitEvent versioning.** Additive optional `bridgeText`, contract identity preserved at `org.narramorph.visit-event@1.0.0`, no save migration (ADR 0004 addendum).

## Track A — clear the Phase 5 carry-overs

Delivered as commits on the feature branch (no PR opened; the owner opens PRs).

### A1 — Content release `eternal-return@1.2.0 → 1.3.0` (#156)

**Contract movement.** Package `eternal-return@1.2.0` (hash `cc437cdb…`) → `1.3.0` (hash `80f3d5a210c5d2814b224c86ec6d47fe8b418408f7133ee337b66b8d535efb50`); story-package schema `1.1.0` and literary release `eternal-return-literary-v1.0.1` unchanged; concordance file re-pinned to `b2640b4b181172ad6e34bf7661d9ec18b31b2bc85094199ed8999c4bfa489189` (schema still `1.1.0`). Identity synchronized across: source `storyVersion`; both acceptance records (`storyVersion`+`contentHash`+`concordanceSha256`); `src/config/eternalReturnPackageIdentity.json`; `e2e/phase-2-vertical-slice.spec.ts`; the two `storyVersion` asserts in `literary-release.test.ts`.

**Conversion-tool multi-beat ingestion.** `tools/conversion/lib/story-package.ts` now ingests a variation's authored `proseBeats`: each alternative becomes one catalog beat record (records sharing an ordinal are alternatives for one slot) carrying the schema's optional `conditionId`/`priority`/`omitWhenUnmatched`, and each gating journey condition becomes a `kind:'expression'` condition validated by the existing condition-expression grammar. Variations without `proseBeats` keep the one-implicit-beat default. Catalog effect: `proseBeats` 1014 → 1023, `conditions` 3012 → 3021 (nine `expression` gates); the concordance exemption counts + rules were updated to match, and the authored bridge is declared in the concordance `edges` section.

**Authored return-reader beats (owner-approved wording; D5 male-archaeologist correction).** Added to the nine `firstRevisit` L1 variations only (the `initial` variations only ever render at visitCount 1, so beating them would be dead weight). Each is a prepended, `omitWhenUnmatched` beat gated `visitCount(node) >= 3` over an always-qualifying body beat that reproduces the original passage. Applied wordings (per ADR 0002):

| Passage (variations) | Return-reader frame (visitCount ≥ 3) |
| --- | --- |
| arch-L1 (001, 002) | "The archaeologist returns to Fragment 2749-A once more. He has stopped recording how many times." |
| algo-L1 (001, 002, 003) | "Timestamp 2151.337.14:19:08—Processing reinitiated. Reload count now exceeds the value protocol predicts." |
| hum-L1 (001, 002, 003, 004) | "The facility waits where I left it. I have lost count of the leavings and the returns." |

`beatJoiner` is `"\n\n"`. **Byte-invariance** is guaranteed by construction (the body is a single un-split beat) and proven per passage by `src/domain/variation/returnReaderBeats.test.ts`: at visitCount < 3 the resolved prose equals the original `content` byte-for-byte; at visitCount ≥ 3 the frame is prepended.

**Authored edge bridge (owner-approved wording; siting D-6A1).** `src/data/stories/eternal-return/ bridges.json` (loader-only; kept out of the graph files and the hashed package). Applied wording on `algo-L1 → algo-L2-invest`, gated `orderSeen[arch-L1, algo-L1]`, `omitWhenUnmatched`:

> "You cross from the archaeologist's careful hands into the Algorithm's arithmetic — the same fragment, counted differently."

The content loader attaches it to the real edge and fails closed on an unknown edge or out-of-bounds bridge (`validateEdgeBridges` now runs in `validateStoryData`).

**Resolved-bridge-text export gap (Phase 4.4).** `VisitEvent` gains an optional `bridgeText: ResolvedText | null` snapshot, populated from the resolved bridge and threaded StoryView → store → `buildVisitEvent`; both export formats render it as a `role="note"` transition (blockquote in Markdown) before its passage, from the snapshot. Additive versioning documented in the ADR 0004 addendum; guard accepts absent/null/well-formed and rejects malformed. A save/reopen round-trip test proves a saved journey (with a bridge) re-exports byte-identically.

### A2 — CTR-012 premise repairs (folded into the A1 release)

- **Fragment identity.** `arch-L1-003`: `Fragment 17-0293` → `Fragment 2749-A` (×6), the distinct client designation `Upload Candidate 17-0293` preserved (×5). `algo-L1-004`: `41-0847` → `2749-A` (×16). Both now match the revisit variations and canon.
- **word_count metadata.** `arch-L1-003` `6142 → 2712`; `algo-L1-004` `6089 → 2851` (reconciled to the `wordCount` convention shared by every other variation).
- **Awareness regression — accepted as intentional (owner decision).** The initial variation reaches full causal-loop recognition and the revisits reopen lower; the owner accepted this as the designed eternal-return recursion (each cycle returns without carrying prior recognition forward), consistent with the self-generating ending preserved under CTR-008/D4. No prose change; rationale recorded in the register. **CTR-012 is resolved** (fragment/metadata fixed + awareness accepted).

### A3 — CTR-010 M-side slice re-issue (resolved via literary release v1.0.2)

The M-side edit to `editorial/vertical-slices/archaeologist-opening-accept.json` is committed and pushed to M on branch `claude/ctr-010-slice-reissue` (commit `6870cae5`; owner-approved). Clean patch (5 insertions / 5 deletions):

```diff
-      "promiseIds": ["P-Eleanor", "P1", "P2", "P3", "P4", "P5"]   # arch-L1
+      "promiseIds": ["P5"]                                        # CTR-010: only P5 is planted
-      "chronologyIds": ["er-chronology-phase-2"],                 # arch-L2-accept
+      "chronologyIds": ["er-chronology-phase-1"],                 # D6: Archaeologist era = phase-1
-      "promiseIds": ["P12", "P14", "P33", "P40", "P41"]           # arch-L2-accept
+      "promiseIds": ["P14"]                                       # CTR-010: prune Martinez P12/P41 + Lena P33/P40
-    "chronology": 2,
+    "chronology": 1,                                              # distinct-union {phase-1}
-    "promisePayoffs": 11
+    "promisePayoffs": 2                                           # distinct-union {P5, P14}
```

**Immutability finding + resolution (owner Option A).** Because `export_vertical_slice.py` stamps the source commit into the base-release hash, re-issuing the slice at a new commit moves the base literary-release hash — re-pinning `eternal-return-literary-v1.0.1` in place would violate ADR 0002's release immutability. So the release was re-issued as **`eternal-return-literary-v1.0.2`** (content byte-identical to v1.0.1 except the corrected slice metadata + new source commit; `contentSha256 2baf113c…`, `assetSha256 59c7af41…`). The re-issued slice re-pins to `contentSha256 ec8e0849…` / `assetSha256 30a5bccc…` against the v1.0.2 base.

**Contained cascade (N side).** Re-pinned to v1.0.2: `known-releases.json` (added v1.0.2), `known-slices.json`, both acceptance records (release + slice), the concordance (`literaryReleaseId`, `literaryReleaseContentSha256`, and the two slice-pinned mappings — arch-L2-accept chronology → `er-chronology-phase-1`, arch-L1 promises → `[P5]`, arch-L2-accept promises → `[P14]`), new concordance sha `c779795f…`. **The runtime story package identity is deliberately preserved** (`eternal-return@1.3.0`, `80f3d5a2`): the runtime prose is unchanged, so the package keeps `editorialReleaseId v1.0.1` as its build-time provenance while the accepted release is v1.0.2 — saved journeys are unaffected. Gates green: story/runtime/canon-strict/literary/slice validation, type-check, lint 0/0, conversion 160 + app 345 tests, build. **CTR-010 resolved.** _(The M branch should be merged in M to keep commit `6870cae5` permanent; a squash-merge would require re-pinning `sourceCommit` to the merged commit.)_

## Gate evidence (local, Node 22, on the feature branch)

- `story:package:validate`: `eternal-return@1.3.0` hash `80f3d5a2…`.
- `content:validate:canon:strict`: **errors=0**, warnings=6116, waived=31, expired=0 (exit 0).
- `content:validate:runtime`: 8 tests. `literary:validate` / `literary:slice:validate`: valid against `eternal-return@1.3.0`; concordance sha pin verified against committed bytes.
- `type-check`: pass. `lint:ci`: 0 errors / 32 warnings (baseline held).
- `test:run`: 344 tests (was 320; +24). Conversion suite: 160 tests (was 158; +2).
- `build`: pass.
- Playwright core journeys via a throwaway sandbox-Chromium override config (deleted, never committed): **8 passed, real exit code 0** — phase-2 vertical slice (×2, reading the 1.3.0 identity), phase-3 path coverage (accept/invest/resist → the three endings), reader journey L1→L4 with restore, missing-story recovery, and WebGL-loss 2D fallback. The full 17-scenario matrix runs in protected-main CI.

## Batch 6.1 — visual/interaction extraction audit ([#164](https://github.com/zekusmaximus/Narramorph/issues/164))

**Complete (analysis; no N runtime change).** Every visual/onboarding/interaction concept in P was inventoried against N from P's source and given a disposition — full record in [PHASE_6_1_EXTRACTION_AUDIT.md](PHASE_6_1_EXTRACTION_AUDIT.md); FEATURE_EXTRACTION_MATRIX P rows re-verified. Dispositions: **6.2** ← intro overlay (clean-room), animated node demo (semantic reimplement), help entry/replay (migrate concept); **6.3** ← cosmic atmosphere (selective clean-room decorative layers) + character colors → design tokens; **6.4** ← instanced/batched 3D (defer to profiling). **Rejected:** P's lazy-load boundary and WebGL→text fallback (N already has both), the marginalia sidebar (duplicates the Phase 3 adaptation ledger; non-deterministic notes), the duplicate Redux/domain/infrastructure stacks, the reader/transform renderer, and the checked-in `dist`. **Deferred:** the mini constellation (P's is a focusable-but-inert, always-animating WebGL-only canvas — not portable; concept gated on user testing + accessibility). Reference screenshots were **attempted and found infeasible** (P's standalone `dist` boots to a blank canvas); documented from source per the no-fabrication rule. Gate met: every useful feature has a target batch or a recorded rejection/defer rationale.

## Batch 6.2 — Cinematic but accessible first-run introduction ([#165](https://github.com/zekusmaximus/Narramorph/issues/165))

**Complete on the feature branch.** A first-run introduction was built as a clean-room rebuild of the frozen prototype's concept (`IntroductionOverlay`/`HelpIcon`/`Onboarding` at `392eef6c…`) in N's own architecture — **nothing imported from P** (ADR 0001). P's source was re-read for reference only: its overlay is a single un-labelled `<div>` with no dialog role, no focus trap/restoration, no skip, no reduced-motion (confirmed: zero `prefers-reduced-motion` anywhere in P), persisting a bare `localStorage.hasSeenIntro='true'`; its `HelpIcon` copy describes P's 3D drag/zoom, not N's map.

**Owner-approved design (three product forks resolved before code):** blocking first-run modal (over N's current direct opening, the A/B baseline); a single accessible panel (not a multi-step wizard); and a persistent header **Guide ("?")** entry. The intro is one `IntroDialog` opened two ways — automatically on first run and on demand from Help — sharing one content source.

**What shipped (all under `src/components/Onboarding/`):**

- `introVersion.ts` — minimal, versioned, device-local persistence. `INTRO_VERSION` (integer) is compared against a dedicated key `narramorph-intro-seen-version` (mirrors the existing `narramorph-3d-mode` pattern). **Not a bare boolean** and deliberately **off the save schema (1.3.0) and out of exported journeys** — a materially changed intro re-shows by bumping the constant. Fails open when storage is unavailable.
- `introContent.ts` — single source of truth for the copy (instructional chrome in `OpeningExperience`'s register; quotes no canon verbatim, ADR 0002). Covers premise → choose a perspective → open a fragment → path sensitivity → return/revisit, plus a line pointing at the Help entry.
- `AnimatedNodeDemo.tsx` — the animated-node demonstration reimagined as **semantic SVG** (pulse + click-ripple), `aria-hidden` decorative, with an always-present `<figcaption>` text alternative and a **static reduced-motion equivalent** gated on `useReducedMotionPreference` (OS + in-app setting). Never animation- or canvas-only.
- `IntroDialog.tsx` — a labelled `role="dialog"` `aria-modal` panel built on N's existing `useDialogFocus` (focus containment + restoration + Escape + background inerting). First-run shows skip + "Begin reading"; Help shows a "Close guide" + "Back to the archive" framing.
- Shell wiring: a persistent **Guide "?"** button in `AppHeader` (threaded through `LayoutShell`); `Layout` auto-opens the intro when `shouldShowIntro()` and records `markIntroSeen()` on any dismissal (begin / skip / close).

**Accessibility coverage (proven by tests, not asserted):** keyboard completion (Escape + focusable begin/skip), focus containment/restoration (via `useDialogFocus`, shared with `SettingsDialog`), screen-reader reading order (labelled dialog, ordered concept list, decorative SVG hidden), reduced motion (static demo + identical text), 200% text / small screens (scrolling panel, `max-h`/`overflow` identical to `SettingsDialog`), and the minimal versioned persistence. No canvas-only path exists.

**Owner comprehension checklist (proposed — owner runs the usability/A-B pass; results not fabricated).** After one onboarding pass an unaided new reader can: (1) state the premise; (2) say how to **begin** — pick a perspective and enter; (3) explain **node interaction** — select a fragment to read it; (4) explain **path sensitivity** — order/path changes what the archive shows; (5) explain **revisiting** — returning renders differently; (6) find **Help** — reopen the guide from the "?"; (7) a reduced-motion reader received the same explanation without relying on motion. The intro is measured against N's current direct opening (`OpeningExperience.tsx`); more animation is not assumed better.

### Gate evidence (local, Node 22, on the feature branch)

- `type-check`: pass. `lint:ci`: **0 errors / 0 warnings** (baseline held; new files auto-formatted).
- `test:run`: **365 tests pass** (was 345; +20 — `introVersion` 9, `AnimatedNodeDemo` 3, `IntroDialog` 7, `AppHeader` +1). Conversion suite: **160 tests** (unchanged; no conversion code touched).
- `story:package:validate`: `eternal-return@1.3.0` hash `80f3d5a2…` (identity unchanged).
- `content:validate:runtime`: 8 tests. `content:validate:canon:strict`: **errors=0**, warnings=6116, waived=31, expired=0 (baseline exact). `literary:validate` / `literary:slice:validate`: valid against `eternal-return@1.3.0` / `eternal-return-literary-v1.0.2`.
- `build`: pass. No package or save-schema identity moved; N has no new dependency on P.
- Playwright via the throwaway sandbox-Chromium (1194) override config (deleted, never committed): new `e2e/first-run-intro.spec.ts` — **3 passed** (first-run auto-open covering all four concepts → skip → picker → reload does not re-show; replay from the Help entry; reduced-motion static equivalent). Existing journeys pre-seed the intro-seen key so they are not blocked; regression set (reader journey + WebGL-loss 2D fallback, phase-2 saved-journey identity, accessibility, responsive) re-run green. Full 17-scenario matrix runs in protected-main CI.

## Batch 6.3 — Unify the visual language with design tokens + a restrained atmosphere ([#166](https://github.com/zekusmaximus/Narramorph/issues/166))

**Complete on the feature branch (pending the owner's visual-direction acceptance — the 6.3 gate).** Owner-approved design (three forks resolved before code): **subtle animated drift** atmosphere (static under reduced motion), a **surgical** token refactor, and a **CI-gated** contrast validator. No M clone (no character/voice terminology authored; token names reuse N's perspective identifiers). Full reference: [DESIGN_TOKENS.md](DESIGN_TOKENS.md).

**Token layer.** A canonical TS source (`src/styles/designTokens.ts`) mirrored into CSS custom properties (`src/styles/tokens.css`), with Tailwind's perspective `500` shades pointed at the CSS vars. The real colour consumers now read the tokens: `getNodeAppearance` (map/3D node fills + locked variants), `SceneContent` (3D guides), and `contentLoader` (default node colour). Groups: perspective colours (+ readable `-ink` text variants), surfaces, theme-aware focus, typography-adjacent, motion.

**Contrast remediation (the gate).** Two real, measured WCAG failures fixed:

- Convergence purple as small text on the dark shell was **4.18:1** (< 4.5) → added a `#b07cc9` ink variant (**6.11:1**).
- The global cyan focus ring dropped to **~1.2:1** on the light "Paper"/sepia reader panels (`bg-white`/`bg-amber-50`) — effectively invisible. The focus ring is now a **theme-aware token** (`--focus-ring`) that flips to `#0e7490` on those surfaces via `[data-reader-surface]`, measuring **5.36:1 / 5.17:1**. Confirmed at runtime (computed `--focus-ring` on the light reader = `#0e7490`).

Locked-node fills (~2.2–2.7:1) are **intentionally excluded** from the gate: a locked node is non-interactive and dimmed at render (opacity 0.3 + reduced scale), with "unavailable" conveyed by that de-emphasis, not hue. A **mechanical validator** (`designTokens.test.ts`, 21 cases) computes WCAG ratios for every meaningful pairing and fails the build on any regression, and also guards TS↔CSS drift.

**Cosmic atmosphere.** A restrained, drifting starfield adopted clean-room as a decorative, `aria-hidden` layer — the shell backdrop (`.archive-shell::before`, `z-index:-1` within the shell's own stacking context) and a visible layer behind the first-view perspective picker (`.cosmic-atmosphere`). It never touches the reading surface (verified: the light reader renders clean over the shell), the archive shell stays dominant, and its drift is neutralised by the existing global reduced-motion rules. N's separate map atmosphere already gates every layer behind the reduce-motion preference.

**Decoration cleanup.** The unexplained `⚠️` emoji in the WebGL fallback → a labelled, tokenised `TriangleAlert` icon (the heading carries the meaning). Functional state glyphs (`✓`/`○` read/unread) were left as-is (they convey meaningful state).

### Gate evidence (local, Node 22, on the feature branch)

- `type-check`: pass. `lint:ci`: **0 errors / 0 warnings** (baseline held).
- `test:run`: **386 tests pass** (was 365; +21 contrast/drift validator). Conversion suite: **160** (unchanged).
- `story:package:validate`: `eternal-return@1.3.0` hash `80f3d5a2…` (unchanged). `canon:strict`: **errors=0**, warnings=6116, waived=31. `literary:validate` / `literary:slice:validate`: valid against `v1.0.2`. No package/save-schema identity moved; no dependency on P.
- `build`: pass. Playwright via the throwaway sandbox-Chromium config (deleted, never committed): the opening renders the decorative atmosphere (`aria-hidden`, off the reading surface); the focus ring flips to the dark token on the light reader (runtime-verified); and the regression set (first-run intro, accessibility/focus journey, reader journey + WebGL-loss fallback) re-run green.

## Batch 6.4 — Profile experimental 3D; add a semantic node list ([#167](https://github.com/zekusmaximus/Narramorph/issues/167))

**Complete on the feature branch.** Owner-approved design (two forks): **structural + stop-early** profiling (don't build a P-style instanced prototype), and a **visible companion list**. Full record: [PROFILING_3D.md](PROFILING_3D.md).

**Profiling → stop early (don't port instancing).** N's constellation is capped at **≤19 nodes** (`SCENE_NODE_LIMIT`). Structural comparison (computed from the scene composition, not fabricated FPS): per-node rendering is ~22 draw calls / ~37.7k triangles; P's instancing would collapse that to ~4 draw calls — but at this scale the ~18 draw calls it removes were never a cost (instancing pays off at hundreds-to-thousands of instances). Porting P's 844-line `InstancedMesh` + `ShaderMaterial` + LOD path would add complexity to the primary path for **no measurable reader benefit** and would **regress** accessibility (P's `frameloop="always"` has no reduced-motion guard, which N deliberately avoids). Per the roadmap's "stop early if profiling shows little value", **instancing is not ported**; N's per-node 3D stays and remains clearly experimental. Frame-rate/GPU-memory on representative hardware is the owner's device step; a repeatable method is documented (no fabricated device numbers).

**The portable win — a semantic, visible companion node list.** `SceneNodeList` lists exactly the nodes the canvas renders (via a shared, pure `selectSceneNodeGroups` selector now used by both `SceneContent` and the list, so they can never drift) and activates the same node selection through the interaction adapter — so the WebGL canvas is **never the only navigation mechanism**. It is plain DOM (keyboard + screen-reader accessible, no motion), groups nodes by perspective, disables locked nodes, and marks the open node as current — working under reduced motion and when WebGL is unavailable.

**Guards confirmed.** 3D stays optional + lazy (`Home` lazy-loads the canvas), reduced-motion aware (`enableDamping` gated; the list has no motion), and WebGL-loss → 2D is proven green in `e2e/reader-journey.spec.ts`.

### Gate evidence (local, Node 22, on the feature branch)

- `type-check`: pass. `lint:ci`: **0 errors / 0 warnings** (baseline held).
- `test:run`: **395 tests pass** (was 386; +9 — `sceneNodes` 5, `SceneNodeList` 4). Conversion suite: **160** (unchanged).
- `story:package:validate` / `canon:strict` (errors=0) / `literary` / `slice`: unchanged; identity pins intact (`eternal-return@1.3.0` `80f3d5a2…`, `v1.0.2`). No package/save-schema identity moved; no P dependency.
- `build`: pass. Playwright via the throwaway sandbox-Chromium config (deleted, never committed): the 2D reader journey and the **WebGL-loss → 2D fallback** stay green; the 3D companion list is exercised where software WebGL renders it.

## Batch 6.5 — Prototype parity/rejection review (seven-condition archive gate) ([#168](https://github.com/zekusmaximus/Narramorph/issues/168))

**Complete on the feature branch — conditions 1–6 met; conditions 5 and 7 owner-gated.** Full record: [PHASE_6_5_ARCHIVE_GATE.md](PHASE_6_5_ARCHIVE_GATE.md). The extraction matrix was re-run: every P item has a terminal disposition — **migrated** (intro overlay, animated node demo, help/replay in 6.2; cosmic atmosphere, character-colour tokens in 6.3), **rejected after profiling** (instanced 3D in 6.4, with the semantic node list added instead), **rejected** (lazy-load, WebGL fallback, marginalia, duplicate stacks, reader renderer, checked-in `dist`), or **deferred** (mini constellation). Seven-condition gate:

1. All extraction items migrated/rejected/deferred — ✅.
2. No N→P build/runtime dependency — ✅ (source sweep finds only a story-title slug in a test, not a P reference).
3. First-run + fallback browser tests pass — ✅ (`first-run-intro` 3/3; `reader-journey` WebGL-loss fallback).
4. Accessibility + reduced-motion parity proven — ✅ (6.2 focus/keyboard/reduced-motion; 6.3 theme-aware focus + CI WCAG validator + aria-hidden reduced-motion-gated decoration; 6.4 accessible node list).
5. P's open issues migrated/closed — ✅ (P's tracker holds **0 issues**; nothing to act on) — **owner-gated confirmation** of the (empty) disposition.
6. Provenance + licenses recorded — ✅ (P pinned `392eef6c`, MIT + reserved content, same owner; no P source copied — clean-room concepts only).
7. Owner accepts the visual direction — ⏳ **owner-gated** (6.3 screenshots delivered; owner accepted the 6.3 direction in-batch).

## Batch 6.6 — Archive `eternal-return-digital-self` (prepared; admin-gated)

**Prepared; executes only on the owner's go-ahead** (P-W/A; admin access). Once conditions 5 and 7 are signed off, the archive steps are: create the final `reference-final` tag on `392eef6c`; add an archive notice to P linking to N and summarising what was transferred/rejected (from the 6.5 matrix); disable P's deployments and remove unused secrets; migrate/close any remaining issues (currently none); and use GitHub's archive toggle — preserving history and the final screenshots, never deleting the repo. These are outward-facing/admin actions on P and are held for the owner.
