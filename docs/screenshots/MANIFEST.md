# Narramorph Fiction — UI screenshot package

- App: Narramorph Fiction (local Vite/React dev build, `npm run dev`)
- Commit: `7d6f318` (branch `main`)
- Captured: 2026-07-23, headless Chromium (Playwright), default motion settings (reduced motion OFF)
- Viewports: desktop 1440×900, mobile 390×844. All shots are full-viewport captures.
- Method note: captures were made against the dev server with a persistent browser profile. Storage was cleared once at the start; state then accumulated naturally through the session (fresh profile → perspective chosen → 12/18 passages opened).

## Flow discrepancies vs. the shot-list assumptions

1. **The intro/guide dialog appears on the very first load, over the opening picker** — not on first arrival at the map. `02b` therefore precedes `01` chronologically.
2. **Choosing a perspective does not land on the map** — it opens that perspective's opening passage (story view) immediately, and the passage is counted "opened" at that moment. A "map after choosing a perspective, before visiting anything" state does not exist. `02` shows the closest reachable state: the map immediately after closing that first auto-opened passage (1/18 opened, first-run revisit-hint toast visible).
3. **The opening picker is not a separate screen** — it is a header panel ("Begin with a perspective") rendered above the node map, which is already visible and interactive below it.
4. **Passage text varies per visit by design** ("the archive remembers"). The three theme shots (06/07/08) are the same node (`arch-L2-invest`) on successive visits; the rendered variation text differs between visits. Theme comparison is unaffected; text comparison is not meaningful.

## Files

