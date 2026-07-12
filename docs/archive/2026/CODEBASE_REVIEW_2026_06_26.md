# Narramorph Codebase Review — 2026-06-26

## Executive summary

Narramorph is a mature Vite/React/TypeScript interactive-fiction app with strong narrative-content investment and a working technical spine: React UI, Zustand state, JSON-backed story content, conversion tooling, validation utilities, and tests. The repository's biggest risks are structural rather than conceptual:

- **Repository hygiene is the highest-impact cleanup area.** The tracked tree includes thousands of generated backup artifacts (`.backups`, `metadata-backups`) and checked-in dependency folders under `tools/`, while source code is comparatively small.
- **Backend-like logic exists, but it is embedded in the frontend.** Content loading, variation selection, unlock evaluation, persistence, and L3 assembly are client-side modules rather than a separate backend/service layer. That is workable for a static narrative product, but it makes the store and UI carry too many responsibilities.
- **The UI is functional but over-concentrated.** `Home`, `Layout`, `NodeMap`, `CustomStoryNode`, `StoryView`, and `JourneyTracker` mix orchestration, visual effects, persistence triggers, and presentation. The 2D/3D split is promising, but it needs a shared interaction shell and component decomposition.
- **The content pipeline is the real domain backend.** `tools/conversion` should be treated as a first-class package with tests, generated output directories, and clear source-of-truth rules.
- **Existing architecture docs are useful but duplicated.** Keep a small canonical set and move sprint reports, plans, and historical conversion notes into an archive.

## Repository inventory and redundancy

### Current shape

| Area | Observed role | Review |
| --- | --- | --- |
| `src/` | Runtime app code, story JSON, tests | Keep as runtime source, but split domain services from UI/state. |
| `src/data/stories/eternal-return/` | Runtime story metadata, content, layout, unlock config | Keep, but generated content should be reproducible and validated by tooling. |
| `tools/conversion/` | Content conversion, validation, matrix generation | Keep and harden as the content-pipeline package. Remove checked-in `node_modules`. |
| `tools/` root scripts | Older metadata/conversion utilities | Keep only current utilities; archive or remove one-off scripts after validating no npm scripts depend on them. |
| `archive/` | Legacy source markdown, old JSON, conversion planning | Keep out of runtime; consider moving to external storage or release artifact if repo size becomes painful. |
| `.backups/`, `metadata-backups/` | Generated backup snapshots | Remove from source control or migrate to external artifact storage. These are the clearest redundancy. |
| Root docs and `docs/architecture/` | Project, architecture, sprint, implementation documents | Consolidate to reduce contradictory status statements. |
| Root scripts (`standardize_*.py`, `convert_to_new_format.sh`) | Historical conversion helpers | Move under `tools/legacy/` or archive once superseded by `tools/conversion`. |

### High-confidence redundant candidates

1. **Generated backup folders:** `.backups/` and `metadata-backups/` dominate tracked file counts and should not be part of the working source tree. Keep only a manifest or a compressed release artifact if needed.
2. **Checked-in dependency directories:** `tools/node_modules` and `tools/conversion/node_modules` should be removed from git and covered by `.gitignore`.
3. **Stale root reports:** `lint-errors.txt`, `typescript-errors.txt`, `LINT_TYPESCRIPT_ERROR_PLAN.md`, `SPRINT1_IMPLEMENTATION.md`, and older architecture assessment files should either be updated into canonical docs or archived under `docs/archive/`.
4. **Duplicate conversion plans:** `archive/conversion-planning/*` overlaps with `tools/conversion/README.md`, `docs/architecture/*`, and root planning docs.
5. **Legacy pre-conversion tools:** `archive/pre-conversion-metadata-tools/*` and root standardization scripts appear superseded by `tools/conversion`; keep only if they support an unreproducible historical migration.

## Backend / domain-logic deep dive

There is no traditional server backend. The effective backend is a combination of:

