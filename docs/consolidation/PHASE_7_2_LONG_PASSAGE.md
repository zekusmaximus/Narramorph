# Phase 7.2 — Long-passage reading experience (design proposal)

Proposed before any 7.2 code (product/architecture-fork batch). It builds on the 7.1 reader-architecture decision (history-synced, hash-addressable modal — [PHASE_7_1_CANONICAL_JOURNEY.md](PHASE_7_1_CANONICAL_JOURNEY.md) §6) and grounds the roadmap's "whole vs. landmarks vs. segments" fork in **measured content data**. Interface chrome only; no authored runtime prose (ADR 0002); no package identity change.

## 1. Measured evidence (why the fork resolves the way it does)

Across all **1,305** shipped content strings (`src/data/stories/eternal-return/content/**`):

| Reading time (≈200 wpm) | Passages               |
| ----------------------- | ---------------------- |
| < 5 min (< 1,000 words) | 317                    |
| 5–10 min (1,000–2,000)  | 935                    |
| 10–15 min (2,000–3,000) | 46                     |
| 15–20 min (3,000–4,000) | 1                      |
| > 20 min (> 4,000)      | **6 — all L4 endings** |

- **Median passage ≈ 1,221 words (~6 min).** The overwhelming majority are 5–10 min.
- The only genuinely long reads are the **three L4 endings** (Preserve / Transform / Release), ~8,600–9,600 words each (~43–48 min) — and a reader reaches exactly one ending per journey.
- **L3 convergence is already segmented**: `L3AssemblyView` presents four sections (arch / algo / hum / conv) with next/prev and per-section read tracking.
- **0 of 1,305 passages contain markdown headings**, and `MarkdownContent` renders only paragraphs + bold/italic. The long endings are **unbroken literary prose with no authored section structure**.

## 2. Segmentation decision — keep passages whole (owner confirmation requested)

The roadmap's three options — stay whole / internal section landmarks / resumable segments — resolve against the data:

- **Resumable segments** would fragment single passages into multiple views, multiplying visit semantics (one `VisitEvent` per passage becomes many) and breaking "preserve exact visit semantics on reopen/partial read." Rejected.
- **Internal section landmarks** need section boundaries. There are none in the content, and the long reads are the endings — continuous prose whose literary effect depends on being unbroken. Deriving landmarks would mean either fabricating arbitrary breaks (literarily wrong) or **authoring** section headings into ending prose — a **content change requiring editorial sign-off (ADR 0002)**, out of scope for a 7.2 UX batch.
- **Keep passages whole** — chosen. Long-read comfort and resumability come from **scroll restoration, a visible progress indicator (already shipped), a line-height preference, a "back to top" affordance, and hash-addressability** (so a long session is never a modal trap), not from cutting the prose.

> If the owner wants true authored section landmarks in the endings later, that is a separate **content release** with editorial review — not this batch.

## 3. Route/hash-addressable reader (the architecture, per the 7.1 decision)

**Today:** the reader is a modal (`StoryView` 2D / `ContentPanel3D` 3D) driven by store `selectedNode` + `storyViewOpen`; `openStoryView`/`closeStoryView` record/finalize the visit; there is no router and the story id is read once from `?story=`. **The modal trap:** browser Back does not close the reader and a passage is not addressable.

**Proposed (no router dependency — a thin History-API sync hook):**

- A `useReaderRoute` hook reflects the open passage in the URL **hash** — `#/passage/:nodeId` (and the existing convergence surface as `#/convergence/:nodeId`). Empty hash ⇒ reader closed.
- **Opening** a passage `pushState`s the hash entry, so **browser Back pops it → `closeStoryView()`** — the exact same finalize-visit path as clicking Close or pressing Escape.
- **Closing** via Close/Escape navigates back (or replaces the hash) so the URL and the reader never disagree.
- **`popstate`** (Back/Forward, or an in-page hash change) is the single source of truth: if the hash targets an **available** passage, `openStoryView(nodeId)`; if empty, `closeStoryView()`. Locked / unknown / L3 ids fall back gracefully (land on the map; never open a locked node — the store already guards this).
- **Deep-link on load:** if the initial hash targets an available passage, open it after the story loads; otherwise land on the map. A bookmarked passage reopens directly.
- **`useDialogFocus` is preserved unchanged.** Back/Forward that closes the reader unmounts the modal, which triggers the existing focus **restoration** to the origin node; opening moves focus to the passage heading via `initialFocusSelector`. Containment, Escape, and background inerting are untouched.

