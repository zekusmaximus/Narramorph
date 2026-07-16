# Phase 6 execution record

Phase 6 extracts visual/onboarding value from the frozen prototype `eternal-return-digital-self` ("P") and archives it (roadmap Phase 6, batches 6.1–6.6), **after** a focused **Track A** PR clears the Phase 5 carry-overs. This document is the running evidence record (mirrors [PHASE_5_EXECUTION.md](PHASE_5_EXECUTION.md)); it is updated as batches land and the epic [#93](https://github.com/zekusmaximus/Narramorph/issues/93) is ticked only at merge.

**Status: Track A implemented on the feature branch (content release `eternal-return@1.3.0` cut); the CTR-010 M-side slice re-issue is prepared and paused for owner go-ahead; Phase 6.1–6.6 not yet started.**

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
- **Awareness regression — NOT attempted.** The initial variations reach deeper recognition than the revisits that follow; correcting the arc is a narrative revision requiring the editorial owner's authoring and exact-wording sign-off. Recorded in the register; CTR-012 stays open.

### A3 — CTR-010 M-side slice re-issue (prepared; **paused for owner go-ahead on M**)

Requires editing `Eternal_Return_Manuscript` `editorial/vertical-slices/ archaeologist-opening-accept.json` (`arch-L2-accept` chronologyIds `er-chronology-phase-2 → er-chronology-phase-1`; prune the audited-absent Martinez P12/P41 and Lena P33/P40 chains on the slice-pinned mappings and the unplanted arch-L1 promises), re-running `export_vertical_slice.py`, re-accepting in N, and re-pinning. **M pushes are owner-gated — not executed.** _(status: pending)_

## Gate evidence (local, Node 22, on the feature branch)

- `story:package:validate`: `eternal-return@1.3.0` hash `80f3d5a2…`.
- `content:validate:canon:strict`: **errors=0**, warnings=6116, waived=31, expired=0 (exit 0).
- `content:validate:runtime`: 8 tests. `literary:validate` / `literary:slice:validate`: valid against `eternal-return@1.3.0`; concordance sha pin verified against committed bytes.
- `type-check`: pass. `lint:ci`: 0 errors / 32 warnings (baseline held).
- `test:run`: 344 tests (was 320; +24). Conversion suite: 160 tests (was 158; +2).
- `build`: pass.
- Playwright core journeys via a throwaway sandbox-Chromium override config (deleted, never committed): **8 passed, real exit code 0** — phase-2 vertical slice (×2, reading the 1.3.0 identity), phase-3 path coverage (accept/invest/resist → the three endings), reader journey L1→L4 with restore, missing-story recovery, and WebGL-loss 2D fallback. The full 17-scenario matrix runs in protected-main CI.

## Phase 6.1–6.6

Not yet started. Batch issues open under [#162](https://github.com/zekusmaximus/Narramorph/issues/162) as each begins.
