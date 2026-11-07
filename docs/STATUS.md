# Narramorph status

Updated: November 7, 2026

## Current baseline

- App version 0.1.1 ships as a static, client-only build ([ADR 0006](adr/0006-v1-client-only-no-backend.md)); `npm run scope:check` confirms first-party `src/` contains no network primitives.
- The alpha is publicly hosted at [narramorph.com](https://narramorph.com) on Cloudflare Pages, built from `main`, with security headers and CSP from `public/_headers`. Production passed all eight required header checks on November 7, 2026, and the domain is on the HSTS preload list.
- Opt-in, redacted error reporting (Sentry, lazy-loaded, DSN-gated) is configured in the production build. Redaction removes prose, journey and save data, storage, the passage fragment, and UI element descriptions before a report leaves the device.
- Readers can bookmark passages (`#/passage/:nodeId`), open a "Why this version?" explanation for visited passages, and export a journey as Markdown, print, or a machine-readable save file.
- Story Package Contract v1 is implemented: one generic builder and validator process Eternal Return and two synthetic fixture stories, each with a deterministic content hash. Literary-release intake validates the accepted `eternal-return-literary-v1.0.2` release and its approved slice.
- CI enforces bundle budgets with zero public source maps (`bundle:check`) and V8 coverage floors (`test:coverage`).
- The optional 3D view downloads only on request and is exercised in CI by a Chromium/Firefox/WebKit engine proxy matrix in desktop and touch/mobile viewports.
- The application builds on React 18, TypeScript, Vite, Zustand, React Flow, and React Three Fiber.
- _Eternal Return of the Digital Self_ is present as the complete checked-in runtime story across L1-L4.
- CI-oriented runtime validation checks raw L1/L2 variations, the assembled story graph, L3 aggregate loading, and the selection matrix without relying on migration normalization.
- The conversion package has its own strict validator and test suite.
- Progress/journey calculations, L2 progression, connection reveal logic, unlock progress, save-state validation/migration, variation selection and history, and atomic story-loading transitions now sit behind testable domain or repository boundaries; `storyStore.ts` remains their coordinator.
- Runtime integrity validation now cross-checks declared story and layer counts, duplicate IDs, runtime-file ownership, L3/L4 aggregates, selection-matrix references, manifest totals, and deterministic record ordering.
- Content ownership and regeneration commands are documented. The converter validates all 81 authored records per L1/L2 group, then applies an explicit profile that preserves the stable 12-record L1 runtime package.
- The 2D and 3D maps now share a map interaction adapter, reduced-motion behavior has an explicit preference hook, and the active 2D node and atmospheric presentation components receive narrow store-free presentation data from the map boundary. The application shell, settings dialog, and journey tracker now receive typed presentation data from focused layout and tracker adapters.
- The checked-in story graph reaches three L3 convergence nodes and three authored L4 endings. Chromium coverage protects the full journey, revisit/dedup behavior, unlock notices, persistence reload, missing-story recovery, and WebGL fallback.
- The reader experience now uses a responsive archive shell, perspective-first opening, simplified mobile map, literary passage typography, actual-text reading estimates, scroll progress, graph-backed continuation actions, narrative progress history, and persisted reader preferences.
- Available map passages now have literary accessible names, stable selected/focus states, arrow-key traversal, Enter/Space activation, and reliable focus return; unavailable passages remain summarized outside the tab order.
- Story, settings, progress, and L3 convergence surfaces now share initial-focus, containment, Escape, background-isolation, duplicate-dialog, and focus-restoration behavior. Unlock notices wait while a reading panel is active and announce surfaced passages politely.
- Effective reduced motion honors either the system preference or the persisted reader setting across map atmosphere, nodes, particles, notifications, reader transitions, progress surfaces, and convergence presentation.
- Browser coverage protects the complete keyboard-only perspective-to-reader-to-map-to-settings/progress path, representative L3 keyboard interaction, 390×844 layout, all three reader text sizes, 200% layout pressure, app and system reduced motion, horizontal-overflow boundaries, preference persistence, and unavailable-WebGL fallback; 3D remains an explicitly experimental secondary view.
- Generated backup snapshots and nested tool dependencies are excluded from version control.

## Recently completed

- Phase 8 production hardening ([#182](https://github.com/zekusmaximus/Narramorph/pull/182)) and the production launch on narramorph.com ([#183](https://github.com/zekusmaximus/Narramorph/pull/183), [#184](https://github.com/zekusmaximus/Narramorph/pull/184), [#186](https://github.com/zekusmaximus/Narramorph/pull/186)).
- Accession chrome redesign of the map stack, header and footer, dialogs, and notice tray ([#196](https://github.com/zekusmaximus/Narramorph/pull/196)).
- Experimental 3D CSP, recovery, spatial mapping, profiling harness, and engine proxy matrix ([#198](https://github.com/zekusmaximus/Narramorph/pull/198), [#199](https://github.com/zekusmaximus/Narramorph/pull/199), [#201](https://github.com/zekusmaximus/Narramorph/pull/201), [#218](https://github.com/zekusmaximus/Narramorph/pull/218); see the [3D view plan](3D_VIEW_PLAN.md)).
- Enforced coverage floors (previously configured under a key Vitest ignores), dependency-advisory remediation, and UI-breadcrumb redaction for error reports (November 7, 2026).

## Known constraints

- `storyStore.ts` remains the central coordinator and still owns visit, L3 assembly, unlock, and UI orchestration concerns.
- Some remaining visual components outside the active 2D node, mounted atmospheric presentation boundary, shell, settings dialog, and journey-tracker panel still subscribe directly to broad store state.
- The reader still defaults to the `eternal-return` story; the story-package contract and fixtures exist, but multi-story reading is not advertised.
- Eager content imports are acceptable for the current single-story scope but will not scale cleanly to a larger catalog.
- Cross-screen-reader, device-specific contrast, and assistive-technology combinations remain release-QA checks rather than a fully automated matrix.

See [the roadmap](ROADMAP.md) for the prioritized response to these constraints.