**Visit semantics are preserved:** Back = Close = `finalizeActiveVisit`; deep-link/open = the same `visitNode` recording as a click; the idempotency guard already prevents double-recording when the hash resolves to the already-open node. No new or dropped `VisitEvent`s; saved-journey identity is unchanged.

## 4. Reliable scroll restoration

`StoryContent` currently resets `scrollTop = 0` whenever content changes. Proposed:

- Remember the scroll position **keyed by `nodeId` + the resolved `variationId`** (or a content hash), in a **device-local, in-memory/`sessionStorage`** store — **off the save schema and out of exported journeys** (a UI convenience, not journey content).
- On open/resume: if the same `(nodeId, variationId)` content is shown again, **restore** the saved position; if a revisit renders **different** prose, **reset to top** (restoring a stale offset into new text would land mid-sentence). This makes an interrupted long ending resume exactly where it was, while a changed revisit starts clean.
- Reload mid-read (interrupted session): the hash reopens the passage and scroll restoration returns to the saved offset.

## 5. Reading comfort — line-height preference

- Add a **`lineHeight`** preference (e.g. `cozy` / `normal` / `relaxed`) to `UserPreferences` and the Settings dialog, alongside text-size and theme. Applied to the reader surface (`StoryContent`, and the 3D reader) so long reads can be tuned.
- **Additive and defaulted** — old saves without the field fall back to the default at load, so **no save-schema version bump** and no migration (the same additive-with-default posture ADR 0004 used for `bridgeText`). Text-size ordering (small < medium < large) is retained and re-verified.

## 6. Navigation aids (no authored structure required)

- Keep the shipped **visible passage-progress** bar (`StoryContent`'s `role="progressbar"`).
- Add a **"Back to top"** control that appears once a passage is scrolled down (keyboard-reachable, reduced-motion safe), useful for the long endings.
- Keep the **continuation footer** (7.1) as the clear onward action.

## 7. Robustness (test matrix — the 7.2 gate)

Automated where possible; the rest is a device checklist the owner runs.

| Case | Approach |
| --- | --- |
| Interrupted session | e2e: open a passage, scroll, reload → same passage + scroll restored. |
| Browser Back closes reader | e2e: open → Back → map, focus restored to origin node; no visit dropped. |
| Deep-link / bookmark | e2e: load with `#/passage/:id` → reader opens on an available passage; locked/unknown → map. |
| Keyboard + screen reader | e2e/axe: focus containment/restoration preserved across route changes. |
| 200% text / reduced motion / small screen | existing responsive + reduced-motion specs extended. |
| Print | print stylesheet renders the passage legibly (no clipped modal); manual verify. |
| Selection / copy | selection works in the scroll region; copy excludes chrome. |
| Zoom / mobile orientation / virtual keyboard | manual device checklist (owner); no horizontal overflow, no obscured controls. |

## 8. Owner decisions requested before 7.2 code

1. **Segmentation (§2)** — confirm **keep passages whole** (scroll restoration + hash-addressability + line-height + back-to-top), declining artificial/authored section landmarks for now (they'd be a separate content release). Recommended.
2. **Line-height as a saved preference (§5)** — accept adding `lineHeight` to `UserPreferences` as an additive, defaulted field (no save-schema bump), consistent with text-size/theme. Recommended. (The alternative — a device-local-only setting off the save schema — is possible but inconsistent with the other reading prefs.)

Everything else (hash-sync wiring, scroll restoration, back-to-top, robustness tests) is implementation of the already-decided architecture and needs no separate sign-off.