- Vite glob-based content loading in `src/utils/contentLoader.ts` and `src/utils/variationLoader.ts`.
- Unlock, condition, validation, storage, L3 assembly, and node utility modules in `src/utils/`.
- A large Zustand store in `src/stores/storyStore.ts` that coordinates loading, progress, selection, visits, unlocks, persistence, and UI flags.
- Conversion and validation tooling in `tools/conversion/`.

### What is working

- Runtime content is strongly typed in broad strokes (`StoryNode`, `StoryData`, variation and unlock types).
- Variation loading now uses `unknown` plus runtime checks before casting in the main normalization path.
- Core domain utilities have unit tests for condition and unlock evaluation, plus the store has substantial coverage.
- Content is organized by story and layer, which is a solid long-term model.

### Backend/domain work still needed

| Priority | Work | Why it matters |
| --- | --- | --- |
| P0 | Split `storyStore.ts` into state slices or service modules | The store is the central god object and is the largest source file by far. Domain behavior is hard to reason about, test, and reuse. |
| P0 | Make content validation fail CI for runtime content | `contentLoader` soft-validates by catching validation errors. That is useful during migration, but production should have a strict validation command. |
| P1 | Define one canonical content schema | The loader supports legacy inline files, definition files, old paths, fallback content, and normalized variations. This migration tolerance should be isolated from runtime. |
| P1 | Move conversion outputs to a generated boundary | Source markdown/input, generated JSON, manifests, and backups need explicit source-of-truth rules. |
| P1 | Replace fallback discovery for L2 variation files with deterministic mapping | Current logic tries accept/resist/invest files and takes the first matching path, which risks wrong representative content for L2 nodes. |
| P1 | Persist selection-matrix cache correctly | `selectionMatrixCache` is declared as a constant null and never populated. Either remove it or implement real caching. |
| P2 | Add performance profiling around large JSON imports | Eager glob import of narrative JSON is simple, but runtime startup will scale poorly as content grows. |
| P2 | Create a domain test matrix | Add tests for full content load, variation selection by awareness/state/journey, L3 assembly, L4 ending selection, migration, and persistence restore. |

### Recommended backend/domain target structure

```text
src/
  domain/
    story/
      contentLoader.ts
      contentValidation.ts
      storyGraph.ts
    variations/
      variationLoader.ts
      variationSelection.ts
      selectionMatrix.ts
    unlocks/
      conditionEvaluator.ts
      unlockEvaluator.ts
    progress/
      progressModel.ts
      persistence.ts
    l3/
      assembly.ts
  stores/
    storyStore.ts          # composed slices, no heavy algorithms
    slices/
      contentSlice.ts
      progressSlice.ts
      uiSlice.ts
      unlockSlice.ts
  data/
    stories/...
```

## UI deep dive

### What is working

- The app has a clear shell (`App` -> `Layout` -> `Home`).
- 2D node map and experimental 3D mode coexist behind a toggle.
- Error boundaries are used at the app and visualization-panel levels.
- Visual identity is consistent and ambitious: cyberpunk styling, animated overlays, journey tracking, unlock notifications, and narrative panels.

### UI work still needed

| Priority | Work | Why it matters |
| --- | --- | --- |
| P0 | Break up the biggest visual components | `CustomStoryNode`, `StoryView`, `NodeMap`, `JourneyTracker`, and `Layout` are doing too much. Smaller presentational components will reduce regressions. |
| P0 | Create shared map interaction abstractions | 2D and 3D modes should share selection, hover, availability, node appearance, and panel state instead of duplicating assumptions. |
| P1 | Separate atmospheric effects from graph rendering | Effects like boot sequence, parallax, glitch, fog, trails, and tooltips should be feature modules or decorators around the graph. |
| P1 | Improve accessibility | Add keyboard paths for node traversal and modal focus management, verify contrast, and make animated effects respect reduced-motion preferences. |
| P1 | Make loading/error/empty states consistent | The app has several local fallbacks; centralize user-facing failure states for content load, WebGL failure, and missing variations. |
| P2 | Route or state-machine key screens | Home currently owns bootstrapping, map mode, modal presentation, and panels. Routes or a small UI state machine would make flows clearer. |
| P2 | Add component-level tests | Prioritize StoryView variation rendering, map node availability, progress modal, mode toggle persistence, and unlock notifications. |

