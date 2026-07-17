# Accessibility statement — Narramorph

Narramorph is committed to being usable by as many readers as possible, including people who use assistive technology. This statement describes the current accessibility of the reader experience, the standard we target, what has been tested, and the limitations we know about.

- **Target standard:** WCAG 2.1 Level AA.
- **Current status:** Partially conformant — the automated checks below pass and the primary reading journey is fully keyboard- and screen-reader-operable; the manual assistive-technology matrix (§4) is the remaining gate and its results are recorded here only once run.
- **Scope:** the Narramorph reader web application (the story content itself is a literary work).
- **Feedback:** please report accessibility problems on the project issue tracker — <https://github.com/zekusmaximus/Narramorph/issues>. Describe the page/action, your browser and assistive technology, and what happened. We treat critical accessibility defects as release blockers.

_This is a living document; the conformance claim is only as strong as its evidence. Automated evidence is enforced in CI (§3); manual evidence (§4) is filled in as passes are run — never assumed._

---

## 1. How the product is designed for access

- **The story is readable without the visual map.** Opening a passage, reading it, following a branch, and reaching an ending are all reachable by keyboard, and by a **linear passage list** (see below) — not only by navigating the spatial graph.
- **No critical task requires WebGL.** The default map is plain DOM/SVG and fully keyboard-navigable. The optional 3D view is a visual enhancement; it ships with an always-visible, plain-DOM **passage list** (`SceneNodeList`) that mirrors it and activates the same passages, so the WebGL canvas is never the only way through.
- **A non-spatial alternative on both maps.** Each map surface offers a linear **"Passage list"** — a keyboard/screen-reader list of passages grouped by perspective that opens the same reader a click would. On the 2D map it is a collapsible panel; in the 3D view it is always visible.
- **Motion is never required.** A "Reduce motion" setting (honouring the OS `prefers-reduced-motion` and an in-app toggle) suppresses decorative animation; no task depends on motion.
- **Colour is never the only signal.** Passage status is conveyed by text ("Locked" / "Available" / "Opened" / "Reading") and ARIA state, not colour alone.
- **Focus is managed and visible.** Dialogs (reader, settings, progress) trap focus, restore it on close, close on `Escape`, and mark the rest of the page `inert`; interactive elements have a visible focus outline. A "Skip to story" link and landmark structure (header / main / footer) are provided.
- **Reader comfort controls.** Text size, line height, and light/dark/sepia themes; a print-friendly view; and reading progress that persists locally on the device (nothing is uploaded).

## 2. Compatibility

The reader targets current versions of Chrome, Firefox, Safari, and Edge on desktop, and Chrome and Safari on mobile. It is built to work with the assistive technologies in the §4 matrix; confirmed combinations are listed there once tested.

## 3. What is tested automatically (enforced in CI)

Automated accessibility checks run in the end-to-end suite on every change:

- **WCAG rule scans (axe-core)** on the landing/map, the open reader, the progress and settings dialogs, and the expanded linear passage list (shared by the 2D map and the 3D view) — failing on any serious or critical violation. (The 3D WebGL view itself is validated in real browsers and the manual matrix, since automated CI runs without a GPU.)
- **Keyboard-only + list-navigable journey** through the reading path (open a passage from the list → follow a branch), asserting no pointer input and no WebGL are needed.
- **List-navigable, WebGL-free journey** using only the linear passage list.
- **Reduced-motion and forced-colours** operability checks on the reader, map, and dialogs.

Automated scans catch rule violations, not task-completion failures, so they raise and hold the floor; they do not replace the manual passes in §4.

## 4. Manual assistive-technology validation (owner/tester-run)

The following protocol is run by the owner/testers on real assistive technology. **Results are recorded only when a pass is actually performed — this document fabricates none.**

### 4.1 Matrix

| Assistive technology                           | Browser     | Platform |
| ---------------------------------------------- | ----------- | -------- |
| NVDA                                           | Firefox     | Windows  |
| NVDA                                           | Chrome      | Windows  |
| VoiceOver                                      | Safari      | macOS    |
| VoiceOver                                      | Safari      | iOS      |
| TalkBack                                       | Chrome      | Android  |
| Windows High Contrast / forced colours         | Edge/Chrome | Windows  |
| Browser zoom 200% + text-spacing (WCAG 1.4.12) | any         | any      |

