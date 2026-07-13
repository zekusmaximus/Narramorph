# Narramorph status

Updated: July 13, 2026

## Current baseline

- The application builds on React 18, TypeScript, Vite, Zustand, React Flow, and React Three Fiber.
- _Eternal Return of the Digital Self_ is present as the complete checked-in runtime story across L1-L4.
- CI-oriented runtime validation checks raw L1/L2 variations, the assembled story graph, L3 aggregate loading, and the selection matrix without relying on migration normalization.
- The conversion package has its own strict validator and test suite.
- Progress/journey calculations, L2 progression, connection reveal logic, unlock progress, save-state validation/migration, variation selection and history, and atomic story-loading transitions now sit behind testable domain or repository boundaries; `storyStore.ts` remains their coordinator.
- Runtime integrity validation now cross-checks declared story and layer counts, duplicate IDs, runtime-file ownership, L3/L4 aggregates, selection-matrix references, manifest totals, and deterministic record ordering.
- Content ownership and regeneration commands are documented. The converter validates all 81 authored records per L1/L2 group, then applies an explicit profile that preserves the stable 12-record L1 runtime package.
- The 2D and 3D maps now share a map interaction adapter, reduced-motion behavior has an explicit preference hook, and the active 2D node and atmospheric presentation components receive narrow store-free presentation data from the map boundary.
- The checked-in story graph reaches three L3 convergence nodes and three authored L4 endings. Chromium coverage protects the full journey, revisit/dedup behavior, unlock notices, persistence reload, missing-story recovery, and WebGL fallback.
- The reader experience now uses a responsive archive shell, perspective-first opening, simplified mobile map, literary passage typography, actual-text reading estimates, scroll progress, graph-backed continuation actions, narrative progress history, and persisted reader preferences.
- Available map passages now have literary accessible names, stable selected/focus states, arrow-key traversal, Enter/Space activation, and reliable focus return; unavailable passages remain summarized outside the tab order.
- Story, settings, progress, and L3 convergence surfaces now share initial-focus, containment, Escape, background-isolation, duplicate-dialog, and focus-restoration behavior. Unlock notices wait while a reading panel is active and announce surfaced passages politely.
- Effective reduced motion honors either the system preference or the persisted reader setting across map atmosphere, nodes, particles, notifications, reader transitions, progress surfaces, and convergence presentation.
- Browser coverage protects the complete keyboard-only perspective-to-reader-to-map-to-settings/progress path, representative L3 keyboard interaction, 390×844 layout, all three reader text sizes, 200% layout pressure, app and system reduced motion, horizontal-overflow boundaries, preference persistence, and unavailable-WebGL fallback; 3D remains an explicitly experimental secondary view.
- Generated backup snapshots and nested tool dependencies are excluded from version control.

## Recently completed

- Conversion-package TypeScript cleanup.
- Shared 2D/3D map interaction groundwork.
- L3 profiling and targeted assembly optimization.
- Unlock, journey-progress, progress-model, and L2 progression extraction from the central store.
- Strict runtime content validation suitable for CI.
- Accessible navigation and interaction confidence across the complete primary reader path.
- Store-free active 2D map node and mounted atmospheric presentation boundaries for the next milestone-4 slice.
- Removal of the deprecated TypeScript `baseUrl` option.
- Consolidation of current documentation and archival of superseded assessments and plans.

## Known constraints

- `storyStore.ts` remains the central coordinator and still owns visit, L3 assembly, unlock, and UI orchestration concerns.
- Some remaining visual components outside the active 2D node and mounted atmospheric presentation boundary still subscribe directly to broad store state.
- Package-level checksums remain deferred until a second story can establish a timestamp-independent, cross-package checksum contract.
- Eager content imports are acceptable for the current single-story scope but will not scale cleanly to a larger catalog.
- Cross-screen-reader, device-specific contrast, and assistive-technology combinations remain release-QA checks rather than a fully automated matrix.

See [the roadmap](ROADMAP.md) for the prioritized response to these constraints.
