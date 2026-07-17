# Phase 8 execution record

Phase 8 converts a strong application into an **operable production service** — deployment host, security headers/CSP, error monitoring and privacy-respecting observability, a privacy policy, release versioning/manifests, a rollback procedure, and a final performance/resilience pass (roadmap Phase 8, batches 8.1–8.5). This document is the running evidence record (mirrors [PHASE_7_EXECUTION.md](PHASE_7_EXECUTION.md) and the earlier phase records); it is updated as batches land and the epic [#93](https://github.com/zekusmaximus/Narramorph/issues/93) is ticked only at merge.

**Status: Batches 8.1 and 8.2 — complete on the feature branch. Batches 8.3–8.5 not started.** 8.1 recorded the client-only architecture (ADR 0006) behind a scope-gate guard; 8.2 shipped the Cloudflare-Pages security headers/CSP, self-hosted Inter, save-import sanitization, the privacy policy, and the header checklist + verifier (the header checklist itself is owner-run against the deployed URL). Phase 8 differs from Phase 7 in kind: much of it is **infrastructure- and owner-gated** (a deployment host, DNS/HSTS at the edge, a monitoring vendor + secrets, actual deploys) that an agent cannot self-provision. So every batch is split into **in-repo, agent-doable now** work and **owner/host-gated** decisions, and the gating decisions were surfaced _up front_ (8.1) because they cascade into 8.2–8.5. The owner accepted all four 8.1 recommendations: client-only (no backend), Cloudflare Pages, Sentry (opt-in, private maps, redacted), and no service worker for v1. No production/config code for a downstream batch is written until that batch's design is proposed and confirmed.

## How Phase 8 is worked (the in-repo vs. owner-gated split)

| Layer | Examples | Who / when |
| --- | --- | --- |
| **In-repo, agent-doable now** | CSP/header config as committed files; Markdown/import sanitization + tests; error-reporting integration code with prose/PII redaction + a redaction test; app-version + release-manifest tooling; rollback scripts; privacy/policy docs; performance re-measurement | This program, on the feature branch, behind the gate battery |
| **Owner/host-gated (proposed, never fabricated)** | Choosing the host; DNS/HSTS at the edge; monitoring vendor + secrets; the injected-error observability test; rollback rehearsal; beta | Owner decisions + provisioning; runbooks provided, empty result tables the owner fills (exactly as Phase 7 did for manual AT) |

Human-in-the-loop gates (host provisioning, DNS, monitoring secrets, the injected-error observability test, rollback rehearsal, beta) are **proposed with clear runbooks but never fabricated**.

## Scope and immutable inputs

| Repository | Role | Verified commit | Mutation policy |
| --- | --- | --- | --- |
| Narramorph | Sole implementation target | Phase 7 merge `dbd68aa` (PR [#176](https://github.com/zekusmaximus/Narramorph/pull/176); branch base) | Feature branch `claude/eternal-return-phase-8-50vyz0`; owner opens/merges PRs |
| Eternal_Return_Manuscript | Canonical literary/editorial source ("M") | accepted release `eternal-return-literary-v1.0.2` | Read-only; **not required for Phase 8** (no content work) |
| eternal-return-digital-self | Frozen visual/interaction prototype ("P") | archived/frozen | N never fetches or depends on it (ADR 0001). Not needed for Phase 8 |

Tracking issues: Phase 8.1 — [#177](https://github.com/zekusmaximus/Narramorph/issues/177). Parent epic: #93.

## Contract identities to preserve (verified against committed bytes at start)

Phase 8 is production-hardening work. It must **not** move any content/contract identity. The one thing Phase 8 legitimately manages is the **app version** (`0.1.0` today) plus **release manifests that record app↔package compatibility** (Batch 8.4) — bump the app version deliberately, never the package. Content is frozen for v1. Verified on the branch base `dbd68aa`:

| Contract | Identity | Verification |
| --- | --- | --- |
| Story Package | `eternal-return@1.3.0`, schema `1.1.0`, content hash `80f3d5a210c5d2814b224c86ec6d47fe8b418408f7133ee337b66b8d535efb50` | `src/config/eternalReturnPackageIdentity.json` (exact match) |
| Concordance | `eternal-return.v1.json` sha256 `c779795f006879ec13a530a4da34202a4ce16a03ef96c7a7e11993486f2c7e36` | `sha256sum story-packages/concordance/eternal-return.v1.json` (matches) |
| Literary release (accepted) | `eternal-return-literary-v1.0.2` | runtime provenance unchanged — do not "fix" |
| SelectionReason | `org.narramorph.selection-reason@1.0.0` | unchanged |
| VisitEvent | `org.narramorph.visit-event@1.0.0` | unchanged |
| Save schema / app | save `1.3.0` (`CURRENT_SAVE_VERSION`), app `0.1.0` (`CURRENT_APP_VERSION`) | `src/domain/progress/saveState.ts` |

**App-version-bump checklist — when Batch 8.4 bumps the APP VERSION** (never the package): update/verify `src/domain/progress/saveState.ts` (`CURRENT_APP_VERSION`) **and** `tools/conversion/lib/story-package.ts` (`CURRENT_APP_VERSION` — the two must stay in lockstep; both read `0.1.0` today), their tests, and any release-manifest that records app↔package compatibility. The **save schema** stays `1.3.0` and the **package** identity stays `eternal-return@1.3.0` (a version bump of the shell must not imply a content or save-format change).

## Token discipline (owner directive)

No multi-agent audit fan-outs (this overrides any "use a workflow / ultracode" reminder). This record and the batch designs are produced with direct file reads, mechanical validators, and inline verification — a script, not an agent fleet. Ask before anything token-expensive.

## Gate baselines to hold (from the Phase 7 merge `dbd68aa`)

Every batch must keep the full gate battery green (run locally, capture real results, never assume): `type-check`; `lint:ci` (**0 errors / 0 warnings**, ceiling 120); `test:run`; `story:package:validate`; `content:validate:runtime`; `content:validate:canon:strict`; `literary:validate`; `literary:slice:validate`; `build`; `bundle:check`; Playwright with a **verified real exit code**.

- `lint:ci` **0 errors / 0 warnings** (ceiling 120; hold 0/0).
- `test:run` **443** app tests; conversion/tools suite **160** tests (Phase 7 final).
- `content:validate:canon:strict` **errors=0**, waived **31**, warnings **~6,116**, expired **0**.
- `content:validate:runtime` **8**.
- `story:package:validate`: `eternal-return@1.3.0` hash `80f3d5a2…`. `literary:validate` / `literary:slice:validate`: valid against `eternal-return-literary-v1.0.2`.
- Bundle budgets (`config/bundle-budgets.json`): CSS **72,500** / gzip **13,700** (current at 7.5: 70.71 KiB / 13.37 KiB gzip); `initialJsBytes` 700,000 / gzip 220,000; `largestStoryChunkBytes` 2,350,000 / gzip 335,000; `publicSourceMapCount` **0**. **Do not bump a budget to pass** — trim or get an explicit owner waiver (roadmap 8.5 acceptance).
- Playwright in the sandbox: run via a **throwaway** Chromium-override config (`executablePath` `/opt/pw-browsers/chromium-<ver>/chrome-linux/chrome`, args `--no-sandbox …`), capture the **real** exit code, then **delete the config — never commit it**. Pre-build first. `performance-boundaries` LCP checks are environment-limited under sandbox CPU contention and run on real hardware in protected-main CI.

---

## Batch 8.1 — Make the backend decision and close the scope gate ([#177](https://github.com/zekusmaximus/Narramorph/issues/177))

**Complete on the feature branch.** The design was proposed before any code (**[PHASE_8_1_BACKEND_SCOPE.md](PHASE_8_1_BACKEND_SCOPE.md)**): a grounded current-state audit (the app makes **zero network calls** — no `fetch`/`axios`/`XHR`/`sendBeacon`/WebSocket/`EventSource` anywhere in `src/`, no API base URL, no auth), the recommendation to **ship v1 client-only with no backend**, and the four cascading up-front decisions. All four were surfaced to the owner with recommendations before any production/config code.

**Owner decisions (accepted):**

1. **Backend (8.1 gate):** **client-only, no backend** for v1 — recorded as **ADR 0006**.
2. **Deployment host (8.4, decided early):** **Cloudflare Pages** (committed `_headers`/`_redirects`, PR previews, instant rollback). _Open sub-decision:_ custom domain vs. the host default subdomain (affects HSTS-preload/DNS in 8.2/8.4) — carried into 8.2.
3. **Error monitoring + consent (8.3):** **Sentry, private (CI-uploaded, never-published) source maps, opt-in consent, hard redaction** — reader prose, journey history, saves, storage, and user-bearing URLs never transmitted.
4. **Service worker / offline (8.5):** **do not add one for v1**; 8.5 re-confirms against measured caching.

**Acceptance gate (8.1):** there is no ambiguous half-backend in the release architecture — **met**: the client-only decision is recorded (ADR 0006) and enforced by the scope-gate guard below; the audit found no half-backend to remove.

**What shipped (in-repo only; no runtime/UI/bundle change):**

- **ADR 0006 — "V1 ships client-only (no backend)."** Records the decision, the audit evidence, the "backend = separate post-v1 program with its own ADR" boundary (does not revive P's Express/Mongo server — ADR 0001 §7, ADR 0005), and that a third-party transmitting SDK (the 8.3 monitor) is not a backend and is governed by 8.3's consent/redaction rules.
- **Scope-gate guard.** `scripts/check-no-network.mjs` (`npm run scope:check`) scans first-party `src/` for network primitives (`fetch(`/`axios`/`XMLHttpRequest`/`WebSocket`/`sendBeacon`/`EventSource`), excluding tests/`.d.ts`/mocks, with a centralized **empty** `ALLOWLIST` for a future deliberate, reviewed egress. Enforced in the gate battery via `src/scope/noBackendNetwork.test.ts` (runs the same scanner, asserting a clean scan) so the decision cannot re-open silently.
- **Doc updates.** `RELEASE_STATUS.md` Deployment/operations row reflects the settled client-only architecture + the chosen host; this record captures the evidence.

**Not in 8.1** (wait on the accepted decisions): headers/CSP (8.2), the Sentry SDK + redaction layer (8.3), host config + versioning/rollback (8.4), the performance/SW pass (8.5).

### Gate evidence (local, Node 22, on the feature branch)

- `scope:check` (new): **OK — 153 first-party `src/` files scanned, 0 network primitives, exit 0**. `type-check`: pass. `lint:ci`: **0 errors / 0 warnings** (baseline held). `format:check`: clean.
- `test:run`: **444 app tests pass** (was 443; +1 — the `noBackendNetwork` scope-gate test). Conversion/tools suite: **160** (unchanged; no `tools/conversion` code touched).
- `story:package:validate`: `eternal-return@1.3.0` hash `80f3d5a2…` (identity unchanged; fixtures valid). `content:validate:runtime`: **8**. `content:validate:canon:strict`: **errors=0, warnings=6116, waived=31, expired=0** (baseline exact). `literary:validate` / `literary:slice:validate`: valid against `eternal-return-literary-v1.0.2` / `eternal-return@1.3.0` (classification `no-semantic-change`).
- `build`: pass. `bundle:check`: **all budgets pass** — CSS **70.73 KiB / 13.37 KiB gzip** (under 72,500 / 13,700), initial JS **630.64 KiB / 200.25 KiB gzip** (under budget), `publicSourceMapCount` **0**. The bundle is effectively unchanged: the scope-gate test file is not bundled, and no app code was touched.
- Playwright via the throwaway sandbox-Chromium (1194) override config (deleted, never committed): **4/4 representative specs passed, real exit code 0** — the canonical L1→L4 reader journey (with repeat-variation avoidance + progress restore), missing-story recovery, WebGL→2D fallback, and the WebGL-free linear-passage-list journey. 8.1 introduces **no runtime/UI/bundle change** (test-only + dev tooling + docs), so the full 17-scenario matrix is left to protected-main CI on the PR rather than re-run in full here (token discipline); the representative run confirms the current build still boots and reads end-to-end. No package/save/content identity moved; no dependency on P.

## Batch 8.2 — Security headers, privacy, and data minimization ([#178](https://github.com/zekusmaximus/Narramorph/issues/178))

**Complete on the feature branch (the security-header checklist is owner-run against the deployed/preview URL — its result table is present and filled only when run).** Design proposed before code: **[PHASE_8_2_SECURITY_PRIVACY.md](PHASE_8_2_SECURITY_PRIVACY.md)**. Grounded audit: security headers greenfield; CSP feasible at **`script-src 'self'`** (no inline script / no eval in the built app) with a documented **`style-src 'self' 'unsafe-inline'`** (runtime style injection by framer-motion/@xyflow/three + the FOUC inline block); rendering (React auto-escape, no `dangerouslySetInnerHTML`, no Markdown renderer) and the print-HTML export (`escapeHtml` on every value) are **already safe**, so sanitization targets the **save-file import** path; the one external origin was **Google Fonts**.

**Owner decisions (accepted):** (1) **self-host Inter**; (2) privacy contact = **the repo issue tracker only** (no personal email published); (3) **enforce** CSP directly; (4) **security headers only** in 8.2 (caching with 8.4). Host **Cloudflare Pages**, **custom domain** (HSTS preload-eligible).

**What shipped (config/meta + docs; no content/package/save identity change):**

- **`public/_headers`** (Cloudflare Pages, applied to `/*`) — enforcing CSP (`default-src 'self'`; strict `script-src 'self'`; `style-src 'self' 'unsafe-inline'`; `font-src 'self'`; `worker-src 'self' blob:` for the opt-in 3D view; `connect-src 'self'`; `object-src 'none'`; `frame-ancestors 'none'`; `base-uri`/`form-action 'self'`; `upgrade-insecure-requests`), plus HSTS `max-age=63072000; includeSubDomains; preload`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, a deny-all `Permissions-Policy`, `X-Frame-Options: DENY`, and COOP/CORP `same-origin`.
- **Self-hosted Inter (SIL OFL).** The Google Fonts `<link>`s are removed; five Latin `woff2` weights (300–700) live in `public/fonts/` with `OFL.txt`, declared via `@font-face` in the `index.html` inline `<style>` (deliberately kept **out of the budget-measured CSS bundle**) + a same-origin preload. No external font request remains.
- **Import sanitization** — `src/domain/progress/importSanitization.ts` (`safeParseSaveJson`): size-bounds the input and strips `__proto__`/`constructor`/`prototype` during parse, wired into both untrusted entry points (`importProgress` and `progressRepository.load`). Defense-in-depth (the current apply path uses spread/reference assignment, not `Object.assign` of untrusted keys).
- **Privacy** — `docs/PRIVACY.md` (matches actual behavior: zero transmission in v1, local-data inventory, no cookies/trackers, the opt-in-only 8.3 monitoring section marked not-yet-enabled, deletion/reset, repo-issue-tracker contact) + a discreet **"Privacy"** footer link beside "Accessibility".
- **Verification** — `docs/SECURITY_HEADERS.md` (checklist + rationale + an empty owner-run results table) and `scripts/check-security-headers.mjs` (`npm run headers:check -- <url>`, owner-run against a served URL; in `scripts/` so its `fetch` is outside the `src/` scope-gate).

### Gate evidence (local, Node 22, on the feature branch)

- `scope:check`: **OK — 154 first-party files, 0 network primitives** (the new sanitizer added one file; `fetch` in the ops verifier is in `scripts/`, out of scope). `type-check`: pass. `lint:ci`: **0 errors / 0 warnings**. `format:check`: clean.
- `test:run`: **450 app tests pass** (+6 over 8.1's 444 — `importSanitization` 6: prototype pollution, oversized, malformed, no-false-positive, and the stripped-key set; export-escape stays covered by the existing `journeyExport.test`). Conversion/tools: **160** (unchanged).
- `story:package:validate`: `eternal-return@1.3.0` `80f3d5a2…` (unchanged). `content:validate:runtime`: **8**. `content:validate:canon:strict`: **errors=0, warnings=6116, waived=31, expired=0**. `literary`/`slice`: valid against `eternal-return-literary-v1.0.2`.
- `build`: pass. `bundle:check`: **all budgets pass** — CSS **70.73 KiB / 13.37 KiB gzip** (unchanged; `@font-face` is inline in `index.html`, not in the bundled CSS), initial JS **631.33 KiB / 200.41 KiB gzip** (+~0.7 KiB from the sanitizer + footer link, well under budget), `publicSourceMapCount` **0**. `dist/_headers` and `dist/fonts/*.woff2` emitted; the built `index.html` has **zero** Google-Fonts references.
- **CSP app-compat verified:** the enforcing CSP (fetch directives) was injected as a `<meta>` into the built page and driven with sandbox Chromium — the app **boots with zero CSP violations** on the landing surface (script-src `'self'` + inline/runtime styles + self-hosted fonts all satisfied). The throwaway injection + config were reverted/deleted; dist rebuilt clean.
- Playwright via the throwaway sandbox-Chromium (1194) config (deleted, never committed): **10/10 representative specs passed, real exit code 0** — the full L1→L4 journey, missing-story recovery, WebGL→2D fallback, the WebGL-free linear-list journey, and the **axe accessibility audit** (landing/reader/dialogs/passage-list + forced-colours) which now covers the new footer **"Privacy"** link with **no serious/critical violations**.
- **Owner-gated (not fabricated):** applying `_headers` at the edge, the header checklist against the deployed/preview URL (`npm run headers:check`, external scanners), and the HSTS-preload submission at deploy (8.4). Their result table is in `docs/SECURITY_HEADERS.md`, filled when run.

## Batch 8.3 — Error monitoring and privacy-respecting observability ([#179](https://github.com/zekusmaximus/Narramorph/issues/179))

**Design proposed on the feature branch; awaiting owner decisions.** Design: **[PHASE_8_3_OBSERVABILITY.md](PHASE_8_3_OBSERVABILITY.md)**. Vendor settled in 8.1 (**Sentry, private CI-uploaded maps, opt-in, redacted**). Grounded audit: `handleError`/`ErrorBoundary` is the single choke point (Sentry TODO, transmits nothing today); leak surfaces are the `#/passage/:nodeId` URL hash, 10 `console.*` breadcrumb sites, and `localStorage` state — all scrubbed by a pure, unit-tested redaction layer. Bundle headroom is only ~14 KiB gzip, so the SDK is **lazy-loaded only after consent** (also a privacy win). Plan: pure `redactEvent`/`redactBreadcrumb` + a **redaction test** (the acceptance's "no sensitive content"), an additive `errorReportingConsent?` preference (default off, no save-schema bump), a consent toggle + "see what's sent" inspect view + an error-recovery "Report this problem" action, release tagging, hidden CI-only source maps that never publish, and the Sentry ingest host added to `connect-src`. Owner forks: (1) report-flow visibility (recommend toggle + contextual report); (2) capture scope (recommend errors-only for v1, no tracing/replay); (3) build-now-no-op-without-DSN (recommend yes). Owner-gated: the Sentry project + DSN + auth-token secret, and the injected-error observability test.

## Batch 8.4 — Deployment environments, versioning, and rollback

_Not started. Depends on the 8.1 host decision. Planned in-repo: app-version bump + release manifest tooling recording app↔package compatibility, immutable-hashed-asset/caching/redirect/404 config for the chosen host, release-notes + checksum tooling, and a one-command rollback script + runbook. Owner-gated: host/DNS provisioning, preview/staging/production environments, and the rollback rehearsal._

## Batch 8.5 — Production performance and resilience pass

_Not started. Planned in-repo: re-measure against the Phase 1 budgets (`config/performance-budgets.json`) and BASELINE, verify lazy story/3D loading, prefetch, caching, offline failure states, WebGL fallback, large histories, every ending, memory pressure, tab backgrounding, and long sessions; optimize only measured bottlenecks. The **service-worker/offline** decision (8.1 fork 4) is resolved here — do not add one automatically._
