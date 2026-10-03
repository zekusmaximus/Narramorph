# Dependency remediation and update operations

Owner role: technical/security maintainer. Priority: P1. Estimate: 2–4 engineering days for compatible repairs and audit enforcement; add 4–6 if a major styling/tooling migration is necessary. Findings: R02, R08, R11. Related existing work: Phase 1 dependency stabilization and open Dependabot PRs.

## Current inventory

Full lockfile audits on October 3, 2026:

| Lockfile                             | High | Moderate | Low | Total vulnerable-package entries |
| ------------------------------------ | ---: | -------: | --: | -------------------------------: |
| `package-lock.json`                  |    9 |        5 |   1 |                               15 |
| `tools/conversion/package-lock.json` |    2 |        3 |   0 |                                5 |
| `tools/package-lock.json`            |    1 |        0 |   0 |                                1 |

All report zero critical entries. The root `--omit=dev` audit still reports 7 high, 1 moderate, and 1 low; the conversion production audit reports 1 high. This does **not** mean those vulnerabilities are all shipped JavaScript: Tailwind is declared as a production dependency although it is a build tool, and transitive modules may be tree-shaken. Establish reachability before assigning impact.

| Chain / current locked version | Exposure to investigate | Concrete repair |
| --- | --- | --- |
| `brace-expansion` 1.1.16, 2.1.2, 5.0.8 across root; 5.0.8 in conversion | ESLint/glob/minimatch and build/conversion pattern expansion | Resolve each installed major to a currently patched version. This audit requires at least **1.1.21 / 2.1.7 / 5.0.12** for those majors; validate every nested copy. |
| `braces` 3.0.3 through micromatch/chokidar/fast-glob/Tailwind/lint-staged | Build, watch, and hook pattern inputs; no browser exploit inferred | The current advisory has no published patch. Remove/replace affected chains or execute a reviewed migration; if retained, use an explicitly approved, expiring build-only exception with demonstrated reachability constraints. |
| `js-yaml` 4.3.0 in root tooling and legacy tools | Tooling parsing of YAML from repository/work inputs | Update to at least **4.3.2**, including the root transitive copy. |
| Root Vitest/UI/coverage/mocker 4.1.10; conversion Vitest 3.2.7 | Development-server/mock exposure; current tests run locally rather than as a public service | Root: upgrade all Vitest companion packages together to a patched matched release, at least 4.1.11. Conversion: migrate to a patched supported release, preferably the same 4.x line; revalidate its tests/config. |
| `nanoid` 3.3.16 in root/conversion; conversion PostCSS 8.5.19; selector parser 6.1.2 | Build/conversion dependency chains | Resolve compatible patched releases: nanoid at least 3.3.18, PostCSS at least 8.5.23, and selector parser at least 6.1.3; re-audit. |
| `fflate` 0.8.2 and 0.6.10 through 3D dependencies | Verify whether archive readers survive in shipped 3D code and whether any untrusted archive can reach them | Update within compatible lines to at least 0.8.3 and 0.6.11, respectively, then exercise the 3D matrix. |

