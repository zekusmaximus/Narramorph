# Narramorph Fiction: Eternal Return of the Digital Self

Narramorph is an interactive literary reader about digital consciousness across three temporal perspectives: an Archaeologist in 2047, an Algorithm in 2151, and the Last Human in 2383. Reader choices, revisits, and perspective shifts change which authored passages appear before the journey converges on one of three philosophical endings.

**Release state:** [Alpha](docs/RELEASE_STATUS.md). The complete L1-L4 runtime story is checked in and passes the current content validators, but release-quality CI, dependency remediation, performance budgets, deployment operations, and manual release QA are still in progress. Product readiness is not expressed as a story-completion percentage.

## What is included

- An 18-node story graph across four narrative layers.
- Three perspective openings and nine L2 philosophical branches.
- Path-sensitive L3 convergence selected from authored modular content.
- Three authored L4 endings: preserve, transform, and release.
- A primary accessible 2D map and an optional experimental 3D view.
- Local progress, reader preferences, revisits, keyboard navigation, reduced motion, and responsive reading surfaces.

The verified technical baseline and current constraints live in [docs/STATUS.md](docs/STATUS.md). The strict content checks are the authority for runtime integrity:

```powershell
npm run content:validate:runtime
npm run content:validate
```

## Supported development environment

Narramorph supports the maintained Node.js LTS lines selected for the Phase 1 CI matrix:

- Node.js `>=22 <25` (Node 22 or Node 24)
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
npm test -- --run                 # Unit and component tests
npm run test:coverage -- --run    # Coverage (Phase 1 CI dependency pending)
npm run test:e2e                  # Playwright reader journeys
npm run content:validate:runtime  # Runtime story-package integrity
npm run content:validate          # Strict authored-content validation
npm --prefix tools/conversion test # Conversion-tool tests
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for code and pull-request conventions.

## Browser support

The current automated browser gate uses the Playwright-pinned Chromium build locally and in GitHub Actions. The suite covers the complete reader journey, keyboard focus, reduced motion, WebGL fallback, 390×844 layout, and 200% root text.

Firefox, Safari/WebKit, iOS Safari, Android browsers, and manual screen-reader combinations are release-QA targets, not yet claimed as supported alpha browsers. See the [browser support policy](docs/BROWSER_SUPPORT.md) and [release gates](docs/RELEASE_STATUS.md).

## Deployment status

There is no production deployment or supported public service yet. Narramorph currently runs as a local static client application. Preview, staging, production, monitoring, and rollback operations are later roadmap gates; passing a local build does not imply a deployed release.

## Data and privacy

The alpha application has no account system, backend, analytics, advertising, or telemetry integration. Reading progress, reader preferences, and the optional 3D-mode preference are stored in the browser's `localStorage` on the device. They are not transmitted by the application. Clearing site data removes them.

The optional `.env.local` setting below is a local build-time feature flag; it must not contain credentials:

```powershell
Set-Content -Path .env.local -Value 'VITE_ENABLE_3D=true'
npm run dev
```

Report suspected vulnerabilities through the private channel described in [SECURITY.md](SECURITY.md), not through a public issue.

The 3D view requires WebGL and falls back to the 2D reader when WebGL is unavailable. It remains experimental and secondary to the accessible 2D experience.

## Repository layout

```text
Narramorph/
├── docs/                                      # Product, architecture, and release records
├── e2e/                                       # Playwright reader journeys
├── src/
│   ├── components/                            # Reader, 2D map, optional 3D, and UI
│   ├── domain/                                # Testable story/progress/selection logic
│   ├── stores/                                # Zustand application coordination
│   └── data/stories/eternal-return/
│       ├── story.json                         # Story metadata and graph counts
│       ├── archaeologist.json                 # Perspective graph data
│       ├── algorithm.json
│       ├── human.json
│       ├── terminals.json                     # L3/L4 graph nodes
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

## License

Narramorph uses separate terms for software and creative content:

- Software source code and technical tooling are available under the [MIT License](LICENSE).
- Narrative prose, expressive story data, character/world material, editorial material, generated literary content, and first-party media are **all rights reserved** under the [content license](CONTENT_LICENSE.md).

The MIT License does not grant permission to republish or create a separate derivative work from the reserved content. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and [docs/PROVENANCE.md](docs/PROVENANCE.md) for attribution and provenance.
