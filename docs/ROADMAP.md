# Narramorph roadmap

Updated: July 12, 2026

This roadmap starts from the merged state of `main`. It favors small, independently reviewable changes and does not assume a rewrite or a server backend.

## Guiding order

1. Protect correctness and reproducibility.
2. Reduce coupling at domain and UI boundaries.
3. Verify the reader experience with accessibility and browser tests.
4. Optimize only from measured evidence.
5. Expand platform scope after the single-story path is dependable.

## Now: stabilize the product boundary

### 1. Finish domain/store separation

- Persistence and save migration sit behind pure save-state logic and a focused progress repository.
- Variation selection, fallback handling, absolute history deduplication, and condition-context construction now sit behind focused domain functions.
- Story content, unlock configuration, maps, fresh progress, and viewport state are prepared as one injected, atomic loading transition before the store applies them.
- Keep the store as a coordinator with narrow actions; do not introduce slices until extracted responsibilities make useful slice boundaries obvious.

This milestone is complete: persistence, selection, and content orchestration are tested without mounting the store, while the store remains the coordinator and saved-state compatibility is unchanged.

### 2. Make content ownership reproducible

- Canonical authoring inputs, generated outputs, checked-in runtime inputs, safe commands, and do-not-edit boundaries are now documented.
- Strict runtime checks now cover declared story/layer counts, duplicate IDs, orphaned files, required aggregates, selection-matrix references, manifest totals, and deterministic ordering.
- Keep migration repair/fallback behavior in conversion tooling and fail CI on malformed runtime content.
- The tracked 81-record L1/L2 authoring groups are now the strict source contract. An explicit runtime profile selects the stable 12-record L1 package after complete-source validation; L2 remains complete at 729 records.
- Deterministic package checksums remain deferred until a second story establishes a cross-package contract; current structural checks provide the useful guarantee now.

This milestone is complete: a strict full dry run validates 243 L1 source records, 729 L2 records, 270 L3 records, and 3 L4 records, then reports the intended 12/729/270/3 runtime package without count errors.

### 3. Establish end-to-end reader-path confidence

- Cover a representative L1 to L2 to L3 to L4 journey in a real browser.
- Verify save/restore, revisit transformation, unlock notifications, and ending selection.
- Add failure-path coverage for missing content and unavailable WebGL.

This milestone is complete: Chromium coverage exercises revisits and variation deduplication, L3/L4 unlock notifications, ending selection, save/restore, missing-story recovery, and WebGL fallback through the real reader UI.

## Next: simplify and make the UI inclusive

### 4. Continue component decomposition

- Split `StoryView`, `CustomStoryNode`, `Layout`, and remaining `JourneyTracker` orchestration into focused presentation and state-adapter components.
- Move atmospheric map effects behind narrow props instead of broad store subscriptions.
- Standardize loading, empty, and error states across 2D, 3D, and story panels.

The first reader-experience foundation is complete: the shell, opening invitation, reader, preferences, and progress history now have focused presentation boundaries; permanent map overlays have been reduced to a quiet status surface; and mobile uses an intentional, pannable map viewport. Deeper atmospheric-effect subscriptions and the remaining `CustomStoryNode`, `Layout`, and tracker orchestration boundaries remain in this milestone.

### 5. Complete the accessibility pass

- Add keyboard node traversal and reliable focus return for story/L3 panels and modals.
- Verify semantic labels, screen-reader reading order, contrast, zoom, and text-size behavior.
- Ensure every continuous animation respects reduced motion.
- Add automated checks, backed by a short manual test checklist.

Success means the complete reading journey is usable without a pointer and without motion effects.

The foundation now includes persisted text-size, reading-surface, and reduced-motion controls; keyboard-operable dialogs and map entry; mobile-safe focusable controls; actual-text reading-time estimates; and passage scroll progress. A complete screen-reader reading-order, contrast, zoom, and continuous-animation audit remains before this milestone is closed.

## Later: performance and platform growth

### 6. Measure startup and interaction performance

- Track bundle composition and content-import cost in production builds.
- Profile map interaction and broad Zustand subscriptions on representative devices.
- Introduce lazy story/content boundaries before adding more stories.
- Reconsider a Web Worker for L3 only if new profiling shows meaningful main-thread blocking.

### 7. Prepare for additional stories

- Remove remaining hard-coded `eternal-return` discovery assumptions.
- Define story package/version compatibility and migration policy.
- Test two small story fixtures before advertising multi-story support.

### 8. Operational readiness

- Choose a deployment target and document preview/production release steps.
- Add privacy-respecting error and performance monitoring if the product is publicly hosted.
- Define beta feedback, release criteria, and rollback procedures.

## Not planned now

- A broad content-schema migration.
- A rewrite of the state layer or content pipeline.
- A server backend without a concrete product requirement.
- Performance architecture based only on historical bundle or profiling numbers.

## Roadmap maintenance

Review this document after each milestone. Move completed or superseded versions into `docs/archive/` instead of accumulating parallel plans, and keep `STATUS.md` limited to verified present-tense facts.
