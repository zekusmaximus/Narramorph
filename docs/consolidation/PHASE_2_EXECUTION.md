# Phase 2 execution record

Updated: July 14, 2026

## Status

**In progress.** Phase 2 creates the deterministic, versioned contract between the canonical manuscript and Narramorph's authored runtime edition. The consolidation epic [#93](https://github.com/zekusmaximus/Narramorph/issues/93) remains open.

| Batch | Tracking issue | Status | Acceptance evidence / remaining gate |
| --- | --- | --- | --- |
| 2.1 — Content authority and edition semantics | [#125](https://github.com/zekusmaximus/Narramorph/issues/125) | Complete | M PR #45 and N PR #130 merged; both protected `main` runs passed and both workflows prohibit silent prose overwrite. |
| 2.2 — Story Package Contract v1 | [#126](https://github.com/zekusmaximus/Narramorph/issues/126) | Complete | Both synthetic fixtures and the 1,014-variation Eternal Return catalog pass one generic validator; deterministic, rename-stability, compatibility, malformed-input, license, duplicate-ID, unsafe-path, and tamper proofs passed locally and in protected CI. |
| 2.3 — Non-mutating literary release exporter | [#127](https://github.com/zekusmaximus/Narramorph/issues/127) | Complete | M PR #46 merged; the protected merge commit deterministically produced the approved `literary-release-v1.0.0` prerelease and hash-verified artifact without changing manuscript prose. |
| 2.4 — Staged importer and concordance | [#128](https://github.com/zekusmaximus/Narramorph/issues/128) | Not started | Every runtime passage must have explainable provenance; changed releases must yield semantic diffs without prose rewrites. |
| 2.5 — Vertical slice | [#129](https://github.com/zekusmaximus/Narramorph/issues/129) | Not started | A second agent must reproduce the slice with no provenance-free manual step. |

Do not mark this record complete until every implementation PR is merged in dependency order, current protected `main` checks are green in both active repositories, all five issues satisfy their gates, and the closure PR records immutable release/package evidence.

## Scope and authority

- Narramorph is the only deployable product and owns the authored interactive runtime edition.
- `Eternal_Return_Manuscript` owns canonical long-form prose, structured literary context, and editorial approval.
- Project-Leibniz and eternal-return-digital-self remain frozen, public, unarchived, and unchanged during Phase 2.
- The approved license model remains MIT for software/tooling and all-rights-reserved for literary/editorial/runtime content, with release-specific Narramorph permission.
- Canonical manuscript prose is read-only. No Phase 2 task authorizes a prose edit.

## Starting state

Repositories were fetched from GitHub on July 14, 2026. No Phase 2 issue, pull request, branch, or implementation existed. The reused local clones were clean before work began.

| Repository | Starting `main` commit | Starting tracked content identity |
| --- | --- | --- |
| Narramorph | `a6abed903abedd7ebd9764ca8921459734b448d1` | Git tree at the recorded commit |
| Eternal_Return_Manuscript | `9709fd5401b61c8f651d81acadf45e4566c5a16b` | `manuscript/` tree `47d1d952785b7133f89fd31369baa6bd899a6e8f` |
| Project-Leibniz | `4f3f4600b8782aac5000b45dd64378baf318e1df` | Unchanged from Phase 0 |
| eternal-return-digital-self | `392eef6c6f87b8064c8cc51d91b6f029b0e32d5b` | Unchanged from Phase 0 |

The local reproduction environment is Windows `10.0.26200`, PowerShell `7.6.3`, Git `2.53.0.windows.2`, GitHub CLI `2.87.3`, Node.js `22.18.0`, npm `11.16.0`, and Python `3.13.12`.

## Live protected-main baseline

Narramorph `main` requires strict, up-to-date success for `PR / fast`, `Quality / coverage`, `Release / content-build`, `Release / browser`, `Compatibility / node-24`, `Security / dependency-review`, and `Security / secret-scan`. [Run 29363794191](https://github.com/zekusmaximus/Narramorph/actions/runs/29363794191) passed all seven at the starting commit.

`Eternal_Return_Manuscript` `main` requires strict, up-to-date success for `Manuscript / linux`, `Manuscript / windows-utf8`, and `Security / secret-scan`. [Run 29350511502](https://github.com/zekusmaximus/Eternal_Return_Manuscript/actions/runs/29350511502) passed all three at the starting commit.

Both branches require pull requests, conversation resolution, linear history, and block force-pushes/deletion. The documented sole-maintainer variance remains: required approval count is zero and admin enforcement is disabled until a second trusted maintainer exists.

## Pre-change local baseline

### Narramorph

The first clean conversion install attempt failed with Windows `EPERM` because a stale local `vite preview` from the prior task held `node_modules/@esbuild/win32-x64/esbuild.exe`. PID 23308 was confirmed as this repository's port-4173 preview and stopped. Re-running each clean install from its package directory succeeded; this was an environment lock, not a repository failure.

| Command | Result |
| --- | --- |
| `npm ci` | Passed: 707 packages audited, zero vulnerabilities. |
| `npm ci` in `tools/conversion` | Passed: 65 packages audited, zero vulnerabilities. |
| `npm run type-check` | Passed. |
| `npm run lint:ci` | Passed with 32 known warnings and zero errors. |
| `npm run format:check` | Passed. |
| `npm run test:run` | Passed: 37 files, 165 tests. |
| `npm run test:coverage` | Passed: 68.08% statements/lines, 72.90% branches, 31.22% functions. |
| `npm --prefix tools/conversion run type-check` | Passed. |
| `npm --prefix tools/conversion test` | Passed: 11 files, 110 tests. |
| `npm run content:validate:runtime` | Passed: 8 tests. |
| `npm run content:validate` | Passed: 288/288 files, zero blocker/error/warning. |
| `npm run build` | Passed: Vite 7.3.6, 2,887 modules. |
| `npm run bundle:check` | Passed every opening, story-package, total-JS/CSS, and source-map budget. |
| `npm run test:e2e` | Passed: 11 Chromium tests covering accessibility, desktop/mobile performance, complete journey/save restoration, recovery, WebGL fallback, responsive layout, 200% text, and reduced motion. |

The opening graph remained 578.16 KiB raw / 183.75 KiB gzip. The deferred Eternal Return story package remained 13,450.25 KiB raw / 2,581.07 KiB gzip.

### Eternal_Return_Manuscript

| Command | Result |
| --- | --- |
| `python -m unittest discover -s tests -v` | Passed: 4 tests, including truncated-ending and CP1252 negative paths. |
| `python scripts/validate_ci.py` | Passed all clean-clone release checks. |
| `python scripts/stats.py` (through `validate_ci.py`) | 28 chapters, 85,114 words. |
| `python scripts/assemble.py` to a temporary path | 28 chapters, 85,138 assembled words; all endings present. |
| `python scripts/continuity.py --check` | Current: 221 terms. |
| `python scripts/edit_status.py` | 15/15 roadmap items complete; UTF-8 output passed. |
| Movement Two voice/philosophy/genre/phrase/rhyme suite | All nonfailure; documented warning states retained. |
| Movement Three rhyme/alternation/dissolution suite | All nonfailure; phase A/C rhyme warnings retained, alternation and dissolution passed. |

No command modified canonical manuscript prose. The tracked `manuscript/` tree remained `47d1d952785b7133f89fd31369baa6bd899a6e8f`.

## Contract decisions

- [ADR 0002](../adr/0002-content-authority-and-edition-semantics.md) defines the canonical manuscript, authored interactive edition, and reader journey export as separate artifacts.
- The authority model is hybrid: N prose is authored; automation validates concordance, provenance, compatibility, and deterministic identity.
- Stable opaque IDs, canonical JSON, SHA-256 content hashing, deterministic source timestamps, schema/app compatibility, and saved-journey package identity are executable in Batch 2.2.
- M ordinary exporter output will be git-ignored; N imports will be staging-only. Neither tool may write the other repository or overwrite prose.
- No build/runtime command may fetch another repository or require GitHub credentials.

## Batch 2.1 completion evidence

- `Eternal_Return_Manuscript` [PR #45](https://github.com/zekusmaximus/Eternal_Return_Manuscript/pull/45) merged first as `47d2453cb7b895569ccb7398dcf40dc304422ba9`. It added the matching proposal, release, review, rollback, and do-not-overwrite workflow. No file beneath `manuscript/` changed, and the tracked manuscript tree remained `47d1d952785b7133f89fd31369baa6bd899a6e8f`.
- Manuscript post-merge [run 29366924468](https://github.com/zekusmaximus/Eternal_Return_Manuscript/actions/runs/29366924468) passed `Manuscript / linux`, `Manuscript / windows-utf8`, and `Security / secret-scan`.
- Narramorph [PR #130](https://github.com/zekusmaximus/Narramorph/pull/130) merged second as `e66e3392622b0ce9a233963a26256594cd2ded2c`. It added ADR 0002, the explicit content-ownership boundary, the Phase 2 execution record, and the in-progress consolidation index.
- Narramorph post-merge [run 29366975337](https://github.com/zekusmaximus/Narramorph/actions/runs/29366975337) passed all seven protected checks: `PR / fast`, `Quality / coverage`, `Release / content-build`, `Release / browser`, `Compatibility / node-24`, `Security / dependency-review`, and `Security / secret-scan`.
- Safe intermediate state: the manuscript and runtime prose are unchanged, no exporter/importer exists yet, and Narramorph continues using its checked-in runtime package without a cross-repository build or runtime dependency.

Batch 2.1's gate is satisfied: neither repository documents or implements a workflow that can silently overwrite the other's prose.

## Batch 2.2 implementation evidence

[Story Package Contract v1](../contracts/story-package-v1.md) defines the manifest, eight record schemas, aggregate catalog, opaque identity, deterministic serialization, SHA-256 coverage, compatibility policy, and authored/generated boundaries. Implementation branch `agent/phase-2-batch-2-2` was merged through [Narramorph PR #132](https://github.com/zekusmaximus/Narramorph/pull/132).

| Package | Story ID / version | Passages | Variations | Deterministic content hash |
| --- | --- | --: | --: | --- |
| Clockwork Garden synthetic fixture | `fixture-clockwork-garden@1.0.0` | 2 | 2 | `dc2cb771ce5afc48737c0f0379bb54c2e6994eca3c8423801f82f6c29d2595b3` |
| Tidal Signals synthetic fixture | `fixture-tidal-signals@1.2.0` | 3 | 4 | `9123675f4da6b793ffc4b0da24ea4268e6f17adf49b932fc8f252b79f8b87c5f` |
| Eternal Return runtime inventory | `eternal-return@1.0.0` | 19 | 1,014 | `f5239eceba8d443e74ed7ffa70ee1a28a4886bc54cdc5b2a428b4ed705d07e02` |

The 19 Eternal Return passages are the 18 runtime graph nodes plus the shared Layer 3 convergence section. The package catalogs content digests and never copies or modifies existing authored runtime prose.

| Command | Local result |
| --- | --- |
| `npm run story:package:build` | Passed for all three packages. The builder used reviewed `sourceDateEpoch` values, sorted inputs/records, NFC/LF normalization, and canonical JSON; no wall clock or absolute workstation path entered output. |
| `npm run story:package:validate` | Passed all three packages through `validateStoryPackage()` with no story-specific validator branch. |
| `npm run story:package:test` | Passed deterministic double builds, byte/order/ID/hash equality, title/file rename stability, runtime identity synchronization, and every required negative path. |
| `npm run type-check` | Passed after save schema `1.1.0` added exact application and `storyPackage` identity. |
| `npm test -- --run src/domain/progress/saveState.test.ts` | Passed current save construction and deterministic migration from save `1.0.0`. |

The complete local regression gate also passed: 37 app test files / 166 tests; 12 conversion test files / 128 tests, including 18 Contract v1 proofs; 68.23% statement/line, 73.10% branch, and 31.22% function coverage; 288/288 authored-content files; eight runtime-content tests; production build; every bundle/source-map budget; and all 11 Chromium accessibility, journey, recovery, performance, responsive, zoom, and reduced-motion scenarios. After the final save-envelope change, the three journey/restoration, recovery, and WebGL fallback scenarios were rerun and passed.

Gitleaks 8.24.3 also scanned the Batch 2.2 commit locally with its complete default rule set and reported no leaks. The repository configuration excludes only the two generated catalog paths whose deterministic SHA-256 values trigger the generic API-key entropy heuristic; source inputs, generators, manifests, resources, fixtures, and all other repository paths remain scanned.

- PR [#132](https://github.com/zekusmaximus/Narramorph/pull/132) head `c1399ca47fb31a209d5982f5f6fd9e3ec6eb1c03` passed all seven protected contexts in [run 29371275537](https://github.com/zekusmaximus/Narramorph/actions/runs/29371275537), including the exact-path Gitleaks proof.
- Squash merge `af7cd6835c2e9395652d2e83c8f394b78585ebe9` landed on `main`; post-merge [run 29371394439](https://github.com/zekusmaximus/Narramorph/actions/runs/29371394439) passed `PR / fast`, `Quality / coverage`, `Release / content-build`, `Release / browser`, `Compatibility / node-24`, `Security / dependency-review`, and `Security / secret-scan`.
- The merge changed no file under `src/data/stories/eternal-return/content/`; the manuscript repository and both frozen reference repositories remained unchanged.

Generated fixture/runtime catalogs are do-not-edit outputs. Application `0.1.0`, save schema `1.1.0`, and the checked-in runtime fingerprint matching the Eternal Return manifest are written into every new journey. Legacy save `1.0.0` loads only through the documented migration. The pre-contract `legacy-runtime-baseline-2026-07-14` provenance ID is intentionally not an accepted literary release; Batch 2.3 must create the immutable release consumed by Batch 2.4.

Safe intermediate state: Narramorph behavior and authored prose remain unchanged. Contract v1 is local and deterministic, no repository is fetched at build/runtime, and no importer can yet accept or write an editorial release.

## Batch 2.3 completion evidence

`Eternal_Return_Manuscript` [PR #46](https://github.com/zekusmaximus/Eternal_Return_Manuscript/pull/46) added the Python 3 stdlib-only literary release exporter, schema v1, explicit source policy, documentation, immutable-Git-blob verification, and negative-path suite. The exporter hashes all 28 canonical manuscript blobs but never copies their content. It emits only allowlisted structured editorial context and zero excerpts because no pre-existing excerpt approval markers exist.

| Identity | Value |
| --- | --- |
| Editorial release ID | `eternal-return-literary-v1.0.0` |
| GitHub tag / approval record | [`literary-release-v1.0.0`](https://github.com/zekusmaximus/Eternal_Return_Manuscript/releases/tag/literary-release-v1.0.0) — non-production prerelease |
| Immutable manuscript source / exporter merge | `5c968c287eea71be40ca7ee3234e0d62153f1b4e` |
| Literary release schema / Story Package Contract | `1.0.0` / `1.0.0` |
| Deterministic content SHA-256 | `4fc7ce7f55e359ed5c25abe8a399ceeb60c45ee965d722d6a8e83d200909d7ad` |
| Attached artifact SHA-256 | `d1f10baadeb89bddbbde95fe5359c9669261fe69b8d65c4b9378a8f53410c6f5` |
| Artifact | [`eternal-return-literary-v1.0.0.json`](https://github.com/zekusmaximus/Eternal_Return_Manuscript/releases/download/literary-release-v1.0.0/eternal-return-literary-v1.0.0.json), 32,861 bytes |
| Target | `zekusmaximus/Narramorph`, story package `eternal-return@1.x` |

The release contains 28 stable chapter records and editorial summaries, three character/voice profiles, 13 philosophical-constraint identifiers, four chronology phases, six glossary references, and 36 promise/payoff references. It records SHA-256 provenance for ten allowlisted context sources and all 28 manuscript files; `excerpts` is empty. The release record grants only the release-specific official-Narramorph use described by `INTERACTIVE_USE_PERMISSION.md` and explicitly forbids automatic runtime-prose replacement, standalone manuscript distribution, and model training.

- Local `python -m unittest discover -s tests -v` passed 15 tests, including deterministic double export, canonical UTF-8/NFC/LF bytes, source/payload tamper detection, incompatible schemas, unsafe invented excerpt approval, and a before/after manuscript hash proof.
- Local `python scripts/validate_ci.py` passed assembly/ending verification, statistics, continuity, editorial status, all Movement Two/Three nonfailure gates, exporter build, and recorded-source validation.
- PR [run 29372663866](https://github.com/zekusmaximus/Eternal_Return_Manuscript/actions/runs/29372663866) and post-merge `main` [run 29372722549](https://github.com/zekusmaximus/Eternal_Return_Manuscript/actions/runs/29372722549) passed `Manuscript / linux`, `Manuscript / windows-utf8`, and `Security / secret-scan`.
- Two consecutive exports from protected merge `5c968c287eea71be40ca7ee3234e0d62153f1b4e` produced identical content and artifact hashes. GitHub reports the same SHA-256 for the attached asset.
- No file under `manuscript/` changed; its tree remains `47d1d952785b7133f89fd31369baa6bd899a6e8f`. Narramorph runtime content and both frozen reference repositories also remain unchanged.

Safe intermediate state: the literary artifact is immutable and deliberately transferable, but Narramorph has not accepted it. Narramorph still uses its existing checked-in runtime edition and has no cross-repository build/runtime or credential dependency. Batch 2.4 must stage, validate, semantically diff, and explicitly accept this exact artifact before changing provenance metadata.

## Required merge order and safe intermediate states

1. **Batch 2.1:** M workflow cross-reference and N authority ADR/execution record. Documentation changes do not alter either edition.
2. **Batch 2.2:** N Story Package Contract v1 and fixtures. Existing Eternal Return runtime behavior remains compatible.
3. **Batch 2.3:** M exporter and immutable literary release. N still uses its current checked-in runtime package and does not consume M at build/runtime.
4. **Batch 2.4:** N staged importer, accepted-release metadata, complete concordance, and provenance explanation. Import cannot write prose.
5. **Batch 2.5:** N vertical-slice runtime/reproduction evidence against the already released M artifact.
6. **Closure:** a narrow N documentation PR marks all gates complete after current protected-main runs pass in both repositories.

## Delivery record

| Batch | Repository | Branch | Pull request | Merge commit | Evidence |
| --- | --- | --- | --- | --- | --- |
| 2.1 | Eternal_Return_Manuscript | `agent/phase-2-batch-2-1` | [#45](https://github.com/zekusmaximus/Eternal_Return_Manuscript/pull/45) | `47d2453cb7b895569ccb7398dcf40dc304422ba9` | Main run 29366924468; no prose change. |
| 2.1 | Narramorph | `agent/phase-2-batch-2-1` | [#130](https://github.com/zekusmaximus/Narramorph/pull/130) | `e66e3392622b0ce9a233963a26256594cd2ded2c` | Main run 29366975337; ADR and ownership boundary. |
| 2.2 | Narramorph | `agent/phase-2-batch-2-2` | [#132](https://github.com/zekusmaximus/Narramorph/pull/132) | `af7cd6835c2e9395652d2e83c8f394b78585ebe9` | PR run 29371275537 and main run 29371394439 passed all seven protected checks; no prose change. |
| 2.3 | Eternal_Return_Manuscript | `agent/phase-2-batch-2-3` | [#46](https://github.com/zekusmaximus/Eternal_Return_Manuscript/pull/46) | `5c968c287eea71be40ca7ee3234e0d62153f1b4e` | PR run 29372663866; main run 29372722549; prerelease `literary-release-v1.0.0`; no prose change. |

Later rows are added only when their branches and pull requests exist. Every accepted variance, deterministic hash, release/package ID, check result, and merge SHA must be recorded here before Phase 2 closes.
