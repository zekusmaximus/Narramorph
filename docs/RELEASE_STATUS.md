# Release status

Updated: November 7, 2026

## Current state: alpha

Narramorph is an **alpha** product. The checked-in Eternal Return runtime story spans L1-L4, its three endings are reachable in automated Chromium journeys, the current content validators pass, and the alpha is publicly hosted at [narramorph.com](https://narramorph.com). Alpha does not mean production-ready: manual cross-browser, device, and assistive-technology QA and the owner-run release operations below remain open.

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
| Reader journey | 38 Playwright tests in 15 specs run on the pinned Chromium build in the required `Release / browser` job. They cover L1-L4, persistence, recovery, keyboard use, axe accessibility audits, reduced motion, responsive layout, text scaling, resilience, performance boundaries, the optional 3D view, and WebGL fallback. | Add the manual cross-browser, device, and assistive-technology evidence defined by the browser policy before beta. |
| Unit/component tests | 608 tests in 83 files pass. The `Quality / coverage` job enforces focused V8 coverage floors of 85% statements/lines, 75% branches, and 85% functions; measured coverage is 90.6% statements, 80.4% branches, 94.9% functions, and 90.7% lines. `storyStore.ts` is at 92.2% branches, driven through real story content from L1 to the endings, and `l3Assembly.ts` is fully covered. Until November 7, 2026 the floors sat under a Jest-style `global` key that Vitest ignores, so earlier runs did not enforce them. | The largest remaining gaps by uncovered branches are `variationLoader.ts` (63.5%), `conditionEvaluator.ts` (61.0%), and `contentLoader.ts` (61.5%). Raise floors as critical behavior gains tests. |
| Conversion tools | 160 tests, TypeScript, strict 288-file validation, and a malformed-package negative test pass from the independent lockfile in required CI. | Preserve these gates as tooling and schema behavior evolve. |
| Security | As of November 7, 2026, the `tools/` and `tools/conversion/` lockfiles report zero advisories. The root lockfile reports six moderate advisories, all in the `typescript-eslint` lint toolchain through `minimatch@10`; the patched `minimatch@11` is outside the range `typescript-eslint` 8.x accepts, and none of these packages ship in the bundle. Dependency review and full-history Gitleaks are required; GitHub secret scanning, push protection, private reporting, security updates, and scheduled grouped updates are configured. | Take the `typescript-eslint` release that accepts `minimatch@11` when it ships. Keep every high/critical advisory reviewed or remediated and repeat tracked/history scans at release gates. |
| Performance | `npm run bundle:check` enforces [`config/bundle-budgets.json`](../config/bundle-budgets.json) in the required `Release / content-build` job; on November 7, 2026 every budget passed (initial JS 635.21 KiB / 204.35 KiB gzip, largest story chunk 2,174.36 KiB / 306.26 KiB gzip, 0 public source maps). Story content and the 3D view load as separate lazy chunks. The [`config/performance-budgets.json`](../config/performance-budgets.json) LCP/CLS budgets passed on real Windows hardware on July 19, 2026 ([Phase 8 record](consolidation/PHASE_8_EXECUTION.md)). | Re-measure the performance budgets on real hardware after significant reader or bundle changes; do not raise a budget to pass. |
| Browsers | Playwright-pinned Chromium is the supported alpha target; JavaScript compiles to ES2020 and CSS uses the documented Browserslist policy. The `Compatibility / 3D proxy matrix` job exercises only the optional 3D view on pinned Chromium, Firefox, and WebKit engines in desktop and touch/mobile viewports; these are engine proxies, not branded-browser evidence. | Prove the [cross-browser/mobile matrix](BROWSER_SUPPORT.md) before beta. |
| Accessibility | Automated axe audits plus keyboard, focus, reduced-motion, responsive, and 200% text checks pass in Chromium. | Complete manual screen-reader, forced-colors, high-contrast, touch, and Apple-platform validation before release candidate. |
| Deployment/operations | Cloudflare Pages has served the alpha at **[narramorph.com](https://narramorph.com)** from `main` since July 19, 2026, with security headers and CSP from `public/_headers`. `npm run headers:check` passed 8/8 against production on November 7, 2026 under the current self-only script/worker policy; the external scanner grades (SecurityHeaders A+, Mozilla Observatory A+, SSL Labs A+) were recorded on July 19, 2026 ([SECURITY_HEADERS.md](SECURITY_HEADERS.md)). On November 7, 2026 hstspreload.org reported the domain as `preloaded`, and the production bundle carries a Sentry DSN, so opt-in redacted error reporting is live. In-repo release engineering is complete (Phase 8): client-only architecture ([ADR 0006](adr/0006-v1-client-only-no-backend.md)) behind the scope-gate guard, import sanitization, the [privacy policy](PRIVACY.md), versioning (app **0.1.1**), release manifests and checksums, caching/redirects/404, one-command rollback, a save-safety test, and the deploy runbook. | Owner-run, with no recorded result yet: enable PR-preview and protected staging environments, complete the alerting/ownership table and run the injected-error test in [OBSERVABILITY.md](OBSERVABILITY.md), and rehearse rollback ([RELEASE_ROLLBACK.md](RELEASE_ROLLBACK.md)). |
| Repository controls | Protected `main` requires a pull request, all seven stable product checks, conversation resolution, and linear history; force-pushes and deletion are blocked. | Add one required approval and stale-review dismissal when a second trusted maintainer joins. |

## Supported alpha development matrix

- Node.js 22.22.2+ or 24.15.0+ (`^22.22.2 || ^24.15.0`), the minimums of the locked dependencies (jsdom 30 for tests; Vite 7 needs 22.12 for builds). Node 18 and 20 are end-of-life.
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
