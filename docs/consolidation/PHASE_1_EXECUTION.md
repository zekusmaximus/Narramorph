# Phase 1 execution record

Updated: July 14, 2026

## Status

**In progress.** Phase 0 is complete. Phase 1 work is tracked in Narramorph issues [#99](https://github.com/zekusmaximus/Narramorph/issues/99), [#100](https://github.com/zekusmaximus/Narramorph/issues/100), [#101](https://github.com/zekusmaximus/Narramorph/issues/101), and [#102](https://github.com/zekusmaximus/Narramorph/issues/102), under epic [#93](https://github.com/zekusmaximus/Narramorph/issues/93).

| Batch | Status | Acceptance evidence / remaining gate |
| --- | --- | --- |
| 1.1 — Documentation and package metadata | Complete | PRs #103 and Eternal_Return_Manuscript#42 merged; supported-environment, live-count, UTF-8 regression, and post-merge `main` gates passed. |
| 1.2 — Release-quality CI and required checks | Complete | PRs #105 and Eternal_Return_Manuscript#43 merged; all current `main` checks passed and are protected. |
| 1.3 — Dependency and security stabilization | Not started | Audit path review, upgrades, security policy, automated updates, and final scans pending. |
| 1.4 — Performance budgets and lazy boundaries | Not started | Must begin after major dependency upgrades merge. |

Phase 1 is not complete until every batch gate is met, all implementation PRs are merged, current `main` checks are green and enforced, and the closure PR records final evidence.

## Scope and authority

- Narramorph is the only deployable product and the primary implementation target.
- Eternal_Return_Manuscript remains the canonical literary/editorial source. Phase 1 changes are limited to documentation, tooling, tests, workflows, and repository settings; canonical prose is unchanged.
- Project-Leibniz and eternal-return-digital-self remain frozen, public, unarchived references. No Phase 1 branch or commit has been created in either repository.
- The approved license model remains MIT for software/tooling and all-rights-reserved for literary/editorial/media content.

## Reproduction environment

Baseline captured July 14, 2026 on Microsoft Windows `10.0.26200`, PowerShell `7.6.3`, Git `2.53.0.windows.2`, GitHub CLI `2.87.3`, Node.js `22.18.0`, npm `11.16.0`, and Python `3.13.12`.

The repository baseline commits were:

| Repository                  | Baseline `main` commit                     |
| --------------------------- | ------------------------------------------ |
| Narramorph                  | `7a6c53df5219282038e989455bb541c67a00eb0d` |
| Eternal_Return_Manuscript   | `4189574bba9f2199e831cd4904d6b86deff6e635` |
| Project-Leibniz             | `4f3f4600b8782aac5000b45dd64378baf318e1df` |
| eternal-return-digital-self | `392eef6c6f87b8064c8cc51d91b6f029b0e32d5b` |

All four carried the immutable tag `pre-consolidation-2026-07-13` and were clean against `origin/main` before Phase 1 work.

## Live GitHub baseline

The connected GitHub app reported admin/push access for `zekusmaximus` in both active repositories. `zekusmaximus` was the only direct collaborator and sole admin.

| Setting | Narramorph | Eternal_Return_Manuscript |
| --- | --- | --- |
| Default branch | `main` | `main` |
| Branch protection / rulesets | None | None |
| Actions | Enabled; all actions allowed; SHA pinning not required | Same |
| Secret scanning | Enabled; zero open alerts | Enabled; zero open alerts |
| Secret push protection | Enabled | Enabled |
| Dependabot alerts/security updates | Disabled | Disabled |
| Code scanning | No analysis configured | No analysis configured |

The missing review requirement is not yet a variance because protection has not been applied. Before protection is enabled, required check names must be observed green. With only one maintainer, mandatory independent approval cannot be satisfied safely; the final settings record must document the strongest enforceable alternative and the path to add review when another trusted maintainer exists.

## Narramorph baseline

### Clean installation and validation

| Command | Result |
| --- | --- |
| `npm ci` | Passed; 690 packages installed. Audit summary: 22 advisories (1 low, 6 moderate, 13 high, 2 critical). |
| `npm ci --prefix tools/conversion` | Passed; 120 packages installed. Audit summary: 10 advisories (5 moderate, 4 high, 1 critical). |
| `npm run type-check` | Passed. |
| `npm run lint:ci` | Passed with 29 warnings and no errors; the workflow allows up to 120 warnings. |
| `npm run format:check` | Passed. |
| `npm test -- --run` | Passed: 37 files, 163 tests, Vitest `3.2.4`. |
| `npm run test:coverage -- --run` | Clean-clone failure: `@vitest/coverage-v8` is undeclared. A transient measurement reported 42.84% statements/lines, 71.36% branches, and 33.6% functions, but mixed Vitest patch versions made it provisional; Batch 1.2 must add a locked matching provider and derive the enforced focused floor from a clean run. |
| `npm run content:validate:runtime` | Passed: 7 tests. |
| `npm run content:validate` | Passed: 288/288 source files valid; no blocker, error, or warning. |
| `npm test` in `tools/conversion` | Passed: 11 files, 110 tests, Vitest `1.6.1`. Negative validation cases already exercise malformed frontmatter/IDs/counts inside unit fixtures. |
| `npm run build` | Passed with Vite `5.4.20`; 2,897 modules transformed. |
| `npm run test:e2e` | Passed: 9/9 Playwright `1.61.1` Chromium journeys. |

The clean test run warned that `baseline-browser-mapping` was more than two months old and `caniuse-lite` was ten months old.

### Baseline bundle composition

Production source maps were emitted publicly. Minified/gzip sizes from `npm run build`:

| Asset                           |             Minified |               Gzip |
| ------------------------------- | -------------------: | -----------------: |
| Main application chunk          |         11,286.91 kB |        2,468.30 kB |
| React vendor                    |            140.91 kB |           45.30 kB |
| React Flow vendor               |            173.20 kB |           56.69 kB |
| Animation vendor                |            115.61 kB |           38.32 kB |
| State vendor                    |             13.97 kB |            5.22 kB |
| L3 convergence aggregate        |          2,202.74 kB |          314.62 kB |
| Three perspective L3 aggregates | 1,506.91 kB combined | 240.46 kB combined |
| CSS                             |             65.51 kB |           12.05 kB |

This is the pre-optimization evidence only. Batch 1.4 will measure actual initial network requests, parse/evaluation, LCP, CLS, interaction responsiveness, and 2D-map responsiveness after Batch 1.3 lands.

### Baseline dependency/security findings

- Root critical findings were the development-only Vitest/UI advisory chain. High findings included direct TypeScript ESLint tooling and Vite plus transitive glob/minimatch, Rollup, WebSocket, form-data, flatted, and picomatch paths.
- Conversion critical findings were the old Vitest chain; high findings included direct `glob` and transitive minimatch/Rollup/Vite paths.
- This is an inventory, not a risk acceptance. Batch 1.3 must record dependency paths, runtime reachability, exploit preconditions, remediation, and any explicit owner/deadline before an advisory may remain.
- Tracked-path/content scan found only the intended `.env.example`; no tracked database URL or credential assignment matched. The database-URL history scan returned no Narramorph commit/file match. No values were printed.

## Eternal_Return_Manuscript baseline

| Command | Result |
| --- | --- |
| `python scripts/stats.py` | Passed: 28 canonical chapters, 85,114 counted words. |
| `python scripts/assemble.py` | Passed: 28 chapters, 85,138 assembled words; every chapter ending present. |
| `python scripts/edit_status.py` | Failed on Windows CP1252 when the next action contained Unicode `→`; roadmap state reached 15/15 before the crash. |
| `python scripts/continuity.py --stdout` compared with `bible/name-index.md` | Failed: tracked generated index differs from current deterministic output. No file was modified. |
| Movement Two voice/philosophy/genre/phrase validators | All 36 invocations exited zero; some returned documented warning states. |
| `python scripts/rhyme_tracker.py --sequence <M2 files>` | Exited zero with warning status. |
| Movement Three rhyme tracker | Phase A warned, Phase B passed, Phase C failed: 93.3% rhyme coverage but density 11.1/1,000 was below the validator's saturation rule. |
| Phase B alternation validator | Passed. |
| Phase C dissolution validator | Failed against the accepted canonical chapter; only `we_emergence` and required-phrase checks passed. Its `--pretty` path also crashed under CP1252 on a Unicode status glyph. |

The tracked-path/content and database-URL history scans found no sensitive filename, database URL, or credential assignment. No values were printed.

The Phase C validator failures are pre-existing tooling/configuration drift, not authorization to change canonical prose. Batch 1.2 must decide which validators are applicable release gates and update synthetic/tooling expectations without rewriting the manuscript.

## Batch 1.1 completion evidence

The Narramorph branch passed formatting, type checking, all 163 unit tests, seven runtime-content tests, strict validation of all 288 content documents, and all 110 conversion-tool tests. PR #103 and post-merge `main` [workflow run 29341477018](https://github.com/zekusmaximus/Narramorph/actions/runs/29341477018) for `893e15ada136677f79cf269bb90fbaf23fef09dc` completed successfully.

The manuscript branch reproduced 28 canonical chapters and 85,114 counted words, assembled 28 chapters and 85,138 words with every ending present, completed `edit_status.py` under Windows, and passed the UTF-8 subprocess regression while forcing CP1252 as the inherited console encoding. PR #42 passed its available GitGuardian check. No canonical manuscript prose changed.

## Batch 1.2 measured gates

Narramorph PR #105 defines these stable product checks: `PR / fast`, `Quality / coverage`, `Release / content-build`, `Release / browser`, `Compatibility / node-24`, `Security / dependency-review`, and `Security / secret-scan`. The Playwright job installs the Chromium revision locked by `@playwright/test` and retains failure-only traces, screenshots, and video for five days. Coverage and bundle reports are retained for seven days.

Focused V8 coverage over domain logic, the progress repository/story store, content/variation validators, and critical map/reader presentation boundaries measured 64.65% statements/lines, 73.85% branches, and 28.72% functions after the synthetic malformed-package test was added. Enforced regression floors are 60%, 70%, and 25% respectively.

The production baseline at `7a6c53df5219282038e989455bb541c67a00eb0d` measured 15,458,162 raw / 3,159,421 gzip JavaScript bytes, an 11,301,850 raw / 2,462,315 gzip largest JavaScript asset, and 65,512 raw / 11,958 gzip CSS bytes. `config/bundle-budgets.json` records approximately 5% headroom for each metric and `npm run bundle:check` emits both JSON and Markdown evidence.

Manuscript PR #43 defines `Manuscript / linux` and `Manuscript / windows-utf8`. Both run the four unit/regression tests plus stats, assembly and ending verification, deterministic continuity checking, UTF-8 status, every Movement Two voice/philosophy/genre/phrase/rhyme check, the Movement Two rhyme sequence, and the applicable Movement Three rhyme/alternation/dissolution checks. The deliberately truncated synthetic ending is detected as a missing ending. Canonical prose remains unchanged.

The dependency-review action initially failed because the repository dependency graph was disabled. Vulnerability alerts were enabled, the generated SBOM endpoint became available, and dependency review then passed without weakening its high-severity policy. A pre-existing 200%-zoom Playwright predicate also timed out under Linux CI load even though the diagnostic screenshot showed the map rendered; the test now asserts the visible node plus the subsequent keyboard activation outcome. That focused path passed three consecutive local runs before the complete PR and `main` browser jobs passed.

Post-merge `main` runs [29343882911](https://github.com/zekusmaximus/Narramorph/actions/runs/29343882911) and [29343182872](https://github.com/zekusmaximus/Eternal_Return_Manuscript/actions/runs/29343182872) completed successfully. Narramorph `main` strictly requires all seven recorded product checks; Manuscript `main` strictly requires both manuscript checks. Both branches require PRs, conversation resolution, and linear history and block force-pushes and deletion.

`zekusmaximus` remains the sole collaborator/admin, so independent approval is not satisfiable. Required approval count is therefore zero and admin enforcement is disabled as the documented emergency bypass; all non-admin changes remain subject to PRs and required checks. Add one required approval and enable stale-review dismissal when a second trusted maintainer joins.

## Delivery record

| Batch | Repository | Branch | Pull request | Merge commit |
| --- | --- | --- | --- | --- |
| 1.1 | Narramorph | `agent/phase-1-batch-1-1` | [#103](https://github.com/zekusmaximus/Narramorph/pull/103) | `893e15ada136677f79cf269bb90fbaf23fef09dc` |
| 1.1 | Eternal_Return_Manuscript | `agent/phase-1-batch-1-1` | [#42](https://github.com/zekusmaximus/Eternal_Return_Manuscript/pull/42) | `161dc64b472cf157b2c7ecf85f150961e6d4828d` |
| 1.2 | Narramorph | `agent/phase-1-batch-1-2` | [#105](https://github.com/zekusmaximus/Narramorph/pull/105) | `97b31036c6d09c03d0d6363cd5c0fa292bcffd42` |
| 1.2 | Eternal_Return_Manuscript | `agent/phase-1-batch-1-2` | [#43](https://github.com/zekusmaximus/Eternal_Return_Manuscript/pull/43) | `23797d3d918ec4d859e1fe21ee258351d3d61e51` |

Later batch branches, PRs, required-check names, merge commits, protection settings, performance measurements, budgets, accepted risks, and owner-approved variances will be appended as they become reproducible facts.
