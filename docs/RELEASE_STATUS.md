# Release status

Updated: July 14, 2026

## Current state: alpha

Narramorph is an **alpha** product. The checked-in Eternal Return runtime story spans L1-L4, its three endings are reachable in automated Chromium journeys, and the current content validators pass. Alpha does not mean production-ready: Phase 1 stability work and later release operations remain open.

Product readiness is based on release gates, not a percentage of authored story variations.

## Readiness definitions

| State | Meaning for Narramorph |
| --- | --- |
| Alpha | Core reader and content are usable; architecture, security, performance, and release controls may still change. Testing is primarily automated and maintainer-driven. |
| Beta | Phase 1 stability gates are complete; supported browser/device and accessibility testing is documented; staging operations exist; no known blocker or critical runtime defect is open. |
| Release candidate | Feature and content scope are frozen; production-like deployment, monitoring, privacy, rollback, editorial acceptance, and full release QA have passed. |
| General availability | A signed/tagged release has explicit product, editorial, technical, accessibility, security, and operations approval and is deployed with support ownership. |

## Current gate evidence

| Area | Current evidence | State / next gate |
| --- | --- | --- |
| Runtime content | Strict conversion validation passes for 288 authored source files; runtime validation covers graph/layer counts, IDs, deterministic ordering, L3/L4 aggregates, and selection references. | Alpha evidence present. |
| Reader journey | Nine Playwright Chromium journeys cover L1-L4, persistence, recovery, keyboard use, reduced motion, responsive layout, text scaling, and WebGL fallback in required CI. | Add the manual cross-browser, device, and assistive-technology evidence defined by the browser policy before beta. |
| Unit/component tests | 164 tests pass in clean CI; focused V8 coverage floors are 60% statements/lines, 70% branches, and 25% functions. | Raise evidence-based floors as critical behavior gains tests. |
| Conversion tools | 110 tests, TypeScript, strict 288-file validation, and a malformed-package negative test pass from the independent lockfile in required CI. | Preserve these gates as tooling and schema behavior evolve. |
| Security | Both npm lockfiles report zero advisories. Dependency review and full-history Gitleaks are required; GitHub secret scanning, push protection, private reporting, security updates, and scheduled grouped updates are configured. | Keep every high/critical advisory reviewed or remediated and repeat tracked/history scans at release gates. |
| Performance | Baseline build has an 11.29 MB minified main chunk (2.47 MB gzip) and public source maps. | Establish lazy boundaries, representative measurements, and enforced budgets in Batch 1.4. |
| Browsers | Playwright-pinned Chromium is the supported alpha target; JavaScript compiles to ES2020 and CSS uses the documented Browserslist policy. | Prove the [cross-browser/mobile matrix](BROWSER_SUPPORT.md) before beta. |
| Accessibility | Automated keyboard, focus, reduced-motion, responsive, and 200% text checks pass in Chromium. | Complete manual screen-reader, forced-colors, high-contrast, touch, and Apple-platform validation before release candidate. |
| Deployment/operations | Local static build only; no production deployment is declared. | Define preview/staging/production, monitoring, privacy, incident ownership, release artifacts, and rollback in later roadmap phases. |
| Repository controls | Protected `main` requires a pull request, all seven stable product checks, conversation resolution, and linear history; force-pushes and deletion are blocked. | Add one required approval and stale-review dismissal when a second trusted maintainer joins. |

## Supported alpha development matrix

- Node.js 22 or 24 (`>=22 <25`); Node 18 and 20 are end-of-life.
- npm 10 or 11 (`>=10 <12`).
- Clean installation from both `package-lock.json` files.
- Automated reader browser: the Chromium revision pinned by Playwright.

The Node policy follows the maintained LTS lines in the [official Node.js release schedule](https://nodejs.org/en/about/previous-releases).

## Promotion rule

The release state changes only through a reviewed pull request that:

1. links reproducible evidence for every gate above;
2. records any owner-approved variance with an owner and resolution deadline;
3. updates the canonical roadmap and the applicable consolidation execution record; and
4. is green on the required checks of the then-current `main` branch.
