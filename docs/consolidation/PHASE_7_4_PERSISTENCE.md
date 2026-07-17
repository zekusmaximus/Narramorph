# Phase 7.4 — Persistence, recovery, and reader control (design before code)

> Proposal for issue [#174](https://github.com/zekusmaximus/Narramorph/issues/174), parent epic [#93](https://github.com/zekusmaximus/Narramorph/issues/93). Written **before implementation**; the owner forks in §6 are open until confirmed. Running evidence lands in [PHASE_7_EXECUTION.md](PHASE_7_EXECUTION.md) as the batch is built.

Phase 7.4 makes the reader the **owner** of their journey: they can start a new one deliberately, carry a journey between devices as a real save file, and never silently lose progress to a corrupt save or a full storage quota. It is the one Phase 7 batch permitted to bump the **save schema**; §2 argues it does not need to. Interface chrome only — no authored runtime prose (ADR 0002).

---

## 1. Current-state audit (grounded)

The persistence machinery is solid but **only half-connected**: the domain and store primitives exist, yet the reader-facing surface and the honest-failure paths are missing.

### 1.1 The save envelope and migration engine (working)

- `src/domain/progress/saveState.ts` — `CURRENT_SAVE_VERSION = '1.3.0'`, `CURRENT_APP_VERSION = '0.1.0'`. `buildSavedState(progress, preferences, timestamp, storyPackage?)` produces the envelope `{ version, appVersion, storyPackage, timestamp, progress, preferences }`; `serializeSavedState` pretty-prints it.
- `prepareSavedState(data, nodes)` is the migration engine: it validates, then applies an **ordered** `SaveMigration[]` (`app-version`, `story-package-identity`, `story-package-provenance`, `temporal-awareness`, `l2-unlocks`, `l3-convergence`, `selection-records`, `visit-events`), reconstructing fields absent from older saves and normalising provenance-only predecessors to the current package. Unknown/removed node IDs are ignored rather than invalidating the save.
- `src/repositories/progressRepository.ts` — the load/save boundary over injected storage; `load` returns `{ status: 'empty' | 'invalid' | 'loaded', ... }`; `save` returns a boolean.

### 1.2 The gaps

| # | Gap | Evidence | Consequence |
| --- | --- | --- | --- |
| G1 | **No reader-facing control** reaches `clearProgress` / `exportProgress` / `importProgress` | `grep` of `src/components/**` finds only test `mockReset()` hits — zero call sites | No "new journey", no reset guard, no cross-device move |
| G2 | **`importProgress` bypasses migration** | `storyStore.ts:1003` parses + `validateSavedState` + direct `set`, **not** `prepareSavedState` (contrast `loadProgress` at `:948`) | An imported older-schema save is not migrated; reconstructed fields (e.g. `visitEvents`, `temporalAwarenessLevel`) stay missing |
| G3 | **Quota failure is silent** | `utils/storage.ts:18` catches `QuotaExceededError` → `console.warn` only ("Could trigger UI notification here"); `saveProgress` (`storyStore.ts:934`) logs `devError` and returns | Reader keeps reading while nothing is being saved — silent data loss |
| G4 | **Corrupt save fails silently and repeatedly** | `loadProgress` (`:948`) on `status: 'invalid'` → `devError` + return; the corrupt blob stays under `narramorph-saved-state` | Every future load re-fails; the reader is never told and cannot salvage the data |
| G5 | **Migration is invisible to the reader** | migrations only `devLog` (`:960`) | The "consent-respecting migration telemetry" in the roadmap has no surface |

### 1.3 What already matches the intended design (keep)

- `clearProgress` (`storyStore.ts:1023`) resets **progress only** — it rebuilds `createInitialProgress()` and leaves `state.preferences` untouched. That is the behaviour Fork B recommends; no change needed beyond wrapping it in a guard.
- `validateSavedState` (`utils/validation.ts:174`) is lenient about the additive/defaulted preferences (`lineHeight`, `includeAdaptationNotesInExport`) — it only hard-checks `theme` and `textSize` — so older and newer preference sets both load. No schema pressure from Phase 7.1–7.3.
- `utils/journeyDownload.ts` already provides `downloadTextFile(filename, mimeType, content)`, reused by the Markdown/print export — the save-file export reuses it with `application/json`.

---

## 2. Save-schema versioning — recommendation: **keep `1.3.0`**

7.4 adds **UI and recovery flows over the existing envelope**; it introduces **no new required persisted field**. The envelope shape (`version/appVersion/storyPackage/timestamp/progress/preferences`) is unchanged, and every field a 7.4 feature touches already exists or is additive/defaulted:

- **Import/export** serialise and re-hydrate the _current_ envelope; routing import through `prepareSavedState` means older files are _migrated up_, which is exactly what the existing engine and version number are for. Migration is a reason **not** to bump — the machinery already spans versions.
- **New-journey / reset / quota / corrupt-recovery** are behaviours, not stored fields.
- **Quarantine** writes the corrupt blob verbatim to a _separate_ device-local key (`narramorph-saved-state.corrupt`); it is not part of the save schema.

A bump to `1.4.0` would be **churn without a migration to carry** — it would force a no-op migration entry and e2e identity edits for no schema change. **Recommendation: do not bump.** The batch stays permitted to bump; if the owner wants a new _required_ field (none is proposed here), the identity-pin checklist in [PHASE_7_EXECUTION.md](PHASE_7_EXECUTION.md) §Contract-identities applies. This is Fork A.

---

## 3. Recovery & control design

All copy below is **interface chrome** (buttons, notices, confirmations) — no authored runtime prose, no canon quotes (ADR 0002). Everything stays **local**: nothing is uploaded (matching the export panel's existing "stays local and is never uploaded" contract).

### 3.1 New journey / reset (guarded, export-first)

A single reader control ("Start a new journey") lives in the **progress dialog**, beneath the export section (the natural "your journey" home), not in Settings (which is reading-comfort). Activating it opens a small confirmation:

- **Body:** explains it clears reading progress on this device and keeps reading settings; irreversible.
- **Primary offer:** "Export first" (reuses the machine-readable save export in §3.2) before confirming.
- **Confirm / Cancel.** Confirm calls the existing `clearProgress` (progress-only reset) and closes the reader/selection. Uses `useDialogFocus` for the trap/restore/Escape contract already standard in N.

### 3.2 Machine-readable save import/export (distinct from Markdown)

A "Save file (this device → another)" affordance, separate from the literary export, with two actions:

- **Export save** → `exportProgress()` JSON via `downloadTextFile('narramorph-journey.json', 'application/json', …)`. This is the round-trippable data file, not the human-readable Markdown.
- **Import save** → a file `<input type="file" accept="application/json">`; on select, read the text and hand it to a **migration-aware** import (see §4). Import shows an explicit result:
  - success → dismissible confirmation, progress refreshed;
  - invalid/corrupt file → non-destructive error notice (current in-progress journey untouched);
  - **overwrite guard** — because import replaces the in-progress journey, the same "Export first" offer is presented before applying (Fork D).

### 3.3 Corrupt-save recovery (quarantine, non-blocking)

When `loadProgress` sees `status: 'invalid'`:

1. **Quarantine** — copy the raw stored string to `narramorph-saved-state.corrupt` (device-local), then clear the primary key so the app starts clean and does not re-fail every load (fixes G4).
2. **Start fresh** — default state; the reader can read immediately.
3. **Recovery notice** — a dismissible, non-blocking banner: "We couldn't read your previous save" with a **"Download the unreadable data"** action (so a reader/maintainer can inspect or recover it) and a dismiss that also clears the quarantine key. Never a blocking modal (Fork C).

### 3.4 Storage-quota signal (honest, non-blocking)

`saveProgress` already learns of failure (the repository returns `false`). 7.4 threads that boolean into a store flag (`lastSaveFailed`) that drives a dismissible reader notice: "Your progress may not be saving on this device — storage is full." Offer the **save-file export** as the escape hatch. No silent data loss (fixes G3). The notice re-arms on the next failed save and clears on the next successful one.

### 3.5 Migration notice (local, consent-respecting)

When a load applies migrations (`result.migrations.length > 0`), surface a one-time, dismissible local notice ("We updated your save from an earlier version"). **No network, nothing uploaded** — "consent- respecting" here means it is a passive local acknowledgement, not analytics. This is the honest surface for G5. (Fork C bundles whether this is worth a visible surface at all vs. staying a dev-log.)

---

## 4. Implementation shape (after confirmation)

- **`importProgress` becomes migration-aware (G2 fix).** Route parsed data through `prepareSavedState(parsed, get().nodes)` and assign the migrated `savedState.progress/preferences` (mirroring `loadProgress`), returning a richer result (`{ ok, migrations }` or a discriminated outcome) so the UI can report success + any migration. Keeps `exportProgress` as-is.
- **Repository/quarantine boundary (G4).** Add a repository method to quarantine + clear the primary key, and a reader for the quarantined blob — keeping `localStorage` keys behind the repository, not in components. Quarantine key `narramorph-saved-state.corrupt` is device-local, off the save schema.
- **Quota surfacing (G3).** `saveProgress` sets a `lastSaveFailed` store flag from the repository boolean; a small notice component subscribes. No change to `saveToStorage`'s catch beyond keeping the boolean contract.
- **Reader-control UI.** A `JourneyControlActions` section in the progress dialog (new journey + save-file import/export), plus lightweight notice components for corrupt-recovery, quota, and migration. All theme-aware and keyboard-reachable; confirmations use `useDialogFocus`.
- **No package identity touched.** Save schema stays `1.3.0` under the §2 recommendation.

---

## 5. Test & gate plan

- **Unit/domain:** migration-aware `importProgress` (older-schema JSON migrates; `visitEvents` etc. reconstructed) ; quarantine round-trip (invalid blob → quarantined + primary cleared + retrievable); quota flag set on `save === false` and cleared on success; export/import round-trip preserves progress.
- **Component:** new-journey confirmation (guard blocks accidental reset; export-first offered; confirm calls `clearProgress`); import overwrite guard; corrupt-recovery notice actions; quota notice visibility.
- **e2e:** a reader exports a save, resets with confirmation (progress cleared, preferences kept), imports the save back (progress restored). If §2 holds, **no** `phase-2-vertical-slice.spec.ts` identity edit is required; if the owner elects a bump (Fork A → bump), the identity-pin checklist runs.
- **Full Phase-7 gate battery:** type-check; `lint:ci` 0/0; `test:run`; story/runtime/canon-strict/ literary/slice validation; `build`; `bundle:check` (CSS budget 72,500 / 13,700); Playwright with a verified **real** exit code (throwaway sandbox-Chromium config, deleted after, never committed).

---

## 6. Owner forks (open — confirm before code)

**A. Save-schema version.** Recommendation **(1) keep `1.3.0`** — 7.4 adds no required persisted field; import migrates via the existing engine (§2). (2) Bump to `1.4.0` proactively (runs the identity-pin checklist; adds a no-op migration entry).

**B. "New journey" scope.** Recommendation **(1) reset progress, keep reading preferences** (theme, text size, line height, reduce motion, export-notes) — matches today's `clearProgress`. (2) Full wipe including preferences.

**C. Corrupt-save + migration surfacing.** Recommendation **(1) quarantine + dismissible non-blocking notices** for both corrupt-recovery and migration (raw blob downloadable; nothing uploaded). (2) Quarantine silently, no reader notice (keep dev-log only). (3) Blocking modal on corrupt save.

**D. Import overwrite guard.** Recommendation **(1) confirm + offer "export first" before overwrite**, and route import through `prepareSavedState` so older files migrate. (2) Direct overwrite (still migration-aware, but no export-first offer).

---

## 7. Confirmed decisions

_Pending owner confirmation of §6._
