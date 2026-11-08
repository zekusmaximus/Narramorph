# Narramorph Fiction: Eternal Return of the Digital Self

Narramorph is an interactive literary reader about digital consciousness across three temporal perspectives: an Archaeologist in 2047, an Algorithm in 2151, and the Last Human in 2383. Reader choices, revisits, and perspective shifts change which authored passages appear before the journey converges on one of three philosophical endings.

**Release state:** [Alpha](docs/RELEASE_STATUS.md). The complete L1-L4 runtime story is checked in and passes the current content validators, and an alpha build is publicly hosted at [narramorph.com](https://narramorph.com). Public hosting is not a release declaration: manual cross-browser, device, and assistive-technology QA, the owner-run operations gates (preview/staging environments, rollback rehearsal, and the monitoring acceptance test), and dependency-advisory remediation are still open. Product readiness is not expressed as a story-completion percentage.

## What is included

- An 18-node story graph across four narrative layers.
- Three perspective openings and nine L2 philosophical branches.
- Path-sensitive L3 convergence selected from authored modular content.
- Three authored L4 endings: preserve, transform, and release.
- A "Why this version?" explanation of how each visited passage version was selected.
- A primary accessible 2D map and an optional experimental 3D view that loads only when requested.
- Local progress, reader preferences, revisits, keyboard navigation, reduced motion, and responsive reading surfaces.
- Bookmarkable passage URLs and local journey export (Markdown, print, or a machine-readable save file).

The verified technical baseline and current constraints live in [docs/STATUS.md](docs/STATUS.md). The strict content checks are the authority for runtime integrity:

```powershell
npm run content:validate:runtime
npm run content:validate
```

## Supported development environment

Narramorph supports the maintained Node.js LTS lines selected for the Phase 1 CI matrix:

- Node.js 22.22.2 or later on the 22 line, or 24.15.0 or later on the 24 line (`^22.22.2 || ^24.15.0`). These are the minimums of the locked test environment (jsdom 30); the production build alone needs only 22.12.
- npm `>=10 <12`
- Windows 10/11 with PowerShell 7, macOS, or Linux

Node 18 and Node 20 are end-of-life and are not supported for new development. Check your versions before installing:

```powershell
node --version
npm --version
```

## Clean Windows setup

From a new PowerShell session:

```powershell
git clone https://github.com/zekusmaximus/Narramorph.git
Set-Location Narramorph

# Install the application and the independent conversion-tool lockfiles.
npm ci
npm ci --prefix tools/conversion

# Validate the clean clone, then start the local reader.
npm run type-check
npm run content:validate:runtime
npm run content:validate
npm run dev
```

Open `http://localhost:5173`. No database, account, API key, or external service is required.

## Development commands

```powershell
npm run dev                       # Local Vite server
npm run build                     # TypeScript plus production build
npm run type-check                # TypeScript without emitting files
npm run lint:ci                   # CI lint policy
npm run format:check              # Prettier verification
npm run test:run                  # Unit and component tests (single run)
npm run test:coverage             # Unit tests with enforced V8 coverage floors
npm run test:e2e                  # Production build, then Playwright journeys in Chromium
npm run test:e2e:3d-proxy         # Production build, then the 3D view on engine proxies
npm run bundle:check              # Bundle budgets and no public source maps (run after build)
npm run scope:check               # Fails if first-party code adds a network call
npm run content:validate:runtime  # Runtime story-package integrity
npm run content:validate          # Strict authored-content validation
npm --prefix tools/conversion test # Conversion-tool tests
```

The browser suites need Playwright's pinned browsers. Install them once with `npx playwright install chromium`, or `npx playwright install chromium firefox webkit` for the 3D proxy matrix.

See [CONTRIBUTING.md](CONTRIBUTING.md) for code and pull-request conventions.

## Browser support

The required `Release / browser` GitHub Actions job runs the Playwright suite on the Playwright-pinned Chromium build; the same suite runs locally. It covers the complete L1-L4 reader journey, save and restore, recovery, keyboard focus, automated axe accessibility checks, reduced motion, WebGL fallback, 390×844 layout, reader text sizes, and 200% root text.

A separate required `Compatibility / 3D proxy matrix` job exercises only the optional 3D view on pinned Chromium, Firefox, and WebKit engines in desktop and touch/mobile viewports. These are engine proxies, not branded-browser evidence: Playwright WebKit is not Safari, and a touch viewport is not a physical phone.

Branded Firefox, Safari, iOS Safari, Android browsers, and manual screen-reader combinations remain release-QA targets, not supported alpha browsers. See the [browser support policy](docs/BROWSER_SUPPORT.md), the [3D view plan](docs/3D_VIEW_PLAN.md), and the [release gates](docs/RELEASE_STATUS.md).

The 3D view opens from the **Experimental 3D view** control on the map. It requires WebGL, downloads its code only when requested, and returns to the 2D map when WebGL is unavailable or the scene fails. It remains experimental and secondary to the accessible 2D experience.

## Deployment status

Pushes to `main` build and deploy to Cloudflare Pages, which serves the public alpha at [narramorph.com](https://narramorph.com). The deployment is static: security headers and the Content Security Policy come from [`public/_headers`](public/_headers), and there is no server-side component. Hosting the alpha does not make it a supported release. Enabling preview and protected staging environments, the rollback rehearsal, and the injected-error monitoring test are owner-run gates; none has a recorded result yet. See the [release and rollback runbook](docs/RELEASE_ROLLBACK.md) and [security headers checklist](docs/SECURITY_HEADERS.md).

## Data and privacy

Narramorph has no account system, backend, analytics, advertising, cookies, or externally hosted scripts or fonts ([ADR 0006](docs/adr/0006-v1-client-only-no-backend.md)), and `npm run scope:check` fails if first-party code adds a network call. Reading progress, the visit history, reader preferences, and small interface markers such as the optional 3D-view preference are stored in the browser's `localStorage` on the device and are not transmitted. Clearing site data removes them. Journey exports are downloads the reader starts.

The application's only outbound channel is opt-in crash reporting through the bundled Sentry SDK. It is off by default and inert in any build without `VITE_SENTRY_DSN`, so local development never sends reports. In a build with a DSN, a report is sent only after the reader turns on **Settings → Send anonymous crash reports** or chooses **Report this problem** on the error screen. Reports are redacted on the device, so story prose, journey history, saves, storage, and the passage URL are never included. See the [privacy policy](docs/PRIVACY.md) and [observability notes](docs/OBSERVABILITY.md).

Report suspected vulnerabilities through the private channel described in [SECURITY.md](SECURITY.md), not through a public issue.

## Repository layout

```text
Narramorph/
├── config/                                    # Bundle and performance budgets
├── docs/                                      # Product, architecture, and release records
├── e2e/                                       # Playwright reader, accessibility, performance, and 3D specs
├── literary-releases/                         # Allowlisted literary-release intake metadata
├── public/                                    # Edge headers/CSP, redirects, 404 page, self-hosted fonts
├── schemas/                                   # Story-package and concordance schemas
├── scripts/                                   # Budget, scope, header, release, rollback, and profiling scripts
├── story-packages/                            # Story Package Contract v1 sources, fixtures, and catalogs
├── src/
│   ├── components/                            # Reader, 2D map, optional 3D, and UI
│   ├── domain/                                # Testable story/progress/selection logic
│   ├── stores/                                # Zustand application coordination
│   └── data/stories/eternal-return/
│       ├── story.json                         # Story metadata and graph counts
│       ├── archaeologist.json                 # Perspective graph data (L1-L3)
│       ├── algorithm.json
│       ├── human.json
│       ├── terminals.json                     # L4 ending nodes
│       └── content/
│           ├── layer1/                        # L1 runtime packages
│           ├── layer2/                        # L2 runtime packages
│           ├── layer3/                        # L3 convergence packages
│           ├── layer4/                        # Three authored endings
│           ├── runtime-profile.json
│           └── selection-matrix.json
└── tools/conversion/                          # Independent conversion/validation package
```

## Documentation

- [Documentation index](docs/README.md)
- [Product overview](docs/PROJECT_OVERVIEW.md)
- [Verified status](docs/STATUS.md)
- [Release status](docs/RELEASE_STATUS.md)
- [Current technical roadmap](docs/ROADMAP.md)
- [Product consolidation roadmap](docs/eternal-return-product-consolidation-roadmap.md)
- [Data schema](docs/DATA_SCHEMA.md)
- [Narrative structure](docs/NARRATIVE_STRUCTURE.md)
- [Content ownership and regeneration](src/data/README.md)
- [Privacy policy](docs/PRIVACY.md)
- [Release and rollback runbook](docs/RELEASE_ROLLBACK.md)

## License

Narramorph uses separate terms for software and creative content:

- Software source code and technical tooling are available under the [MIT License](LICENSE).
- Narrative prose, expressive story data, character/world material, editorial material, generated literary content, and first-party media are **all rights reserved** under the [content license](CONTENT_LICENSE.md).

The MIT License does not grant permission to republish or create a separate derivative work from the reserved content. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and [docs/PROVENANCE.md](docs/PROVENANCE.md) for attribution and provenance.
