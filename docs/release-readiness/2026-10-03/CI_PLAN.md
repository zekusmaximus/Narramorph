# Release-quality CI completion plan

Owner role: technical maintainer. Priority: P1 for CI-01; P2 for the remaining hardening. Estimate: 2–3 engineering days, excluding new behavioral coverage. Parent: consolidation epic #93. Findings: R01, R04, R08, R10.

## Current mechanisms and defects

The workflow already runs types, lint, formatting, application tests, focused coverage, conversion tests, authored/canon/literary validation, production build, bundle budgets, Chromium, a narrow 3D proxy matrix, Node 24, dependency diff review, and Gitleaks. Preserve the seven existing required check names while changing their implementation.

The coverage configuration nests its four floors under `thresholds.global`. Vitest interprets object keys other than supported options as file patterns; there is no matching `global` path. On both the current GitHub runner and the fresh review run, 62.7% branch coverage succeeds. An explicit global CLI floor correctly fails. The [Vitest 4 coverage reference](https://v4.vitest.dev/config/coverage) documents thresholds directly under `coverage.thresholds`.

Other gaps: lint accepts 120 warnings despite a zero-warning recent baseline; workflow jobs have no explicit timeouts or superseded-PR cancellation; third-party actions use mutable tags; dependency review only reviews PR changes; the legacy lockfile is unaudited in CI; release identities and reproducibility are not validated; the 3D proxy context is not protected.

## CI-01 — Make coverage enforcement real

Files: `vitest.config.ts`, the relevant domain/store/utility tests, `.github/workflows/ci.yml`, readiness documentation.

1. Put `branches: 70`, `functions: 25`, `lines: 60`, and `statements: 60` directly under `coverage.thresholds`. Preserve the current include/exclude surface; changing the denominator to pass is not remediation.
2. Add behavior-driven tests for uncovered critical branches: corrupt/unsupported saves and recovery, exhausted/fallback variation selection, unlock decisions, L3 assembly failure, persistence failure/retry, and map/story coordination. Use the actual coverage report to choose branches; do not test private implementation trivia.
3. Keep the 70% branch contract. If restoration needs staged delivery, a temporary lower floor is an explicit variance with an owner, reason, expiry, and linked repair work. This review grants no variance.
4. Verify the configuration itself with a controlled negative gate: an impossible threshold must exit nonzero. Record the command and exit status in the execution record; do not leave a deliberately failing application test in the suite.
5. Add coverage for import sanitization and telemetry contract files to the enforced critical surface after the privacy repair. Those tests currently execute, but the configured coverage include list omits those files.

Acceptance: `npm run test:coverage` actually enforces all four floors; `npm run test:coverage -- --coverage.thresholds.branches=100` exits nonzero on this corpus; the intended floor passes through additional meaningful tests; no exclusion or silent threshold reduction hides the miss.

## CI-02 — Make checks reproducible and bounded

Files: workflow, `package.json`, tooling configuration.

- Pin each action to a verified full commit SHA, with its readable version in a comment. Preserve Dependabot management of action updates. [GitHub's secure-use reference](https://docs.github.com/en/actions/reference/security/secure-use) identifies full-SHA pinning as the immutable action reference.
- Set job timeouts: initially 15 minutes for fast/coverage/content/Node 24, 20 for browser jobs, and 10 for security. Tune against measured runtime, not hypothetical failures.
- Keep ordinary PR jobs at `contents: read`; grant release writes only to the trusted release jobs. Fork PRs receive no deployment/upload credentials. Avoid running untrusted checkout code through a privileged `pull_request_target` path.
- Cancel superseded PR runs using a per-PR concurrency group. Serialize production releases separately and never cancel a deployment halfway through promotion.
- Change `lint:ci` to `--max-warnings=0`. Replace `validate`'s watch-mode `npm test` with the finite `test:run` command. Preserve local watch commands for development.
- Align the supported Node floor with locked dependencies; use Node 22 as primary and Node 24 as compatibility. Add configuration type checking for Vitest/Playwright/Vite so unsupported options cannot survive the application's source-only `tsc` check.
- Upload success and failure summaries with commit, Node/npm/browser versions, test counts, and real exit status. Ordinary artifacts can remain short-lived; release evidence belongs with the retained release artifact.

Acceptance: a superseded PR stops, a deliberately hanging check is bounded, one lint warning fails, and the documented validation command terminates normally.

## CI-03 — Gate current security and release integrity

Dependencies: DEP-01–03 remediation/exception policy; REL-01 manifest hardening.

1. Add `Security / audit`: install/inspect all three lockfiles and evaluate full audit JSON on PR, `main`, and weekly schedule. Fail for unapproved high/critical findings and expired exceptions. Treat audit/network/parser errors as unavailable evidence, never a clean audit. Keep raw counts visible even for approved exceptions.
2. Keep dependency diff review as a separate protection against newly introduced advisories. Its success on `push` is currently an informational echo, not a baseline scan.
3. Explicitly run `story:package:validate`, `scope:check`, and the hardened release-manifest consistency check in content/build, even though some are transitively exercised by tests. A release gate should identify which contract failed.
4. Run double-build reproducibility in the release-candidate pipeline and scheduled integrity checks rather than doubling every fast PR build. Missing SHA/schema/range or a map anywhere in the deploy archive must fail.
5. Add negative fixtures for the actual gate logic: missing manifest identity, altered asset checksum, expired dependency exception, and an unexpected deployment map. These test policy boundaries, not a rewritten copy of the implementation.
6. Repeat tracked-file/full-history secret scanning on the candidate and obtain an owner record for GitHub secret-scanning/push-protection status and alert disposition. The successful CI scan does not establish account-level settings or prove that external secrets were rotated.

## CI-04 — Update required checks safely

The accessible `main` snapshot lists seven required contexts; `Compatibility / 3D proxy matrix` is absent. Add that context because the optional feature is still shipped, and add the baseline audit context after both have been observed green on a PR. A separate broader 2D cross-engine smoke gate should run before release promotion; proxies remain honestly labeled.

Export the actual protection settings with repository-admin access, compare them with the documented policy, and record approvals, stale-review dismissal, administrator enforcement, conversation resolution, force-push/deletion rules, and context identity. Detailed protection could not be read through the review connection. Do not invent settings or disable required checks to make a PR mergeable. With one maintainer, retain the documented independent-review limitation and enable a required independent approval when a second trusted maintainer exists.

Acceptance: a PR with a failing 3D proxy or baseline audit cannot merge through the normal protected path. Establish new green contexts before requiring them so the repository is not locked behind a nonexistent check.
