# Narramorph status

Updated: July 12, 2026

## Current baseline

- The application builds on React 18, TypeScript, Vite, Zustand, React Flow, and React Three Fiber.
- _Eternal Return of the Digital Self_ is present as the complete checked-in runtime story across L1-L4.
- CI-oriented runtime validation checks raw L1/L2 variations, the assembled story graph, L3 aggregate loading, and the selection matrix without relying on migration normalization.
- The conversion package has its own strict validator and test suite.
- Progress/journey calculations, L2 progression, connection reveal logic, and unlock progress have begun moving from `storyStore.ts` into pure domain modules.
- The 2D and 3D maps now share a map interaction adapter, and reduced-motion behavior has an explicit preference hook.
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

- `storyStore.ts` remains the central coordinator and still contains persistence, content-loading, variation, visit, and UI orchestration concerns.
- Several visual components and atmospheric map effects subscribe directly to broad store state.
- Runtime JSON ownership versus conversion source ownership is documented imperfectly and remains a content-pipeline risk.
- Eager content imports are acceptable for the current single-story scope but will not scale cleanly to a larger catalog.
- Automated browser-level coverage and accessibility verification remain limited.

See [the roadmap](ROADMAP.md) for the prioritized response to these constraints.
