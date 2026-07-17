# Phase 7.5 — Manual accessibility & inclusive-design validation (design before code)

> Proposal for issue [#175](https://github.com/zekusmaximus/Narramorph/issues/175), parent epic [#93](https://github.com/zekusmaximus/Narramorph/issues/93). Written **before implementation**; the owner forks in §6 are open until confirmed. Running evidence lands in [PHASE_7_EXECUTION.md](PHASE_7_EXECUTION.md) as the batch is built.

Phase 7.5 is the final Phase 7 batch. Its acceptance gate is a single sentence with teeth:

> **No critical task requires sight, pointer precision, colour alone, motion, or WebGL.**

The job is to (a) automate what is automatable so the bar is enforced in CI, (b) give the owner a real manual-AT protocol to run (recorded, never fabricated), (c) validate the graph's **semantic** alternative rather than only dialog mechanics, and (d) ship an accessibility checklist + public statement. Interface chrome and meta-docs only — no authored runtime prose (ADR 0002); no package or save-schema change.

---

## 1. Current-state audit (grounded)

### 1.1 Already strong (validate + hold)

- **Keyboard + focus discipline.** `e2e/accessibility-confidence.spec.ts` drives the entire 2D reader by keyboard: `Skip to story` → header (guide/progress/settings) → perspective entry → reader dialog with a contained `useDialogFocus` trap (title focus, `Escape`, restore) → the "Why this version?" and ledger disclosures → arrow-key map traversal (each node `role="button"` + `aria-current` + `aria-roledescription="passage"` + `aria-describedby`, visible focus outline; `Delete`/`Backspace` no-op; edges `role="presentation"` + `aria-hidden`) → settings/progress dialogs as inert-backed traps.
- **Reduced motion, app-wide.** The settings toggle sets `data-reduced-motion` on `.archive-shell` and removes decorative particles; `useReducedMotionPreference` honours both the system preference and the in-app setting (`e2e/responsive-experience.spec.ts`). Motion is never required to complete a task.
- **A non-WebGL default.** The 2D map is DOM/SVG (react-flow), not WebGL; the 3D view is opt-in.
- **The 3D view already has a semantic alternative** — `src/components/3d/SceneNodeList.tsx`: a plain-DOM, no-motion, keyboard/SR `nav` ("Passage list") that mirrors the canvas via the shared interaction adapter and activates the same selection, so WebGL is never the only way to navigate.
- **Landmarks + names.** Skip link, `#main-content`, header/footer landmarks, dialog labelling, and the footer's `aria-label` progress summary are in place.

### 1.2 Gaps 7.5 closes

| # | Gap | Consequence |
| --- | --- | --- |
| A1 | **No automated WCAG rule scanner** (no axe/pa11y in `package.json`) | Contrast / name / role / ARIA regressions can land unseen between the hand-rolled assertions |
| A2 | **The 2D map has no linear list alternative** — only spatial arrow-key traversal | The default surface's "semantic alternative" is a graph walk, which is harder for SR users than a linear path list (the 3D view already has one) |
| A3 | **Forced-colours / high-contrast and text-spacing not asserted** in e2e | WCAG 1.4.12 / forced-colours support is unproven for the reader/controls |
| A4 | **No accessibility statement or release checklist** | Release can't state a conformance target or known limitations |
| A5 | **No defined manual-AT protocol** | Manual passes risk being ad hoc or (worse) assumed |

---

## 2. What "automatable" covers (and what it does not)

Automated scans **cannot** certify accessibility — they catch rule violations, not task-completion failures. So 7.5 pairs two kinds of automated evidence:

1. **Rule scans** on the key surfaces (landing/map, open reader, progress + settings dialogs, 3D mode + `SceneNodeList`): assert **no serious/critical violations**, with any accepted exceptions listed in the checklist. (Tooling is Fork A.)
2. **Task-completion journeys** — the stronger evidence for the gate: a **keyboard-only** journey to an ending (open → follow a branch → reach L4 → export), and a **list-navigable** journey that never touches the spatial graph or the WebGL canvas; plus **reduced-motion** and **forced-colours** (`page.emulateMedia({ forcedColors: 'active' })`) passes proving controls stay operable and visible.

The manual AT passes (§4) remain the real gate; automation raises the floor and keeps it there.

---

## 3. Automation plan (after confirmation)

A new `e2e/accessibility-audit.spec.ts` (rule scans + forced-colours) and an `e2e/accessibility-semantic-journey.spec.ts` (list-navigable, WebGL-free journey), plus small assertions folded into existing specs where cheaper. All run under the same throwaway sandbox-Chromium config used across Phase 7 (never committed) and in protected-main CI.

- **Rule scan** each surface in a clean state and assert zero serious/critical results. If Fork A picks axe, this uses `@axe-core/playwright` with a documented, minimal disabled-rule list (each with a reason in the checklist); if Fork A picks dependency-free, it is a curated set of structural assertions (landmarks, unique/lang/title, names for all controls, contrast spot-checks on the tokens).
- **Keyboard-only + list-navigable journey** to an ending, asserting no pointer events are needed.
- **Forced-colours + reduced-motion** operability assertions on the reader, map, and dialogs.

## 4. Manual AT protocol (owner/tester-run — never fabricated)

A protocol section in `docs/ACCESSIBILITY.md` (or a dedicated results doc) with:

- **Matrix:** NVDA + Firefox and NVDA + Chrome (Windows); VoiceOver + Safari (macOS) and VoiceOver + Safari (iOS); TalkBack + Chrome (Android). Plus forced-colours (Windows High Contrast), 200% zoom, and text-spacing bookmarklet.
- **Task scripts:** enter via each perspective; open and read a passage; follow a branch; reach an ending; open progress and export a save; start a new journey (guarded); recover from a corrupt save notice; navigate the map by keyboard **and** by the passage list.
- **A results table left empty for the owner to fill** (AT/browser/OS · task · pass/fail · notes · date). Findings are recorded here **only when actually run** — this proposal fabricates none.

## 5. Statement + release checklist

- **Public accessibility statement** — `docs/ACCESSIBILITY.md`: the conformance target (Fork C), the standards basis, what was tested (automated + the manual matrix once run), **known limitations** stated plainly (e.g. the 3D/WebGL view is a visual enhancement with a DOM/keyboard alternative; the map is a complex graph with a linear list alternative), and a **feedback channel** (the public repo issue tracker; any preferred contact is an owner placeholder — no personal contact invented). A discreet in-app link may point to it (Fork C). This is meta-documentation / interface chrome, **not** authored narrative prose — ADR 0002 safe.
- **Release accessibility checklist** — a WCAG-2.x-AA-mapped table (criterion → status → evidence: spec/file or manual-pass reference), with accepted exceptions and their rationale. Lives in the consolidation docs and is referenced from the statement.

## 6. Owner forks (open — confirm before code)

**A. Automated-scan tooling.** (1) **Add `@axe-core/playwright`** (dev-only) for real WCAG rule scans — industry standard, broad coverage (contrast/names/roles/ARIA); the trade-off is a new dev dependency and that it may surface pre-existing violations to triage as blockers. (2) **Dependency-free** curated structural + contrast assertions (no new dep; narrower coverage). _Recommendation: (1) axe_ — the coverage is worth one dev dependency, and surfacing latent violations now is the point of this batch.

**B. 2D map semantic alternative.** (1) **Add a linear passage-list companion to the 2D map** (reuse the `SceneNodeList` pattern via the 2D interaction adapter) so the default surface has a non-spatial, list-navigable path — parity with 3D and the strongest reading of "validate the graph's semantic alternative." (2) **Rely on the existing keyboard-navigable 2D graph** (arrow-key traversal + ARIA) as the alternative and only validate it. _Recommendation: (1) add the 2D list_ — a linear path is materially easier for SR users than spatial graph traversal, and it directly satisfies the gate.

**C. Conformance target + statement placement.** (1) **WCAG 2.1 AA**, statement as `docs/ACCESSIBILITY.md`

- a discreet footer link, feedback via the repo issue tracker. (2) **WCAG 2.2 AA** (adds e.g. focus-not- obscured, target-size, dragging-movements — most already met). (3) **Docs-only**, no in-app link. _Recommendation: (1) 2.1 AA + docs + footer link_ — a realistic, defensible target with an honest limitations list; 2.2 AA can be a Phase 8 stretch.

**D. Manual AT matrix breadth** (protocol only, not blocking). _Proposed:_ the full matrix in §4; the owner may trim to a core set (e.g. NVDA/Windows + VoiceOver/macOS + one mobile) — noted in the checklist as coverage scope.

---

## 7. Confirmed decisions

Owner-confirmed (all recommended options accepted):

- **A — Add `@axe-core/playwright`** (dev-only) for automated WCAG rule scans on the key surfaces; serious/critical violations fail the suite, with any accepted exception documented in the checklist.
- **B — Add a 2D linear passage-list alternative.** Reuse the `SceneNodeList` pattern via the 2D interaction adapter so the default map has a non-spatial, list-navigable path (parity with 3D).
- **C — WCAG 2.1 AA**, statement as `docs/ACCESSIBILITY.md` with a discreet in-app footer link; feedback via the public repo issue tracker; known limitations named plainly. 2.2 AA deferred to Phase 8.
- **D — Full manual AT matrix** (NVDA + Firefox/Chrome on Windows; VoiceOver + Safari on macOS + iOS; TalkBack + Chrome on Android; plus forced-colours, 200% zoom, text-spacing) — owner/tester-run, with an empty results table to fill; results recorded only when actually run.