### 4.2 Task scripts (run under each combination)

1. Enter the story through each perspective (Archaeologist / Algorithm / Last Human).
2. Open a passage; confirm the title is announced and the prose is readable in reading order.
3. Open and read the "Why this version?" explanation; confirm it is optional, not intrusive.
4. Follow a branch to another passage.
5. Reach an ending; confirm the milestone and export invitation are announced.
6. Open reading progress; export a save; start a new journey (confirm the guard is announced).
7. Trigger and dismiss a recovery notice (corrupt-save / quota / migration).
8. Navigate the map **by keyboard** and **by the passage list**; confirm both reach every available passage and open the reader.
9. Toggle reduce motion and confirm decorative animation stops.

### 4.3 Results (fill when run)

| Date | AT / Browser / OS | Tasks passed | Issues found (severity) | Tester |
| ---- | ----------------- | ------------ | ----------------------- | ------ |
| _—_  | _—_               | _—_          | _—_                     | _—_    |

## 5. Known limitations

- **The 3D view is an enhancement, not a requirement.** It uses WebGL and depends on GPU support; its accessible path is the plain-DOM passage list, and the entire story is completable in the 2D default.
- **The map is an inherently spatial, complex graph.** Spatial arrow-key traversal may be demanding for some users; the linear passage list is provided as the non-spatial alternative on both maps.
- **Manual AT coverage is in progress.** Until the §4 matrix is completed and recorded, conformance is claimed only where automated evidence or a recorded manual pass supports it.

## 6. WCAG 2.1 AA checklist (evidence-linked)

Status legend: **Supported** (evidence exists) · **Automated** (enforced in the a11y e2e suite) · **Manual** (verified only by a recorded §4 pass) · **Partial** (supported with a known limitation).

| Guideline | Criterion (2.1 AA) | Status | Evidence |
| --- | --- | --- | --- |
| 1.1.1 | Non-text content | Supported | Decorative visuals `aria-hidden`; icon buttons have text labels |
| 1.3.1 | Info & relationships | Supported | Landmarks, headings, list semantics, dialog labelling |
| 1.3.2 | Meaningful sequence | Supported | Reading order preserved; passage list is linear |
| 1.4.1 | Use of colour | Supported | Status conveyed by text + ARIA, not colour alone |
| 1.4.3 | Contrast (minimum) | Automated | axe contrast scan across surfaces (§3) |
| 1.4.10 | Reflow | Supported | 390px reflow, no horizontal overflow (`responsive-experience.spec`) |
| 1.4.11 | Non-text contrast | Automated | axe scan of controls/focus indicators |
| 1.4.12 | Text spacing | Manual | Text-spacing pass in §4 matrix |
| 1.4.13 | Content on hover/focus | Supported | Tooltips non-essential; status also in the list/labels |
| 2.1.1 | Keyboard | Automated | Keyboard-only journey + map traversal (`accessibility-confidence`, semantic-journey) |
| 2.1.2 | No keyboard trap | Supported | Dialog traps release on `Escape`/close; focus restored |
| 2.4.1 | Bypass blocks | Supported | "Skip to story" link + landmarks |
| 2.4.3 | Focus order | Supported | Ordered, contained focus in dialogs (`accessibility-confidence`) |
| 2.4.7 | Focus visible | Automated | Visible focus outline asserted on map + controls |
| 2.5.3 | Label in name | Supported | Visible labels match accessible names |
| 2.5.5 | Target size (AAA at 2.2; we aim high) | Partial | Controls use `min-h-11`/`min-w-11` where practical |
| 2.3.1 | Three flashes | Supported | No flashing content; motion is decorative + reducible |
| 3.2.x | Predictable | Supported | No context change on focus; navigation is explicit |
| 4.1.2 | Name, role, value | Automated | axe scan + role/`aria-current`/`aria-roledescription` assertions |
| 4.1.3 | Status messages | Supported | `role="status"` notices (recovery, hints, milestones) |

Criteria marked **Manual** are confirmed only once a §4 pass records them; nothing here is claimed without either automated evidence or a recorded manual result.

---

_Last updated: this statement is maintained alongside the reader; see the Phase 7.5 record in `docs/consolidation/PHASE_7_EXECUTION.md` for the change history._
