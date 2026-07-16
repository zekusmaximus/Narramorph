# ADR 0005: Rejected Project-Leibniz architectures

- Status: Accepted
- Date: July 16, 2026
- Decision owners: repository owner and product consolidation program
- Phase: 4, Batch 4.5 (Project-Leibniz archive gate)

## Context

Phase 4 completed porting Project-Leibniz's reader-facing strengths into Narramorph: order-aware conditions and plain-language explanations (Phase 3), compositional prose beats (4.1), condition-aware edge prose (4.2), the export-grade visit-event log (4.3), and the accessible journey export (4.4). Batch 4.5 is the archive gate. Part of that gate is an explicit, durable record of the Project-Leibniz architectures Narramorph deliberately did **not** adopt, so that archiving the repository does not lose the reasoning.

Project-Leibniz (frozen at `4f3f4600b8782aac5000b45dd64378baf318e1df`) is a client/server application:

- an Express 5 + Mongoose 8 + MongoDB backend (`server/index.js` connects with `mongoose.connect(config.MONGODB_URI)`; models `StoryNode`, `StoryLink`, `UserProgress`);
- a React Context + reducer journey-state tree (`client/src/context/`: `StoryProvider.tsx`, `StoryReducer.ts`, `StoryContextDefinition.ts`, `InitialState.ts`, `StoryTypes.ts`);
- a mutable module-singleton rule engine (`client/src/services/StoryLogicService.ts:446` `export const storyLogicService = new StoryLogicService()`, described in-source as a "module singleton" whose `once` rules are re-armed by mutating shared state);
- a D3 force-directed map visual (`client/src/services/mapVisuals.ts`, `NodeMap`).

ADR 0001 already set v1 as a static, client-side product, and ADR 0003 already rejected the Context state tree and the singleton rule engine when porting the condition/explanation model. This ADR consolidates and completes those rejections as the archive-gate record.

## Decision

Narramorph rejects the following Project-Leibniz architectures. Each rejection names where the useful capability instead lives in Narramorph.

### 1. Express/Mongoose/MongoDB backend — rejected for v1

v1 is a static, client-side product with local persistence (ADR 0001). Narramorph has no server, no Mongo/Express/Mongoose dependency (verified: no such packages in `package.json` or `tools/conversion/package.json`, and no such imports in `src/`), and persists journeys in `localStorage` through the versioned save schema (`src/domain/progress/saveState.ts`). Cloud accounts or sync are a deliberate future decision requiring their own ADR (Phase 8.1), not an inheritance of Project-Leibniz's server. Project-Leibniz's historical MongoDB Atlas credential was rotated/revoked in Batch 0.2 (the compromised database user and both IP access-list entries were deleted); archiving does not substitute for that rotation, which already occurred.

### 2. React Context + reducer journey-state tree — rejected

Narramorph's authoritative journey state is the Zustand store `src/stores/storyStore.ts` over pure domain functions; condition evaluation receives an explicit immutable `ConditionContext`. Importing Project-Leibniz's `StoryProvider`/`StoryReducer` would create a second, competing source of journey state. ADR 0003 already recorded this rejection; there is one authoritative `UserProgress`, and the append-only `selectionRecords`/`visitEvents` logs are evidence of past decisions, never a second state model that drives selection.

### 3. Mutable module-singleton rule engine — rejected

`StoryLogicService` is a shared mutable singleton whose rule state is re-armed by mutation. Narramorph replaces it with pure, deterministic evaluators that take explicit inputs and return values without hidden shared state: `evaluateJourneyCondition` (`src/domain/variation/conditions.ts`), the variation matcher (`src/utils/conditionEvaluator.ts`), the prose-beat resolver (`src/domain/variation/proseBeats.ts`), and the edge-bridge resolver (`src/domain/bridges/edgeBridge.ts`). Determinism and selection-invariance are proven by behavioral tests, which a mutable singleton cannot guarantee.

### 4. D3 force-directed map visual — rejected as the product visual

Narramorph keeps its own accessible 2D map (React Flow with a semantic, keyboard-navigable surface and an experimental, lazy-loaded 3D view) rather than Project-Leibniz's D3 force simulation (`mapVisuals.ts`). The rejection is of the visual/interaction implementation, not of graph behavior: graph progression, unlocks, and navigation semantics are preserved and tested in Narramorph. A future product-visual change would be a deliberate design decision, not an inheritance of the force layout.

## Consequences

- Archiving Project-Leibniz loses no decision rationale: every rejected architecture is recorded here with the Narramorph replacement that carries its useful capability.
- Narramorph has no runtime or build dependency on Project-Leibniz, its backend, or its client architecture.
- v1 remains static and client-side; a backend or cloud sync remains a separate, future, ADR-gated decision.

## Rejected alternatives

- Adopt Project-Leibniz's server for v1 persistence or accounts.
- Port the Context/reducer tree or the singleton rule engine as a second journey-state authority.
- Replace Narramorph's accessible map with the D3 force visual.

## Verification

This decision is implemented when the Batch 4.5 parity review shows every extraction-matrix capability migrated or rejected, Narramorph has no Project-Leibniz/Mongo/Express dependency, the replacement features pass unit and browser tests, provenance/licensing are complete, and the historical credential rotation is confirmed — with owner acceptance recorded before Batch 4.6 archives the repository.

## Related records

- [ADR 0001: repository boundaries](0001-repository-boundaries.md)
- [ADR 0003: adaptive selection conditions and explanations](0003-adaptive-selection-explanations.md)
- [Feature extraction matrix](../consolidation/FEATURE_EXTRACTION_MATRIX.md)
- [Phase 4 Leibniz parity review](../consolidation/PHASE_4_LEIBNIZ_PARITY.md)
- [Phase 4 execution record](../consolidation/PHASE_4_EXECUTION.md)
