# Phase 6.1 — visual/interaction extraction audit

This document inventories the visual, onboarding, and interaction concepts in the frozen prototype `eternal-return-digital-self` ("P", read-only clone at `392eef6c6f87b8064c8cc51d91b6f029b0e32d5b`) against Narramorph's ("N") current implementation, and assigns each a disposition — **port**, **clean-room rebuild**, **reject**, or **defer** — with a target batch or a rejection rationale. It re-verifies the provisional decisions in [FEATURE_EXTRACTION_MATRIX.md](FEATURE_EXTRACTION_MATRIX.md) against P's real code (batch [#164](https://github.com/zekusmaximus/Narramorph/issues/164); roadmap 6.1). No N build/runtime dependency on P is introduced — this batch is analysis only (ADR 0001/0002).

## Reference-evidence method (screenshots)

Capturing live screenshots of P **was attempted and is not feasible**: P's checked-in `dist/` was served statically and loaded in the pinned sandbox Chromium (1194) with software WebGL, but the app boots to a blank dark canvas — the onboarding, help icon, and constellation never mount from the raw built output (it depends on runtime state P's standalone dist does not reach; the page threw no console error but rendered no UI). Per the batch rule, **no fabricated or misleading blank screenshots are committed**; every visual below is **documented from P's source** (component `.tsx` and `.css` at the pinned commit), with exact file/line references so a maintainer never needs P open. If the owner wants pixel captures, P must be built and run from source against its expected runtime, which is out of scope for an analysis batch and unnecessary for the dispositions.

## N's current baseline (for comparison)

- **Opening:** `src/components/OpeningExperience.tsx` — a compact framer-motion perspective picker (label / era / accent / marker glyph A·Σ·H·∴ per perspective). It goes **straight to the perspective choice**; it does not explain the premise, node interaction, path sensitivity, or return/revisit. N has **no** intro overlay, help modal, or onboarding today.
- **Color/character language:** `tailwind.config.js` already defines `archaeologist #4A90E2`, `algorithm #50C878`, `last-human #E74C3C` — the **same** three character colors P uses; N adds sky/emerald/rose/violet accents + marker glyphs. A shared language exists; it is not yet tokenized.
- **3D:** `src/components/3d/` (`NarromorphCanvas`, `NodeSphere`, `SceneContent`, `CameraController`, `FPSCounter`, `LoadingState`) — **per-node meshes** (`NodeSphere`), not instanced. Lazy-loaded, with a WebGL-loss → 2D fallback already proven green in `e2e/reader-journey.spec.ts`.
- **Reduced motion:** `src/hooks/useReducedMotionPreference.ts` exists and is honored; **P has no reduced-motion handling anywhere**.
- **Journey history:** the Phase 3 adaptation ledger ("How your journey adapted") + progress surface already provide a reader-facing journey/history view.
- **Atmosphere:** N has **no** cosmic/starfield atmosphere; its shell is the legible archive.

## Dispositions

| # | P feature | P source | N today | Disposition | Target / rationale |
| --- | --- | --- | --- | --- | --- |
| 1 | Cinematic first-run overlay | `components/Onboarding/IntroductionOverlay.tsx` (47 L) | none | **Clean-room rebuild** | Batch 6.2 |
| 2 | Animated node demonstration | `Onboarding.css` `.node-example`/`.example-node`/`.click-indicator` (pulse/clickIndicator keyframes) | none | **Reimplement (semantic)** | Batch 6.2 |
| 3 | Help entry + replayable guidance | `HelpIcon.tsx` (85 L), `Onboarding.tsx` | none | **Migrate concept** | Batch 6.2 |
| 4 | Cosmic atmosphere | `app.css` (3-layer parallax starfield, `titleGlow`), `Constellation/ConstellationView.css` | none | **Selective clean-room** | Batch 6.3 |
| 5 | Color/character language | `contentLoader`/CSS `#4A90E2/#50C878/#E74C3C` | shared colors, untokenized | **Port → design tokens** | Batch 6.3 |
| 6 | Instanced/batched 3D | `Constellation/NodesInstanced.tsx` (844 L), `ConnectionsBatched.tsx` (124 L) | per-node `NodeSphere` | **Defer pending profiling** | Batch 6.4 |
| 7 | Lazy-load boundary for 3D | `ConstellationView.tsx` `lazy()`+`Suspense` | N already lazy-loads 3D | **Reject (already present)** | see below |
| 8 | WebGL-loss → text fallback | `ConstellationView.tsx` `WebGLErrorNotification` | N already has 2D fallback (tested) | **Reject (already present)** | see below |
| 9 | Mini constellation | `NodeView/MiniConstellation.tsx` (216 L) | N accessible 2D map | **Defer (user-testing gate)** | see below |
| 10 | Marginalia sidebar | `NodeView/MarginaliaSidebar.tsx` (166 L) | Phase 3 adaptation ledger | **Reject as duplicate** | see below |
| 11 | Duplicate Redux/domain/infra | `src/store`, `src/domain`, `src/infrastructure` (27 files) | Zustand/domain boundaries | **Reject** | see below |
| 12 | Reader/transform renderer | `src/components/NodeView` | N reader + selection | **Reject** | see below |
| 13 | Checked-in `dist/` | `dist/` (256 KB) | CI-built artifacts | **Reject as source practice** | see below |

### Ports / rebuilds (useful — targeted to a batch)

- **(1) Intro overlay → clean-room rebuild in 6.2.** P's overlay (title, premise paragraph, `node-example`, "Begin Exploration") is a reasonable _concept_ but accessibility-poor: no dialog `role`, **no focus containment or restoration**, keyboard only on the button, no skip, no reduced motion, and it persists a **bare `localStorage.hasSeenIntro='true'`** (no version, so materially changed onboarding can never re-show). 6.2 rebuilds it accessibly and persists a minimal **intro-seen _version_** value. Useful concepts to keep: premise-first framing, a single clear "begin" affordance, and covering premise → node interaction → path sensitivity → return/revisit.
- **(2) Animated node demonstration → semantic reimplementation in 6.2.** P's demo is CSS-only (`.example-node` `pulse 2s infinite` + `.click-indicator`), **animation-only with no text alternative and no `prefers-reduced-motion`**. 6.2 must render it as semantic HTML/SVG with a static reduced-motion equivalent — never canvas/animation-only.
- **(3) Help entry + replay → migrate concept in 6.2.** `HelpIcon` has the right idea (a persistent "?" entry that opens a guide and can **replay the intro** by clearing the seen-flag) and even sets `role="button"`/`tabIndex`/Enter-Space. But the modal has **no focus trap, no restoration, no Escape, no dialog role**, the close "×" lacks a label, and its copy describes **P's 3D drag/zoom**, not N's interaction. Migrate the _concept_ into N's Help/settings with focus and screen-reader tests and N-accurate copy.
- **(4) Cosmic atmosphere → selective clean-room in 6.3.** P's atmosphere is a decorative 3-layer radial-gradient **parallax starfield** (`.stars/.stars2/.stars3`, opacity 0.7/0.5/0.4) plus a `titleGlow`. 6.3 may selectively adopt a restrained version **as decorative design-token layers that are `aria-hidden`, gated behind `prefers-reduced-motion`, and kept off the reading surface** so prose stays legible and the archive shell stays dominant.
- **(5) Color/character language → design tokens in 6.3.** The character colors already agree across N and P; 6.3 promotes them (and surfaces/typography/focus/spacing/motion) to design tokens with documented WCAG-passing contrast.
- **(6) Instanced/batched 3D → defer to 6.4 profiling.** `NodesInstanced` is a real optimization (single `InstancedMesh`, custom `ShaderMaterial`, `useFrame` noise animation, LOD "lower-poly for distant nodes") vs N's per-node `NodeSphere`. Whether it wins on representative hardware is exactly the 6.4 measured question; port only if it beats N's 2D-first path without complicating it. It has **no reduced-motion guard** (`frameloop="always"`), which 6.4 must fix if ported.

### Rejections and defers (rationale is the gate)

- **(7) Lazy-load boundary — reject (already present).** P lazy-loads Three.js via `lazy()`+`Suspense`; N already lazy-loads its 3D (`src/components/3d/` + `LoadingState`), so there is no unique value to port.
- **(8) WebGL-loss → text fallback — reject (already present).** P shows a "Continue in Text Mode" notice; N already falls back to the 2D reader on WebGL loss, proven by `e2e/reader-journey.spec.ts` ("unavailable WebGL falls back to the 2D reader"). No gap.
- **(9) Mini constellation — defer, blocked on a user-testing + accessibility gate.** P's `MiniConstellation` is a **WebGL-only** minimap (a second `<Canvas>` with `OrbitControls`, `frameloop="always"`) that is **`tabIndex=0` + `role="region"` but whose `onKeyDown` is an explicit no-op** — focusable yet inoperable, an accessibility anti-pattern, and always-animating with no reduced-motion. Its implementation is **not portable**; the _concept_ of a reader-context minimap is deferred pending user testing (matrix "if user testing supports it") and would have to be rebuilt on N's accessible 2D map, not P's canvas. No 6.x commitment yet.
- **(10) Marginalia sidebar — reject as a duplicate.** `MarginaliaSidebar`'s "breadcrumbs / Recent Journey" mode **duplicates N's Phase 3 adaptation ledger and history surface**; its "Reader Notes" stamp `new Date().toLocaleTimeString()` (non-deterministic, contrary to N's deterministic export/journey discipline); and its other modes (`echoes`, `glossary`) are unbuilt TODOs. It is Redux-coupled to a P-only `readerSlice`/attractor model. Any future annotation/glossary surface is a fresh product/editorial decision, not a port — deferred without a target.
- **(11) Duplicate Redux/domain/infrastructure — reject.** `src/store` (Redux Toolkit + redux-persist + reselect), `src/domain`, `src/infrastructure` re-implement state, persistence, and service layers N already owns with Zustand + a single authoritative journey state (consistent with ADR 0003/0005's rejection of the parallel Leibniz stack). Importing them would re-introduce competing state architectures. No gap analysis finds unique value.
- **(12) Reader/transform renderer — reject.** `src/components/NodeView` (+ transformation services) is P's reading path, which carries the tested blank-content and first-visit/revisit defects the roadmap calls out; N's reader + selection architecture is authoritative and defect-free for those cases (Phase 3/4 tests + the 6.5 gate re-confirm). No unique value.
- **(13) Checked-in `dist/` — reject as source practice.** P tracks a 256 KB `dist/`; N builds release artifacts in CI and never tracks build output. Nothing to port.

## Gate status (6.1)

Every P visual/onboarding/interaction item above has **either a target batch** (6.2 for onboarding items 1–3; 6.3 for atmosphere/tokens 4–5; 6.4 for 3D 6) **or a recorded rejection/defer rationale** (7–13). The FEATURE_EXTRACTION_MATRIX P rows are re-verified against P's real code and amended in the same commit. The batch acceptance gate is met. Screenshots were attempted and are documented from source per the no-fabrication rule.