The floors are a dated audit snapshot, not a promise that no future advisory affects them. Recheck at implementation and release time. Sources: [brace-expansion maintainer advisory](https://github.com/juliangruber/brace-expansion/security/advisories/GHSA-q2hr-2g5m-vwhr), [js-yaml maintainer advisory](https://github.com/nodeca/js-yaml/security/advisories/GHSA-2883-xcg3-v3hh), [Vitest maintainer advisory](https://github.com/vitest-dev/vitest/security/advisories/GHSA-82fw-gwwq-j7x9), and the [braces upstream report](https://github.com/micromatch/braces/issues/70). Remaining advisory identifiers and paths are retained in [REVIEW_EVIDENCE.json](REVIEW_EVIDENCE.json).

## DEP-01 — Establish a current risk register

For every distinct advisory, record affected locked paths, dependency parent, browser/build/dev/conversion reachability, exploit preconditions, remediation, validation, and disposition. Use `npm explain`, the lockfile, source imports, and the built manifest. A declared `dependencies` entry alone is insufficient.

Classify the final archive and first-party input surfaces: save import accepts JSON, not ZIP/glob/YAML; story inputs are governed repository artifacts; 3D loader reachability still needs an emitted-code check. Dev-server advisories require exposure analysis separate from public static hosting.

Approved exceptions must identify one GHSA plus affected package/version/path, impact evidence, controls, accountable owner, resolution action, and expiry. Proposed ceiling: 14 days for a retained high-severity build-only finding. Reject runtime high/critical exposure and reject automatic extensions. This plan creates no exception approval. Publish a concise security register without credentials or unnecessary environment details.

## DEP-02 — Remediate compatible chains first

1. Rebase/re-evaluate existing patch PRs before writing duplicates. The root updater [run 36426830366](https://github.com/zekusmaximus/Narramorph/actions/runs/36426830366) failed and closed its brace-expansion update as no longer possible; its failure is not an accepted risk disposition.
2. Refresh safe patch resolutions for brace-expansion, js-yaml, nanoid, fflate, PostCSS, and selector parser. Prefer parent-package compatible updates; use narrowly scoped, tested overrides only when necessary. Do not override all installed majors to one incompatible major.
3. Upgrade matched Vitest packages and migrate the conversion configuration in a dedicated PR. Correct coverage enforcement first so the upgrade cannot hide another enforcement regression.
4. Compare complete story/package/concordance/literary identities before and after. Dependency changes must not regenerate prose or alter the frozen package hash.
5. Require clean installs on Node 22 and 24, all application/conversion/content gates, configured and unconfigured monitoring builds, bundle checks, and Chromium/3D proxies. Use behavioral regression checks for changed UI/build dependencies.

Acceptance: each patched path is absent from fresh audit findings; no critical/high entry remains without a permitted, unexpired risk disposition; all release identities and required checks hold.

## DEP-03 — Resolve the unpatched build-tool chain deliberately

Investigate removing the vulnerable braces chain through parent upgrades, including the open Tailwind migration. If Tailwind 4 is the chosen repair, migrate the PostCSS integration, theme tokens, utility generation, responsive/text spacing/forced-colors behavior, fonts, and all three reader themes together. Confirm CSS budgets and visual/manual accessibility results. A major version bump by itself is not a completed migration.

Review lint-staged separately; removing the Tailwind chain does not remove a hook's micromatch chain. Keep hooks optional convenience rather than a substitute for CI. Do not use `npm audit fix --force` as the remediation strategy.

## DEP-04 — Repair maintenance contracts

- Narrow both active engine ranges to supported Node 22/24 releases satisfying the locked Vite minimum: at least **22.12** on the 22 line, excluding Node 23. Re-evaluate the floor if another selected dependency requires a later patch. Pin the release builder to a precise patch; update it deliberately.
- Move Tailwind to development dependencies if source/build inspection confirms that it is exclusively a build tool. This clarifies classification; it does not remediate the advisory.
- The legacy `tools` manifest references absent inventory/insert executables. Keep no promise of a runnable supported package. Recommended disposition: retain it as documented historical tooling after patching its lockfile, remove broken advertised scripts, and state that `tools/conversion` is the supported pipeline. Do not silently delete useful source or dependency history.
- Add all-lockfile scheduled auditing and review ownership. Scheduled update jobs are useful only when someone triages failures and merges valid patches.

## Existing PR disposition

| PR | Recommended handling |
| --- | --- |
| #223 js-yaml 4.3.2 / legacy tools | Rebase, verify, and use for the current patch. |
| #222 js-yaml 4.3.1 / legacy tools | Superseded by #223 and still below the second advisory's patch; close only after replacement lands. |
| #219 brace-expansion 5.0.9 / conversion | Insufficient for current advisories. Refresh to at least 5.0.12; do not merge based on its older green result. |
| #221 tsx; #224 yaml | Rebase and verify as compatible tool patches; preserve content identity. |
| #217 Tailwind 4 | Treat as the deliberate migration above, with visual/CSS/QA evidence. |
| #213 jsdom; #214 eslint-config-prettier; #215 cross-env; #216 framer-motion | Dedicated compatibility decisions, not an automatic mass upgrade. Record adoption or deferred rationale and owner. |

These are recommendations. This review does not merge, close, or approve any dependency PR.
