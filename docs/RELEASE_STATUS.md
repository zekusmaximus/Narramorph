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
| Reader journey | Nine Playwright Chromium journeys cover L1-L4, persistence, recovery, keyboard use, reduced motion, responsive layout, text scaling, and WebGL fallback. | Add the Phase 1 CI browser environment and later manual browser/device coverage. |
| Unit/component tests | 163 tests pass locally on the Phase 1 baseline. | Make coverage reproducible in clean-clone CI and enforce an evidence-based floor. |
| Conversion tools | 110 tests and strict validation pass from the independent lockfile. | Add required clean-clone CI and negative-package proof. |
| Security | GitHub secret scanning and push protection are enabled; the baseline tracked-file scan found no database URL or credential assignment. | Remediate/review dependency advisories, add dependency review/secret scanning workflows, a security policy, and automated updates. |
| Performance | Baseline build has an 11.29 MB minified main chunk (2.47 MB gzip) and public source maps. | Establish lazy boundaries, representative measurements, and enforced budgets in Batch 1.4. |
| Browsers | Playwright-pinned Chromium is the current automated target. | Prove the documented cross-browser/mobile matrix before beta. |
| Accessibility | Automated keyboard, focus, reduced-motion, responsive, and 200% text checks pass in Chromium. | Complete manual screen-reader, forced-colors, high-contrast, touch, and Apple-platform validation before release candidate. |
| Deployment/operations | Local static build only; no production deployment is declared. | Define preview/staging/production, monitoring, privacy, incident ownership, release artifacts, and rollback in later roadmap phases. |
| Repository controls | Phase 1 starts with unprotected `main` and one maintainer. | Stabilize required checks, then apply the strongest safe protection without requiring an impossible independent approval. |

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
