# Browser support policy

Updated: November 7, 2026

Narramorph is an unreleased alpha. A compatibility target describes what the build tool transforms; it is not a claim that every matching browser has been tested or is supported.

## Required automated browser gate

The only supported alpha browser environment is the Chromium revision pinned by `@playwright/test` and installed by the required `Release / browser` GitHub Actions job on Ubuntu. The same suite (38 tests in 15 specs as of November 7, 2026) can be reproduced locally on supported development platforms with `npm run test:e2e` after `npx playwright install chromium`.

The gate covers the L1–L4 reader journey, save and restore, recovery, keyboard focus, axe accessibility audits, reduced motion, WebGL fallback, a 390×844 viewport, reader text sizes, 200% root text, horizontal overflow, resilience, and performance boundaries. A Chromium-only pass is not cross-browser evidence.

## Optional 3D view: engine proxy matrix

The `Compatibility / 3D proxy matrix` job (`npm run test:e2e:3d-proxy`, configured in `playwright.3d.config.ts`), a required check on `main` since November 8, 2026, exercises only the optional 3D view on Playwright-pinned engines: Chromium, Firefox, and WebKit at 1280×800, plus touch-enabled Chromium and WebKit at 390×844. Each project must either complete the 3D journey or return cleanly to the usable 2D map, and the two outcomes are recorded separately.

These are engine proxies. Playwright WebKit is not Safari, a touch viewport is not a physical phone, and headless software WebGL says nothing about real GPU drivers. A proxy pass does not make any of those browsers a supported alpha environment for the reader; see the [3D view plan](3D_VIEW_PLAN.md) for the hardware caveats.

## Build compatibility targets

- JavaScript is compiled to the repository's explicit Vite `es2020` target.
- CSS compatibility data uses Browserslist production targets of `>0.5%`, the latest two versions, Firefox ESR, and browsers that are not dead.
- Local development CSS targets the latest Chrome version.
- `caniuse-lite` and Baseline mapping data were refreshed on July 14, 2026.

These targets do not include legacy browsers and do not override the tested-support statement above.

## Release-QA targets

Chrome, Edge, Firefox, Safari/WebKit, iOS Safari, Android Chrome, touch input, and manual screen-reader combinations remain release-QA targets rather than supported alpha environments. Before beta, record the browser and operating-system versions, device or emulation profile, date, tester, and result for the agreed matrix. A blocker in the primary reader journey, persistence, keyboard access, responsive reading, or recovery prevents promotion.

Review this policy with each Vite major upgrade and at least quarterly. Scheduled Dependabot pull requests refresh dependency and compatibility data; every update must pass the required CI matrix before merge.