| File | Screen / state | Viewport | Notes |
| --- | --- | --- | --- |
| 01-opening-picker-desktop.png | Opening experience / perspective picker (fresh profile, intro dismissed), 0/18 | 1440×900 | Picker is a header panel; map with 3 opening nodes visible below. Zoom controls at left overlap the map edge. Minimap bottom-right is nearly invisible (3 tiny dots). |
| 01-opening-picker-mobile.png | Same state | 390×844 | Perspective cards compress to 3 narrow columns; "TRANSMISSION 2047" wraps. Node labels clip at both screen edges. "Reset Flow" attribution badge overlaps footer. |
| 02-first-map-desktop.png | Map immediately after first passage auto-opened and was closed, 1/18 | 1440×900 | See discrepancy #2. First-run revisit-hint toast at bottom center. Newly surfaced branch labels ("Accepta…", "Resista…") truncate against each other. |
| 02b-intro-dialog-desktop.png | First-run intro dialog "How to read Narramorph" | 1440×900 | Auto-opens over the opening picker on first load (discrepancy #1). Identical dialog to Guide (11). |
| 03-map-default-desktop.png | Map at rest, 1/18 | 1440×900 | Unvisited sibling branch labels overlap/truncate ("Accepta / Resista / Investment Path"). |
| 03-map-default-mobile.png | Map at rest | 390×844 | "Passage list" pill floats over map; nodes and labels clip at viewport edges; left column node label half off-screen. |
| 04-map-node-hover-desktop.png | Node hover with tooltip (arch-L1 "First Documentation") | 1440×900 | Tooltip covers the hovered node's own label and overlaps the branch connector column below. Low-contrast body rows (dim gray on black). |
| 05-map-node-selected-desktop.png | Selected/active node state (arch-L1 after open→close) | 1440×900 | Distinct from hover: visit-count badge (2), diamond adaptation marker, stronger ring. Selection persists after closing the story view. |
| 06-story-night-desktop.png | Story view, Night theme, arch-L2-invest | 1440×900 | **Story header is collapsed to a ~28px band; title/meta/close button are clipped under the sticky "Passage progress" bar.** The header `<header>` lacks flex-shrink protection inside the flex-col dialog (StoryView.tsx / StoryHeader.tsx), so it collapses at this viewport. Mobile renders it correctly — desktop-only defect. |
| 06-story-night-mobile.png | Story view, Night theme | 390×844 | Full header renders correctly here: "Recovered passage / Investment Path / The Archaeologist · 5 min read · Visit #4", Meta-Aware chip. Reference for what the desktop header should show. |
| 07-story-paper-desktop.png | Story view, Paper theme, same node | 1440×900 | Same header-collapse defect. Paper (white) vs Archive (amber) surfaces are near-identical at a glance — candidate low-differentiation issue. |
| 08-story-archive-desktop.png | Story view, Archive theme, same node | 1440×900 | Same header-collapse defect. Rendered text identical to 07 (same visit variation); differs from 06 (earlier visit). |
| 09-story-footer-desktop.png | Story footer / navigation-onward controls (arch-L1, scrolled to end) | 1440×900 | "The archive branches" heading visible but its three continuation buttons are clipped at the bottom viewport edge (dialog taller than viewport). Top edge simultaneously shows "Recovered passage" header text bleeding behind the translucent progress bar. |
| 10-unlock-notification-desktop.png | Unlock notifications over map | 1440×900 | Three L3 "A passage surfaced — Convergence" toasts stacked bottom-right, overlapping right-column node labels; rightmost node label truncates behind the stack. Triggered after 12 visits spanning all three characters. |
| 11-dialog-guide-desktop.png | Guide dialog over map with progress | 1440×900 | Same content as 02b, opened from header. Backdrop dims map to near-black — map context barely legible. |
| 12-dialog-progress-desktop.png | Progress dialog, 12/18 opened, 9 paths | 1440×900 | Non-zero data: stat tiles + "The path you left behind" history list. |
| 13-dialog-settings-desktop.png | Settings dialog | 1440×900 | Text size (Compact/Comfortable/Large), reading surface Paper/Night/Archive (Archive selected), line spacing, Reduce motion, crash-reports toggle (clipped at bottom). |
| 14-shell-returning-desktop.png | Returning-reader shell, 12/18, 67% | 1440×900 | Header visited-count badge (12) on Progress; footer bar "12/18 passages · 67% opened". Densest normal map: label collisions across all three columns; L3 convergence row half cut by viewport bottom. |
| 14-shell-returning-mobile.png | Returning-reader shell | 390×844 | Badge (12) clips against header edge; map columns overflow horizontally; "Passage list" pill overlaps node labels; heavy label-on-label collisions. |
| 15-map-busy-desktop.png | Busiest reachable state: tooltip + 3 unlock toasts + full map | 1440×900 | Tooltip (First Documentation, "Returning", visits 2) open simultaneously with the three unlock toasts; toasts overlap right-column labels; center-column labels truncate. Captured live, not composited. |
| 16-notice-revisit-hint-desktop.png | Revisit-hint notice over returning map | 1440×900 | "The archive remembers. Reopen a passage you've read and it may have changed." toast, bottom center, over the 12/18 map. Shows once per profile (re-armed for capture by clearing its localStorage flag only). |

## Not captured

- **"Map after choosing a perspective with 0 visits" (original 02 spec)** — unreachable: perspective choice immediately opens and counts the opening passage (see discrepancy #2). Closest states provided: 01 (0/18, pre-choice) and 02 (1/18, immediately post-close).
- **Persistence/save-error notices (Save recovery / Save updated / Saving problem) and error-recovery dialog** — never triggered during the session; they require storage failure/corruption conditions that did not occur. The revisit-hint overlay (16) was the only ambient notice encountered.
- **Story-view "selected node visible on map behind open story"** — the story view's backdrop dims the map to near-black; not a usable state.

## Known capture caveats

- Desktop story-view shots (06/07/08) show the header-collapse defect rather than a full header; this is the app's real rendering at 1440×900 with default settings, not a capture artifact (verified in DOM: header element height 28px, title positioned outside it). Flag it in the design review rather than treating those shots as "missing the header".
- Reader theme was left on Archive after 08; dialog shots 11–13 and shell shots 14–16 were taken in that state (theme affects only the reading surface, not the shell).
