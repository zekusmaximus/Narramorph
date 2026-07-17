# Phase 6.5 — prototype parity/rejection review (the seven-condition archive gate)

This is the Phase 6.5 archive-gate review for the frozen prototype `eternal-return-digital-self` ("P", read-only at `392eef6c6f87b8064c8cc51d91b6f029b0e32d5b`), mirroring the Phase 4.5 gate. It consolidates the evidence from batches 6.1–6.4 so P can be archived in 6.6 once the owner-gated conditions are met. Issue [#168](https://github.com/zekusmaximus/Narramorph/issues/168); parent epic #93. No N build/runtime dependency on P is introduced (ADR 0001).

## Extraction matrix — re-run (every item migrated / rejected / deferred)

| # | P feature | 6.1 disposition | Resolution | Where |
| --- | --- | --- | --- | --- |
| 1 | Cinematic first-run overlay | clean-room → 6.2 | **Migrated** (accessible `IntroDialog` on `useDialogFocus`; versioned intro-seen) | 6.2 |
| 2 | Animated node demonstration | reimplement → 6.2 | **Migrated** (semantic SVG `AnimatedNodeDemo` + static reduced-motion equivalent + caption) | 6.2 |
| 3 | Help entry + replayable guidance | migrate → 6.2 | **Migrated** (persistent header **Guide**; replay via the same dialog; N-accurate copy) | 6.2 |
| 4 | Cosmic atmosphere | selective → 6.3 | **Migrated** (decorative, `aria-hidden`, reduced-motion-gated starfield off the reading surface) | 6.3 |
| 5 | Color/character language | tokens → 6.3 | **Migrated** (design tokens; WCAG-passing, CI-gated) | 6.3 |
| 6 | Instanced/batched 3D | profile → 6.4 | **Rejected after profiling** ("stop early" — no measurable win at ≤19 nodes); semantic node list added instead | 6.4 |
| 7 | Lazy-load boundary for 3D | reject (present) | **Rejected** — N already lazy-loads 3D | 6.1 |
| 8 | WebGL-loss → text fallback | reject (present) | **Rejected** — N already falls back to 2D (tested) | 6.1 |
| 9 | Mini constellation | defer | **Deferred** — gated on user testing + accessibility; P's is a focusable-but-inert WebGL-only canvas, not portable | 6.1 |
| 10 | Marginalia sidebar | reject (duplicate) | **Rejected** — duplicates the Phase 3 adaptation ledger; non-deterministic notes | 6.1 |
| 11 | Duplicate Redux/domain/infra | reject | **Rejected** — competing state architecture; no unique value | 6.1 |
| 12 | Reader/transform renderer | reject | **Rejected** — carries P's blank-panel / revisit defects; N's is authoritative | 6.1 |
| 13 | Checked-in `dist/` | reject | **Rejected** — N builds artifacts in CI | 6.1 |

Every item has a terminal disposition. **Condition 1 met.**

## The seven conditions

1. **All extraction items migrated / rejected / deferred.** ✅ See the matrix above — 5 migrated (6.2–6.3), 1 rejected-after-profiling (6.4), 6 rejected, 1 deferred.
2. **N has no build/runtime dependency on P.** ✅ A source sweep for P's repo name and P component names (`NodesInstanced`, `ConnectionsBatched`, `MarginaliaSidebar`, `MiniConstellation`, `IntroductionOverlay`, `HelpIcon`) finds nothing in N's `src`, `package.json`, or Vite config. The only textual match is a **story-title slug** in `journeyExport.test.ts` (the edition title, not a P reference). Every extracted concept is a clean-room reimplementation in N's architecture.
3. **First-run and fallback browser tests pass.** ✅ `e2e/first-run-intro.spec.ts` (auto-open → skip → picker → no re-show; replay from Help; reduced-motion static equivalent) — 3/3. `e2e/reader-journey.spec.ts` "unavailable WebGL falls back to the 2D reader" — green, alongside the full L1→L4 journey and the 3D companion-list check.
4. **Accessibility and reduced-motion parity proven.** ✅ 6.2: labelled modal, focus containment/restoration, Escape, keyboard skip/begin/replay, reduced-motion static demo, 200%/small-screen. 6.3: theme-aware focus ring (fixes the invisible cyan ring on light reader panels), CI-gated WCAG validator, decorative layers `aria-hidden` + reduced-motion-gated. 6.4: a visible, keyboard/SR-accessible companion node list so the WebGL canvas is never the only navigation. P had **no** reduced-motion handling anywhere; N's is proven.
5. **P's open issues migrated or closed.** ✅ P's issue tracker holds **0 issues** (open or closed) — nothing to migrate or close. Inventory below.
6. **Provenance and licenses recorded.** ✅ Below.
7. **Owner accepts N's resulting visual direction.** ⏳ **Owner-gated.** Screenshots delivered in 6.3 (opening atmosphere; light-reader focus). The owner accepted the 6.3 direction during the batch; a holistic sign-off across 6.2–6.4 is recorded here at archive time.

## P open-issues inventory (condition 5)

| Issue | State | Recommended disposition |
| --- | --- | --- |
| _(none)_ | — | P's issue tracker is empty (`totalCount = 0`). No migration or closure required. |

Nothing to act on. Recorded per the "inventory & recommend" decision — no P issues were modified.

## Provenance and licenses (condition 6)

- **P** — `zekusmaximus/eternal-return-digital-self`, pinned reference commit `392eef6c6f87b8064c8cc51d91b6f029b0e32d5b`. Licensed **MIT** (software) plus a **reserved-content** license (narrative/media), © 2026 zekusmaximus.
- **N** — `zekusmaximus/Narramorph`, licensed **MIT** (software) plus reserved-content, © 2026 zekusmaximus.
- **Same owner**, so the clean-room reimplementations in N are the owner's own work; **no P source was copied** into N (concepts only, rebuilt in N's architecture). No third-party IP is implicated.
- Reference screenshots for P were **attempted and found infeasible** in 6.1 (P's standalone `dist` boots to a blank canvas); P's visual/interaction concepts are documented from source in [PHASE_6_1_EXTRACTION_AUDIT.md](PHASE_6_1_EXTRACTION_AUDIT.md), and N's resulting direction is captured in the 6.3 screenshots. No fabricated visual evidence was committed.

## Gate status

Conditions **1–6 are met and evidenced**; conditions **5 and 7 are owner-gated** (issue dispositions — here, none — and visual acceptance). Once the owner accepts the visual direction, the archive gate is satisfied and **6.6** may execute (final `reference-final` tag, archive notice, disable deploys / remove secrets, GitHub archive toggle) — admin-gated, on the owner's go-ahead.
