# Narramorph release-readiness review and execution plans

Reviewed: October 3, 2026. Repository: `zekusmaximus/Narramorph`. Reviewed `main`: [`096a0ac46fd0ab27f5366de64d4e0fd42ffb2a09`](https://github.com/zekusmaximus/Narramorph/commit/096a0ac46fd0ab27f5366de64d4e0fd42ffb2a09).

**Narramorph has substantial release infrastructure, but its green CI result does not establish release readiness.** The most urgent defect is a coverage gate that does not enforce its advertised thresholds. Current dependencies also have new advisories. Publishing, rollback, monitoring privacy, and manual QA need further implementation or recorded operational evidence.

This is a dated review and a set of implementation proposals. It does not promote the product beyond alpha, implement the proposed fixes, approve a deployment, or replace the charter and ADRs. The plans extend the existing consolidation program; they do not restart completed phases.

## What is already implemented

- Eight CI jobs run on pushes and pull requests. The `main` branch snapshot names seven required contexts. The latest product push [run 30497985339](https://github.com/zekusmaximus/Narramorph/actions/runs/30497985339), on July 29, passed all eight jobs, including the optional 3D proxy matrix.
- Current local verification passed **486 application tests in 81 files**, **160 conversion tests in 14 files**, TypeScript, lint, formatting, runtime integrity, authored-content validation, canon validation, package validation, and literary/slice intake.
- Lazy story/3D boundaries and bundle budgets exist and pass. Source maps are disabled for ordinary builds. A production-CSP test server exercises the repository policy.
- App-version lockstep, release manifests, checksums, reproducibility tooling, import sanitization, local recovery, and exact-journey export exist.
- The accepted architecture is static/client-only, with no service worker for v1. The 2D reader remains the required path; 3D is an optional enhancement.

The remaining work is to make these mechanisms enforce the promised contracts and prove the production release.

## Prioritized findings

P1 means resolve before release promotion, or record a narrowly justified, dated variance where the existing policy permits one. P2 means finish the identified readiness work; it is not evidence of an exploited production vulnerability.

| ID | Priority | Finding and consequence | Evidence | Plan |
| --- | --- | --- | --- | --- |
| R01 | P1 | Coverage is falsely green. `thresholds.global` is treated as a file-pattern threshold, not the global floor. **62.7% branches passes against the documented 70% floor.** | [Vitest config](../../../vitest.config.ts); local run and July 29 CI both report 62.7%. Explicit `--coverage.thresholds.branches=70` fails. | [CI](CI_PLAN.md) |
| R02 | P1 | Historical zero-advisory claims are stale. Current full audits report **15 root / 5 conversion / 1 legacy-tools findings**, including **9 / 2 / 1 high**. The root security updater also failed. | Three lockfiles; [failed updater](https://github.com/zekusmaximus/Narramorph/actions/runs/36426830366); [audit snapshot](REVIEW_EVIDENCE.json). | [Dependencies](DEPENDENCY_PLAN.md) |
| R03 | P1 when monitoring is enabled | Redaction preserves unrestricted error messages, exceptions, tags, and UI breadcrumbs. The loaded SDK also enables session reporting outside the `beforeSend` error gate. The documented privacy guarantee is broader than the implementation. | [`errorRedaction.ts`](../../../src/utils/errorRedaction.ts), [`errorReporting.ts`](../../../src/utils/errorReporting.ts); synthetic marker survives redaction; installed Sentry 10.68.0 default integrations. | [Observability](OBSERVABILITY_PLAN.md) |
| R04 | P1 | There is no artifact publishing or deployment workflow. Manifest, map upload, and reproducibility commands are disconnected from CI. No GitHub Releases were returned. | [Only workflow](../../../.github/workflows/ci.yml); [`build-release-manifest.mjs`](../../../scripts/build-release-manifest.mjs); [release runbook](../../RELEASE_ROLLBACK.md). | [Deployment](DEPLOYMENT_PLAN.md) |
| R05 | P1 | `release:rollback` prints instructions; it does not perform a rollback. Tests run one implementation with different version labels, not two deployed versions. The rehearsal record is unfilled. | [`rollback.mjs`](../../../scripts/rollback.mjs); [`rollbackSafety.test.ts`](../../../src/domain/progress/rollbackSafety.test.ts); [runbook](../../RELEASE_ROLLBACK.md). | [Deployment](DEPLOYMENT_PLAN.md) |
| R06 | P1 | Manual assistive-technology results and a complete release sign-off are absent. Cross-engine 3D proxies do not establish Safari/iPhone/Android or screen-reader support. | [Accessibility statement](../../ACCESSIBILITY.md), [browser policy](../../BROWSER_SUPPORT.md), [proxy config](../../../playwright.3d.config.ts). | [Manual QA](MANUAL_QA_PLAN.md) |
| R07 | P2 | Performance policy specifies three runs and medians, but the harness runs once per profile. Interaction measurements can silently be zero; cold passage readiness is not timed. Only threshold-cleared historical results are recorded. | [Budgets](../../../config/performance-budgets.json), [harness](../../../e2e/performance-boundaries.spec.ts), [Phase 8 evidence](../../consolidation/PHASE_8_EXECUTION.md). | [Performance](PERFORMANCE_PLAN.md) |
| R08 | P2 | Declared engines allow Node 22.0 and Node 23, although locked Vite requires at least 22.12 on the supported 22 line and the stated policy selects 22/24. | Root/conversion manifests and lockfiles; [README](../../../README.md). | [Dependencies](DEPENDENCY_PLAN.md) |
| R09 | P2 | Readiness documents and issue bodies materially lag the code: old test counts, a pre-lazy-loading bundle, and obsolete unimplemented-feature claims remain. | [Release status](../../RELEASE_STATUS.md), [status](../../STATUS.md), [consolidation index](../../consolidation/README.md); 20 open non-PR issues. | [Backlog](BACKLOG_PLAN.md) |
| R10 | P2 | The 3D proxy job runs but is not among the seven required contexts. Action tags are mutable; full dependency audits and release integrity checks are not required. | Workflow and branch snapshot. Detailed protection access was denied, so approval/admin-bypass settings are not fully verified. | [CI](CI_PLAN.md) |
| R11 | P2 | The legacy tools manifest advertises missing executable files and `node >=14`; its package is updated by Dependabot but has no CI execution contract. | [`tools/package.json`](../../../tools/package.json), [`tools/INDEX.md`](../../../tools/INDEX.md). | [Dependencies](DEPENDENCY_PLAN.md), [backlog](BACKLOG_PLAN.md) |
| R12 | P2 | Editorial validation has **0 errors, 6,116 warnings, 31 waivers, and 1 open contradiction with no open severity-1 contradiction**. These need a release disposition rather than a blanket “all editorial work complete” claim. | Current canon/literary validation and [contradiction register](../../../story-packages/concordance/contradictions.v1.json). | [Manual QA](MANUAL_QA_PLAN.md), [backlog](BACKLOG_PLAN.md) |

## Verification and limits

Fresh checks used Node **24.19.0**, npm **11.9.0**, the committed lockfiles, and a clean clone. The ordinary coverage command exits 0; the correctly enforced 70% branch command exits 1. This is an enforcement defect, not failing application assertions.

The current ordinary build has **650,344 bytes initial JS / 209,231 gzip**, **75,143 CSS / 14,371 gzip**, and no public maps. A build using a synthetic, non-delivering Sentry DSN also passes every budget after removing its **34 hidden maps**; its total JS gzip is **3,271,833 / 3,320,000 bytes**, leaving limited headroom. Two ordinary builds produced **47 byte-identical files**. A manifest generated without a SHA records `unknown`, demonstrating the missing fail-closed provenance check.

The `tsx` CLI's IPC socket is prohibited in this review environment. The same conversion entry points passed through `node --import tsx`; that workaround is recorded as such. The pinned Playwright browser download was unavailable, so fresh browser execution is **not claimed**. The current commit's GitHub logs independently confirm **38 Chromium scenarios passed**.

The repository records a July 19 deployment and header scans at `narramorph.com`, despite other documents saying no production deployment exists. Live requests from this runner returned 403 at the apex and 502 at `www`; these access results cannot establish a site outage, current edge configuration, or deployed commit. Cloudflare/Sentry account configuration, live secret scanning alerts, and detailed protection settings were not accessible. Close those evidence gaps through the operational plan.

Counts from `npm audit` are vulnerable-package entries, including propagated dependency chains. They are not counts of independent exploits, and `--omit=dev` is not a deployed-code reachability analysis. Full structured summaries are in [REVIEW_EVIDENCE.json](REVIEW_EVIDENCE.json).

## Implementation order

| Wave | Work | Completion condition |
| --- | --- | --- |
| 1 | CI-01 coverage enforcement; DEP-01/02 current advisory triage and compatible patches; DOC-01 factual reconciliation | The gate really fails below its floors; current risks have remediation or a permitted, expiring exception; status matches source evidence. |
| 2 | Remaining CI controls, PERF-01/02 measurements, OBS-01/02 privacy | Required checks are meaningful; raw metrics and production-relevant assertions exist; consent controls every telemetry envelope. |
| 3 | REL-01/02 artifact packaging and staging; OBS-03 private stack resolution | One verified artifact has complete identities, no maps, passing budgets, and a tested staging deployment. |
| 4 | REL-03/04 rollback and edge verification; QA-01–04 real platforms and approval | Saves survive real A→B→A deployment; edge checks and manual results are attached to the candidate; release decision is explicit. |

These are planning estimates: **12–18 engineering days**, plus **2–4 tester-days** and access/device coordination. A necessary Tailwind or other major migration can add **4–6 engineering days**. Do not set a calendar release date until Wave 1 determines that scope. Owners in the plans are responsibility roles, not claims that people have accepted assignments.

Preserve app `0.1.1`, package `eternal-return@1.3.0`, content hash `80f3d5a210c5d2814b224c86ec6d47fe8b418408f7133ee337b66b8d535efb50`, save schema `1.3.0`, and accepted literary release `eternal-return-literary-v1.0.2` during infrastructure work. A necessary app bump must follow the existing lockstep/range contract. A canonical prose change, new backend, service worker, or reference-repository archive remains a separate governed change.

## Release decision

Beta requires corrected technical gates, supported-platform evidence, staging, and a save-safe rollback rehearsal. A release candidate additionally requires frozen scope, artifact provenance, production-like headers/privacy/monitoring evidence, and the full manual QA matrix. GA requires the existing product/editorial/technical/accessibility/security/operations approval and an identified support owner.

The launch blockers cannot be closed by writing another success claim. Each plan specifies the command, observed outcome, or signed result that closes it.