### Recommended UI target structure

```text
src/components/
  app-shell/
    AppLayout.tsx
    Header.tsx
    ProgressModal.tsx
    SettingsModal.tsx
  map/
    NodeMap2D.tsx
    NodeMap3D.tsx
    MapModeToggle.tsx
    mapAdapters.ts
    effects/
  story/
    StoryPanel.tsx
    VariationDebugPanel.tsx
    ContentState.tsx
  journey/
    JourneyTracker.tsx
    JourneyMetric.tsx
  notifications/
    UnlockNotificationSystem.tsx
```

## Folder optimization plan

### Phase 1 — hygiene and safety (1-2 days)

1. Remove checked-in `node_modules` under `tools/` and `tools/conversion/`.
2. Add ignore rules for backup snapshots, generated reports, and local tool dependencies.
3. Move generated backups out of git or archive them externally.
4. Run a full baseline: `npm run type-check`, `npm run lint:ci`, `npm test`, `npm run build`, and conversion validation.
5. Create a canonical `docs/STATUS.md` and retire contradictory status docs.

### Phase 2 — domain extraction (3-5 days)

1. Extract pure functions from `storyStore.ts` into `domain/progress`, `domain/unlocks`, and `domain/variations`.
2. Convert store to slices with narrow responsibilities.
3. Make content validation strict in CI and keep migration-only tolerance in tooling.
4. Add full-story fixture tests for graph integrity and variation coverage.

### Phase 3 — UI decomposition (3-5 days)

1. Split `Layout` modals, `Home` orchestration, and map mode toggle into focused components.
2. Split `CustomStoryNode` into badge/state/action subcomponents.
3. Build shared map adapter types used by 2D and 3D views.
4. Add accessibility pass and reduced-motion support.

### Phase 4 — content pipeline hardening (3-7 days)

1. Establish `content-src/` vs generated `src/data/.../content/` ownership, or document why runtime JSON is canonical.
2. Normalize old conversion scripts under one CLI package.
3. Produce deterministic manifests with checksums and counts.
4. Add CI validation for expected layer counts, matrix coverage, and orphaned files.

## Suggested cleanup checklist

- [ ] Delete or untrack generated backup directories after confirming no unique source content exists only there.
- [ ] Delete or untrack nested `node_modules` directories.
- [ ] Add `.gitignore` entries for `.backups/`, `metadata-backups/`, `tools/**/node_modules/`, conversion reports, and temporary patch files.
- [ ] Move root one-off scripts into `tools/legacy/` or archive.
- [ ] Consolidate architecture docs into `docs/architecture/README.md`, `docs/STATUS.md`, and this review's successor.
- [ ] Extract story-domain services from `storyStore.ts`.
- [ ] Add full content integrity tests.
- [ ] Split large UI components and centralize loading/error states.

## Risk assessment

| Area | Risk | Severity |
| --- | --- | --- |
| Repository size/noise | Generated backups and dependencies make reviews, search, and clone/install slower. | High |
| Store complexity | One large state module increases regression risk. | High |
| Content correctness | Soft validation and legacy fallback paths can hide broken content. | High |
| UI maintainability | Large components mix visuals, effects, and orchestration. | Medium-high |
| Performance | Eager loading all content may hurt startup as content expands. | Medium |
| Documentation drift | Multiple status/planning docs may contradict actual code. | Medium |

## Bottom line

The project does not need a rewrite. It needs a staged structural cleanup: first remove generated clutter, then extract domain services from the store, then decompose the UI, then harden the content pipeline as the product's backend. The narrative architecture and runtime foundation are viable; the next work should focus on making the repo smaller, stricter, and easier to change safely.
