# Narramorph status

Updated: July 12, 2026

## Current baseline

- The application builds on React 18, TypeScript, Vite, Zustand, React Flow, and React Three Fiber.
- _Eternal Return of the Digital Self_ is present as the complete checked-in runtime story across L1-L4.
- CI-oriented runtime validation checks raw L1/L2 variations, the assembled story graph, L3 aggregate loading, and the selection matrix without relying on migration normalization.
- The conversion package has its own strict validator and test suite.
- Progress/journey calculations, L2 progression, connection reveal logic, unlock progress, save-state validation/migration, variation selection and history, and atomic story-loading transitions now sit behind testable domain or repository boundaries; `storyStore.ts` remains their coordinator.
- Runtime integrity validation now cross-checks declared story and layer counts, duplicate IDs, runtime-file ownership, L3/L4 aggregates, selection-matrix references, manifest totals, and deterministic record ordering.
- Content ownership and regeneration commands are documented. The converter validates all 81 authored records per L1/L2 group, then applies an explicit profile that preserves the stable 12-record L1 runtime package.
- The 2D and 3D maps now share a map interaction adapter, and reduced-motion behavior has an explicit preference hook.
- The checked-in story graph reaches three L3 convergence nodes and three authored L4 endings. Chromium coverage protects the full journey, revisit/dedup behavior, unlock notices, persistence reload, missing-story recovery, and WebGL fallback.
- Generated backup snapshots and nested tool dependencies are excluded from version control.

## Recently completed

- Conversion-package TypeScript cleanup.
- Shared 2D/3D map interaction groundwork.
- L3 profiling and targeted assembly optimization.
- Unlock, journey-progress, progress-model, and L2 progression extraction from the central store.
- Strict runtime content validation suitable for CI.
- Removal of the deprecated TypeScript `baseUrl` option.
- Consolidation of current documentation and archival of superseded assessments and plans.

## Known constraints

- `storyStore.ts` remains the central coordinator and still owns visit, L3 assembly, unlock, and UI orchestration concerns.
- Several visual components and atmospheric map effects subscribe directly to broad store state.
- Package-level checksums remain deferred until a second story can establish a timestamp-independent, cross-package checksum contract.
- Eager content imports are acceptable for the current single-story scope but will not scale cleanly to a larger catalog.
- Automated accessibility verification remains limited beyond the primary reader controls exercised by the browser suite.

See [the roadmap](ROADMAP.md) for the prioritized response to these constraints.
