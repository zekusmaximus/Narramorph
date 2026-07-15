# Phase 2 vertical-slice reproduction

Updated: July 15, 2026

This runbook lets a second agent reproduce Batch 2.5 without editing either prose edition and without a provenance-free copy step. It proves the connected Narramorph journey `arch-L1` → `arch-L2-accept` against a reviewable subset exported by `Eternal_Return_Manuscript`.

## Immutable inputs

| Input | Identity |
| --- | --- |
| Manuscript source | `6720e76202951e24102997e2b8ef23e08445ab33` |
| Manuscript tag / prerelease | `literary-release-v1.0.1` |
| Full literary release | `eternal-return-literary-v1.0.1` |
| Full content / asset SHA-256 | `667dd8d971352c8665fdac97fefdf258bb71489d21853a2a87e5ac236912747f` / `19ffeffc1cf0de6440b16f1e9335d7c738edbf178e1a71f8e875d8960cb8d58e` |
| Vertical slice | `archaeologist-opening-accept@1.0.0` |
| Slice content / asset SHA-256 | `e1ecf6812a2246c188c940fc6646745625b577a971cbf71db5cd6f2274a4c79e` / `6c47118a7d5f349c071b8656f69fac94ecea68f4cee45cea4509ce618c257d79` |
| Target runtime path | `arch-L1` → `arch-L2-accept` |
| Target stable passage IDs | `spv1_psg_6a8e3511627df7d650fb4647` → `spv1_psg_cfe8d9d443f62c608def0b1d` |

The selected path is the smallest connected opening-to-decision journey that exercises Layer 1 rendering, a real player choice, Layer 2 navigation, persistence, reload, mobile layout, and the archaeologist voice and philosophical constraints. The slice carries structured references only: eight chapter/scene-summary records, one voice, two chronology phases, four philosophical constraints, and eleven promise/payoff records. It contains no manuscript excerpt and no Narramorph runtime prose.

## Rebuild and verify the manuscript artifacts

Use a clean `Eternal_Return_Manuscript` checkout at the exact source commit. Do not change any file under `manuscript/`.

```powershell
git switch --detach 6720e76202951e24102997e2b8ef23e08445ab33
python -m unittest discover -s tests -v
python scripts/validate_ci.py
python scripts/export_vertical_slice.py --slice archaeologist-opening-accept --release-id eternal-return-literary-v1.0.1 --source-commit 6720e76202951e24102997e2b8ef23e08445ab33 --out build/literary-releases/reproduction
python scripts/export_vertical_slice.py --validate build/literary-releases/reproduction/eternal-return-literary-slice-archaeologist-opening-accept-v1.0.0.json --base-release build/literary-releases/reproduction/eternal-return-literary-v1.0.1.json
```

Hash the two output files and compare them with the immutable inputs table. Repeating the export in a second empty directory must produce the same bytes and hashes. `git status --short` must remain empty, and `git rev-parse HEAD:manuscript` must remain `47d1d952785b7133f89fd31369baa6bd899a6e8f`.

## Transfer without manual copying

Download both named assets from the approved GitHub prerelease into Narramorph's allowlisted source directory. This makes the repository, tag, asset names, and GitHub-reported hashes independently auditable.

```powershell
gh release download literary-release-v1.0.1 --repo zekusmaximus/Eternal_Return_Manuscript --pattern "eternal-return-literary-v1.0.1*.json" --dir literary-releases/source
```

Do not paste JSON, copy it through an editor, or regenerate it from Narramorph. Verify the downloaded files against `known-releases.json` and `known-slices.json` before review.

## Stage, review, and accept in Narramorph

Install from the lockfiles, build the deterministic Story Packages, and stage both artifacts.

```powershell
npm ci
npm ci --prefix tools/conversion
npm run story:package:build
npm run literary:stage -- eternal-return-literary-v1.0.1
npm run literary:slice:stage -- archaeologist-opening-accept
```

Review both `report.json` files and their human-readable semantic diffs beneath ignored `build/` directories. Confirm all of the following before updating checked-in acceptance metadata:

- every release, source, asset, and content hash matches the immutable inputs table;
- the slice is an exact structured subset of the verified full release;
- the two target stable IDs resolve through the accepted 19/19 concordance;
- the runtime graph contains the declared `arch-L1` → `arch-L2-accept` connection;
- all chapter, scene, voice, chronology, philosophy, promise, and relationship mappings equal the full concordance;
- both reports say runtime-prose mutation is forbidden and manual copying was not used.

After recording explicit acceptance and rebuilding the provenance-only `eternal-return@1.0.2` package, these commands must pass and staging must classify both artifacts as `no-semantic-change`:

```powershell
npm run literary:validate
npm run literary:slice:validate
npm run literary:slice:explain -- archaeologist-opening-accept
npm run literary:stage -- eternal-return-literary-v1.0.1
npm run literary:slice:stage -- archaeologist-opening-accept
npm run story:package:validate
npm run story:package:test
npm run test:run
npm run test:e2e
```

The accepted Story Package identity is `eternal-return@1.0.2` with content hash `656b5b6bacbc0ca69a9eb0ddc7a089219b8218c7a78fabf1d6c788ea5f075566`. The accepted concordance hash is `2db68576f02ea5e05e6fcd0d32d6f0f989f16a874a2c334f9684ba1c2e021ef8`. The 577 tracked runtime-content files must retain aggregate SHA-256 `af4cea821626bbd0a92b119bbbb27f0f92aa03abbee7b112a1a6794cc3cb6f60`.

## Browser acceptance

The dedicated browser scenario starts a new journey, selects the archaeologist, opens Layer 1, follows the acceptance choice into Layer 2, and asserts the exact package identity and stable passage path stored in the save. It reloads the application to prove restoration and repeats the connected path at `390×844`, using only keyboard controls while checking for horizontal overflow. Existing accessibility, recovery, WebGL fallback, reduced-motion, zoom, performance, and full-journey scenarios remain part of the complete browser gate.

## Rollback

Batch 2.5 does not deploy anything. Before merge, close the Narramorph pull request and discard only its unmerged branch. After merge, use a normal reviewable revert pull request; do not delete or move the manuscript tag and do not rewrite either repository's history. A revert returns Narramorph to the already safe Batch 2.4 state: the v1.0.0 release remains accepted, saves migrate only to `eternal-return@1.0.1`, and no cross-repository build or runtime dependency exists. The immutable v1.0.1 prerelease remains available as audit evidence but is not consumed by the reverted product.
