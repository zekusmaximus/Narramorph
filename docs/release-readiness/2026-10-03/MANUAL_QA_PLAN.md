# Manual release QA and accessibility evidence

Owner roles: QA/accessibility lead, product/editorial owner, release maintainer. Priority: P1 before support expansion or release promotion. Estimate: 2–4 tester-days plus fixes and device access. Findings: R06/R12; existing #165/#168/#175/#178.

## QA-01 — Define the candidate and platform matrix

Test the immutable candidate deployed by REL-02. Record SHA/archive digest, app/package/literary/schema identities, environment URL, OS/browser/assistive-technology versions, physical device where relevant, tester, and date. “Not run” is neither a pass nor a supported-platform claim. Current Chromium alpha support and optional 3D proxies remain the baseline until this evidence exists.

| Platform | Required manual coverage |
| --- | --- |
| Windows Chrome and Firefox + NVDA | Keyboard reader/map/list, dialog/focus, announcements, recovery/import/export; at least one complete ending with NVDA in each browser |
| macOS Safari + VoiceOver | Same core controls, long-passage reading, one complete ending, save/reload and downloads |
| iPhone Safari + VoiceOver | Touch exploration, rotor/headings, gestures, orientation, long text, recovery/import/export and one ending |
| Mid-range Android Chrome + TalkBack | Equivalent touch/screen-reader journey, background/resume, physical memory/network behavior |
| Windows Edge or Chrome, forced colors | All reader/map/settings/recovery states, selected/locked/focus distinctions, icon/control visibility |
| Primary desktop engines, keyboard only | All three ending routes, exact exports, convergence sections, browser history and restart |

Across representative desktop and mobile rows, include default/dark/sepia themes, reduced motion, 200% zoom, narrow reflow, large text/text-spacing overrides, and portrait/landscape. Pairwise coverage is appropriate for cosmetic combinations; do not skip critical navigation/save/recovery controls on any proposed supported platform.

## QA-02 — Execute concrete functional and persistence cases

| Case | Procedure | Pass condition |
| --- | --- | --- |
| QA-F01 First entry | Fresh storage, first-time onboarding, choose perspective, open/read/close first passage | Clear starting path; dismiss/revisit introduction works; no external assistance required to begin |
| QA-F02 Reading | Long L2/L3 passage; scroll, change typography/theme, leave and reopen; use back/forward | Readable text, sensible restored position, no stale passage or trapped focus |
| QA-F03 Map and list | Navigate keyboard/touch/list, inspect locked/available/visited states, revisit a node | Equivalent access and understandable unlock explanation; visual position is not the only control |
| QA-F04 Endings | Use the three deterministic routes below and read every convergence section | Correct ending and stable assembled text after reload; no navigation dead end |
| QA-F05 Persistence | Save/reload/reopen, new journey, storage-disabled/quota scenario, corrupt/unsupported saved JSON | Accurate status and recovery choices; original data retained until explicit reset/replacement |
| QA-F06 Import/export | Valid synthetic save, wrong schema/package, malformed JSON, dangerous/oversized input | Safe validation and recovery; no executable input or unintended overwrite |
| QA-F07 Exact journey | Export after revisits/ending; compare sequence and selected passage text byte-for-byte with expected fixture | Recorded journey is reproduced exactly; mobile download/print works where advertised |
| QA-F08 Background/offline | Background a physical device for 20 minutes, resume, interrupt network after loaded passage, request uncached passage | No duplicated visit/lost saved progress; cached reading works and unavailable content has a recoverable explanation |
| QA-F09 Optional 3D | Toggle on/off repeatedly; keyboard/list fallback, WebGL blocked/context loss, reduced motion | Required 2D reading stays usable; no frozen controls, permanent spinner, or runaway background animation |
| QA-F10 Monitoring | Configured test DSN: off→on→off, sample disclosure, injected error, network inspection | OBS-01/02 consent and data boundary holds; reporting failure cannot block reading |
| QA-F11 Deployment transition | Keep old tab open through B deployment and rollback; open previously uncached passages | REL-03 asset/recovery contract holds and persisted progress survives |

Use explicit fixtures/local development controls for quota/corruption/GPU failures; never damage a real reader's saved journey. Record what the operating system actually suspended in QA-F08 rather than treating a scripted visibility event as that evidence.

### Repeatable ending routes

The existing `e2e/phase-3-path-coverage.spec.ts` provides a reproducible route rather than requiring random exploration:

1. Visit and close `arch-L1`, `algo-L1`, and `hum-L1`.
2. For each character, visit L2 for the target philosophy and its alternate; that gives six distinct L2 visits. Revisit each target L2.
3. Revisit `arch-L1` twice and `algo-L1` twice; dismiss the coalesced unlock notice if shown.
4. Open `arch-L3` / “The Convergence,” advance through sections 2–4 and complete convergence, then open the expected ending.
5. Capture the journey/export and reload; verify the same state/text remains.

| Target / alternate  | Expected ending       |
| ------------------- | --------------------- |
| `accept` / `resist` | Preserve the Pattern  |
| `invest` / `accept` | Transform the Pattern |
| `resist` / `invest` | Release the Pattern   |

## QA-03 — Record accessibility and editorial acceptance

Manually verify logical heading/landmark order, accessible names/state, live announcements, focus entry/return, visible keyboard focus, escape/dismissal, modal containment, no keyboard traps, reading order, semantic list parity, touch targets, contrast, reflow, and text spacing against the repository's WCAG 2.1 AA target. Automated axe results remain useful but cannot replace these cases. Amend `ACCESSIBILITY.md` claims such as full screen-reader operability to reflect actual results and known limitations.

Run a small formative onboarding session with approximately five first-time readers, including mobile and an accessibility participant if available. Record whether they can start, understand revisit/unlock signals, and recover their place without coaching. Treat this as usability evidence for #165, not a statistically representative success rate.

Freeze editorial identity before testing. Review ending presentation, bridge beats, voice transitions, and exact-export fidelity against the accepted release; do not revise canonical prose as incidental QA cleanup. Current strict canon validation has 0 errors, 6,116 warnings, 31 waivers, and no expired waiver. Review warning categories and representative samples for a current disposition, not an automatic mass rewrite.

The remaining open contradiction is **CTR-004, severity 3**, a stale “Movement 3 Phase D” reference in `Eternal_Return_Manuscript`. Route correction to its manuscript owner. Narramorph must continue applying Phase C onward; do not mark the external fix landed here. CTR-010/012 are already resolved in the accepted release. Attach existing acceptance plus a dated editorial decision on residual warnings/waivers and cross-repository debt.

## QA-04 — Make sign-off reviewable

Create a results record with one row per case/platform: test ID, environment/candidate identity, expected/actual result, pass/fail/not-run, evidence link, severity, issue/fix reference, retest result, and tester. Screenshots/video should avoid real imported journeys or personal data. Accessibility failures should identify the affected interaction and success criterion.

Proposed release decision policy: unresolved data loss, sensitive transmission, inaccessible core reading, incorrect ending, or unrecoverable navigation is a blocker. Lesser defects require a named owner, impact, workaround, target date, and explicit disposition under existing release policy; no untested combination can be marked passed. Re-run affected cases against the final artifact after a fix.

Beta/RC/GA approval must name the product/editorial, technical, accessibility, security/privacy, and operations decision makers required by the existing gates. Include support contact, known issues, tested support matrix, rollback target, and release notes. Do not populate the results table before execution; this document is the plan, not a fabricated sign-off.
