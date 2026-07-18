# Phase 8 execution record

Phase 8 converts a strong application into an **operable production service** — deployment host, security headers/CSP, error monitoring and privacy-respecting observability, a privacy policy, release versioning/manifests, a rollback procedure, and a final performance/resilience pass (roadmap Phase 8, batches 8.1–8.5). This document is the running evidence record (mirrors [PHASE_7_EXECUTION.md](PHASE_7_EXECUTION.md) and the earlier phase records); it is updated as batches land and the epic [#93](https://github.com/zekusmaximus/Narramorph/issues/93) is ticked only at merge.

**Status: Batches 8.1–8.5 — all in-repo work complete on the feature branch. The remaining Phase 8 items are owner-run operational gates (host provisioning, DNS/HSTS-preload, monitoring secrets + the injected-error test, the security-header checklist, the rollback rehearsal, and the real-hardware performance numbers) — each has a runbook + an empty result table, never fabricated.** 8.1 recorded the client-only architecture (ADR 0006) behind a scope-gate guard; 8.2 shipped the Cloudflare-Pages security headers/CSP, self-hosted Inter, save-import sanitization, the privacy policy, and the header checklist + verifier; 8.3 added opt-in, redacted error reporting (Sentry, lazy + DSN-gated), the redaction layer + test, the consent/inspect/report flow, private CI-only source maps, and the observability runbook; 8.4 bumped the app to **0.1.1** (freeze-respecting patch), added the release-manifest + checksum tooling, immutable-asset/HTML caching + `www→apex` redirects + a branded 404, a one-command rollback + save-safety test, and the deploy/rollback runbook; 8.5 re-confirmed **no service worker for v1** and added the resilience suite (optional-asset-failure readability, offline-after-load, backgrounding) with the perf re-measurement left to real-hardware CI. Phase 8 differs from Phase 7 in kind: much of it is **infrastructure- and owner-gated** (a deployment host, DNS/HSTS at the edge, a monitoring vendor + secrets, actual deploys) that an agent cannot self-provision. So every batch is split into **in-repo, agent-doable now** work and **owner/host-gated** decisions, and the gating decisions were surfaced _up front_ (8.1) because they cascade into 8.2–8.5. The owner accepted all four 8.1 recommendations: client-only (no backend), Cloudflare Pages, Sentry (opt-in, private maps, redacted), and no service worker for v1. No production/config code for a downstream batch is written until that batch's design is proposed and confirmed.

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
| Save schema / app | save `1.3.0` (`CURRENT_SAVE_VERSION`, frozen); app **`0.1.1`** (`CURRENT_APP_VERSION`, bumped in 8.4 from `0.1.0`) | `src/domain/progress/saveState.ts` |

**App-version-bump checklist (done in 8.4 — kept for the next bump):** the app version lives in `package.json`, `src/domain/progress/saveState.ts` (`CURRENT_APP_VERSION`), and `tools/conversion/lib/story-package.ts` (`CURRENT_APP_VERSION`) — all three must stay in lockstep (enforced by `src/scope/appVersionLockstep.test.ts`) and the app must stay inside the frozen package's `supportedAppRange` (`>=0.1.0 <0.2.0`), because `supportedAppRange` feeds the frozen `contentHash 80f3d5a2…`. 8.4 bumped all three `0.1.0 → 0.1.1` and updated the two current-version assertions (`storyStore.test.ts`, `e2e/phase-2-vertical-slice.spec.ts`). A bump to `0.2.0`+ would require re-cutting the package (moving the frozen hash) — out of scope for v1. The **save schema** stays `1.3.0` and the **package** identity stays `eternal-return@1.3.0`.

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

**Complete on the feature branch (the injected-error observability test is owner-run against the real Sentry project — its result table is present and filled only when run).** Design proposed before code: **[PHASE_8_3_OBSERVABILITY.md](PHASE_8_3_OBSERVABILITY.md)**. Vendor settled in 8.1 (**Sentry, private CI-uploaded maps, opt-in, redacted**). Grounded audit: `handleError`/`ErrorBoundary` is the single choke point; leak surfaces are the `#/passage/:nodeId` URL hash, 10 `console.*` breadcrumb sites, and `localStorage` state.

**Owner decisions (accepted):** (1) report flow = **settings toggle + contextual "Report this problem"**; (2) capture scope = **errors + release metadata only** (no tracing/replay); (3) **build now, no-op without a DSN**.

**What shipped (config/integration + docs; no content/package/save identity change):**

- **Redaction layer** — `src/utils/errorRedaction.ts` (`redactUrl`/`redactBreadcrumb`/`redactEvent`), pure and typed with **local structural types** so it carries **no** `@sentry/browser` reference. Strips the passage hash from URLs, drops console/network breadcrumbs, removes user/server identity + `extra`, and keeps only an allowlist of environment contexts. `errorRedaction.test.ts` is the offline **redaction acceptance** (8 tests): a synthetic event with a `#/passage/arch-L4` URL, console breadcrumb, prose `extra`, and a fake save is fully scrubbed while the error type + release survive.
- **Lazy, DSN-gated Sentry init** — `src/utils/errorReporting.ts` dynamic-imports `@sentry/browser` **only after consent**, wires `beforeSend` (with a `consented` kill-switch) + `beforeBreadcrumb`, sets the release, and retains only `captureException`. Because `import.meta.env.VITE_SENTRY_DSN` is statically replaced at build, **without a DSN the whole dynamic import is dead-code-eliminated** (SDK absent from the bundle). A build **with** a DSN isolates the SDK in a lazily-loaded `sentry-vendor` chunk (conditional `manualChunks`).
- **Consent + inspect + report** — additive `errorReportingConsent?` preference (default off; **no save-schema bump**), a `useErrorReportingConsent` sync hook (mounted in `Home`), a Settings toggle with a **"See exactly what a report would contain"** disclosure rendering a representative redacted payload (`buildSampleRedactedEvent`), and a **"Report this problem"** action in the top-level error fallback (shown only when a DSN is configured).
- **Private source maps** — `vite.config` emits **hidden** maps only under `SENTRY_UPLOAD=true`; `scripts/upload-sourcemaps.mjs` (`npm run sourcemaps:upload`) uploads them and **deletes every `.map` from `dist` before publish**. Default builds keep `publicSourceMapCount: 0`.
- **Ops** — the Sentry ingest hosts (`https://*.ingest.sentry.io`, `https://*.ingest.us.sentry.io`) added to `connect-src` in `public/_headers`; `docs/OBSERVABILITY.md` (what is/isn't captured, redaction guarantees, config, an alert-threshold/ownership table, and the injected-error test runbook + empty result table); `docs/PRIVACY.md` updated to describe the opt-in mechanism accurately.

### Gate evidence (local, Node 22, on the feature branch)

- `scope:check`: **OK — 157 first-party files, 0 network primitives** (the SDK lives in `node_modules`; its ingest host is an explicit `_headers` entry, not first-party `src/` egress). `type-check`: pass. `lint:ci`: **0 errors / 0 warnings**. `format:check`: clean.
- `test:run`: **458 app tests pass** (+8 over 8.2's 450 — `errorRedaction` 8). Conversion/tools: **160** (unchanged; no `tools/conversion` code touched).
- `story:package:validate`: `eternal-return@1.3.0` `80f3d5a2…` (unchanged). `content:validate:runtime`: **8**. `content:validate:canon:strict`: **errors=0, warnings=6116, waived=31, expired=0**. `literary`/`slice`: valid against `eternal-return-literary-v1.0.2`.
- `build`: pass. `bundle:check` (default, no-DSN): **all budgets pass** — initial JS **634.96 KiB / 201.55 KiB gzip**, CSS **70.73 KiB / 13.37 KiB gzip** (unchanged; the CSS from the new toggle was trimmed to reuse existing utilities), `publicSourceMapCount` **0**, **no orphan chunk**.
- **Lazy-loading verified both ways:** a **no-DSN** build dead-code-eliminates the SDK entirely (absent from every chunk); a **DSN** build produces a **345 KiB `sentry-vendor` lazy chunk** — dynamically imported, **not** in the entry's static graph, and the entry contains **no** SDK code; initial JS stays **635.65 KiB** (under budget).
- Playwright via the throwaway sandbox-Chromium (1194) config (deleted, never committed): **9/9 representative specs passed, real exit code 0** — the full L1→L4 journey, missing-story recovery, WebGL→2D fallback, and the **axe accessibility audit** which now covers the Settings **consent toggle + "what's sent"** disclosure with **no serious/critical violations**.
- **Follow-up focus-trap fix (CI, pre-merge):** protected-branch CI caught `e2e/accessibility-confidence.spec.ts` failing — the new "what's sent" `<details>` disclosure included a redundant privacy-policy `<a>` link that, while the disclosure is **collapsed**, still matched the focus trap's `[href]` selector (the trap filters only `inert`/`aria-hidden`, not visibility) yet couldn't receive focus, so Shift+Tab from the settings title landed back on the title instead of wrapping to the last control. Fix: **removed the in-disclosure link** (the footer **"Privacy"** link already covers it), leaving the always-focusable `<summary>` as the reliable last focusable; the accessibility spec now walks the new controls (summary ↔ consent ↔ Reduce motion, forward-wrap to Close). Re-verified: the spec is **1/1, real exit code 0** via the throwaway sandbox config (deleted); the full gate battery stays green and CSS drops to **70.73 KiB** (fewer utilities). No content/package/save identity moved.
- **Owner-gated (not fabricated):** the Sentry project + `VITE_SENTRY_DSN` + the `SENTRY_AUTH_TOKEN`/`ORG`/`PROJECT` CI secrets, the alert thresholds/ownership, and the **injected-error observability test** (the end-to-end half of the acceptance) — runbook + empty result table in `docs/OBSERVABILITY.md`.

## Batch 8.4 — Deployment environments, versioning, and rollback ([#180](https://github.com/zekusmaximus/Narramorph/issues/180))

**Complete on the feature branch (host provisioning + preview/staging + the rollback rehearsal are owner-run — the rehearsal result table is present and filled only when run).** Design proposed before code: **[PHASE_8_4_RELEASE_ROLLBACK.md](PHASE_8_4_RELEASE_ROLLBACK.md)**.

**Critical audit finding (changed the version decision):** the frozen package declares `supportedAppRange: ">=0.1.0 <0.2.0"`, and `supportedAppRange` **feeds the frozen `contentHash 80f3d5a2…`** (`manifestHashInput` hashes the full manifest). So a bump to `0.2.0` would (a) fail `story:package:validate` + the runtime loader ("app version outside the declared supported range"), and (b) require re-cutting the package to widen the range — moving the frozen hash, which the freeze forbids. The freeze-respecting bump is therefore a **patch within 0.1.x**.

**Owner decisions (accepted):** (1) **app version `0.1.0` → `0.1.1`** (patch inside the package's supported range; the owner confirmed after the finding above); (2) domain **narramorph.com** — apex canonical, `www → apex` 301. The **package/concordance/literary/save identities stay frozen — only the app version moved.**

**What shipped (config/tooling + docs; only the app version identity moved):**

- **App version bump `0.1.0` → `0.1.1`** across the three lockstep sites (`package.json`, `src/domain/progress/saveState.ts`, `tools/conversion/lib/story-package.ts`) + the two current-version assertions (`storyStore.test.ts`, `e2e/phase-2-vertical-slice.spec.ts`), guarded by a new **lockstep test** (`src/scope/appVersionLockstep.test.ts`) that fails if the three sites drift or the app leaves `>=0.1.0 <0.2.0`.
- **Release manifest + checksums** — `scripts/build-release-manifest.mjs` (`npm run release:manifest`) writes `output/release/release-manifest.json` (app version, story-package identity + `contentHash`, app↔package compatibility incl. an `appSatisfiesRange` check, concordance `c779795f…`, accepted literary `v1.0.2`, save schema `1.3.0`, build SHA from env, and per-asset sha256) + `output/release/SHA256SUMS`. Deterministic (no wall-clock).
- **Caching / redirects / 404** — `public/_headers` gains immutable `/assets/*` + `/fonts/*` and `no-cache` HTML; `public/_redirects` (`www.narramorph.com → narramorph.com` 301); a branded `public/404.html`. `.gitignore` updated so `_redirects`/`404.html` are tracked (Vite copies them to the deploy root). **Post-deploy correction (2026-07-18):** the site deploys as **Cloudflare Workers Static Assets**, whose `_redirects` accepts only relative, same-host URLs — the cross-host `www → apex` rule failed the first build (`Only relative URLs are allowed [code 100324]`). Fixed by removing that line and moving the canonical redirect to a **zone-level Redirect Rule** (the edge-native, host-agnostic approach); `_redirects` is now comment-only. Runbook updated in `docs/RELEASE_ROLLBACK.md` §1.
- **Rollback** — `scripts/rollback.mjs` (`npm run release:rollback`) prints the runbook (Cloudflare instant promote + git-revert source of truth) with the current release identity; `docs/RELEASE_ROLLBACK.md` is the deploy+rollback runbook (Cloudflare linking settings, env/secrets, release process, the rollback steps, and the owner-run **rollback-rehearsal** result table). **Save safety** is proven by `src/domain/progress/rollbackSafety.test.ts` (a newer/older app-version save loads under the current app with progress intact; the frozen schema never changes) — the "rollback without corrupting local saves" acceptance.
- **Reproducibility** — `scripts/verify-reproducible.mjs` (`npm run release:verify`) builds twice and compares asset hashes. `CHANGELOG.md` records the `0.1.1` release.

### Gate evidence (local, Node 22, on the feature branch)

- `scope:check`: **OK — 157 first-party files, 0 network primitives**. `type-check`: pass. `lint:ci`: **0 errors / 0 warnings**. `format:check`: clean.
- `test:run`: **463 app tests pass** (+5 over 8.3's 458 — `appVersionLockstep` 2, `rollbackSafety` 3). Conversion/tools: **160** (unchanged; the `story-package.ts` app-version bump keeps the suite green).
- `story:package:validate`: `eternal-return@1.3.0` `80f3d5a2…` — **`0.1.1` satisfies `>=0.1.0 <0.2.0`** (unchanged package identity). `content:validate:runtime`: **8**. `content:validate:canon:strict`: **errors=0, warnings=6116, waived=31, expired=0**. `literary`/`slice`: valid against `eternal-return-literary-v1.0.2`.
- `build`: pass. `bundle:check`: **all budgets pass** — CSS **70.73 KiB** (unchanged), initial JS **634.96 KiB**, `publicSourceMapCount` **0** (the new `_headers`/`_redirects`/`404.html` sit at the deploy root, outside the measured `dist/assets`). `release:manifest`: **46 assets checksummed, `appSatisfiesRange=true`**.
- Playwright via the throwaway sandbox-Chromium (1194) config (deleted, never committed): **5/5 representative specs passed, real exit code 0** — the Phase-2 vertical slice (now asserting the exported journey's **`appVersion 0.1.1`** end-to-end) on desktop + mobile, plus the L1→L4 journey, missing-story recovery, and WebGL→2D fallback.
- **Owner-gated (not fabricated):** linking the Cloudflare Pages project to narramorph.com (build `npm run build`, output `dist`), PR-preview + protected-staging environments, the HSTS-preload submission, and the **rollback rehearsal** — settings + empty result table in `docs/RELEASE_ROLLBACK.md`.

## Batch 8.5 — Production performance and resilience pass ([#181](https://github.com/zekusmaximus/Narramorph/issues/181))

**Complete on the feature branch (the real throttled LCP/CLS numbers + the budget pass/waiver are owner/CI-run on real hardware — the results table is present and filled only when run).** Design proposed before code: **[PHASE_8_5_PERFORMANCE.md](PHASE_8_5_PERFORMANCE.md)**.

**Owner decision (accepted):** **no service worker for v1** (re-confirms 8.1). Fast repeat loads already come from 8.4's immutable CDN caching; a SW's update-lifecycle complexity isn't justified without an offline-reading goal. The app still works offline within a loaded session.

**Grounded audit — most of 8.5 was already covered; 8.5 verified the mapping and filled the gaps:**

| 8.5 concern | Coverage |
| --- | --- |
| Budgets on throttled mid-range device (LCP/CLS/interaction) | `e2e/performance-boundaries.spec.ts` — real numbers **environment-limited in the sandbox**, run on real hardware in CI |
| Lazy story/3D loading; opening graph excludes 3D/content | `performance-boundaries` + `bundle:check` (initial JS **634.96 / 700 KiB**) |
| Every ending reachable | `e2e/phase-3-path-coverage.spec.ts` |
| WebGL fallback; missing-story recovery | `e2e/reader-journey.spec.ts` |
| Viewport / responsive / 200% / reduced motion | `e2e/responsive-experience.spec.ts` |
| Large history bound | `src/domain/progress/visitEvents.test.ts` (the `VISIT_EVENT_LOG_LIMITS` count/byte cap drops the oldest — cited, not re-added) |
| **Readable when optional assets fail; offline; backgrounding** | **new** `e2e/resilience.spec.ts` |

**What shipped (test + docs; no runtime change):** `e2e/resilience.spec.ts` — (1) the reader stays readable when the **self-hosted fonts fail** (system-font fallback), (2) the **2D reader stays readable when the optional 3D chunk fails** to load, (3) **already-loaded content stays readable offline** (open a passage → load its lazy chunk → go offline → re-open reads from the module cache; a _not-yet-loaded_ chunk still needs the network — the honest no-SW offline behavior), and (4) the reader **survives tab backgrounding** (`visibilitychange`) without losing the open passage. No bundle-side bottleneck exists (initial JS well under budget; story/3D/Sentry all lazy), so nothing was optimized without a measurement (per "optimize only measured bottlenecks").

### Gate evidence (local, Node 22, on the feature branch)

- `scope:check`: **OK — 157 files, 0 network primitives** (the new spec is in `e2e/`, out of the `src/` scope-gate). `type-check`: pass. `lint:ci`: **0 errors / 0 warnings**. `format:check`: clean.
- `test:run`: **463** (unchanged — 8.5 adds an e2e spec, not unit tests). Conversion/tools: **160** (unchanged).
- `story:package:validate` / `content:validate:runtime` / `canon:strict` / `literary` / `slice`: unchanged and valid (8.5 touches no content; `eternal-return@1.3.0` `80f3d5a2…`, app stays `0.1.1`).
- `build`: pass. `bundle:check`: **all budgets pass** — initial JS **634.96 KiB**, CSS **70.73 KiB**, `publicSourceMapCount` **0** (unchanged; no runtime change).
- Playwright via the throwaway sandbox-Chromium (1194) config (deleted, never committed): the new **`resilience` spec is 4/4, real exit code 0** (fonts-fail readable, 3D-chunk-fail readable, offline-after-load, backgrounding). These are functional (not LCP-measuring), so they run truthfully in the sandbox.
- **Owner/CI-gated (not fabricated):** the real throttled/device **LCP/CLS/interaction numbers** against `config/performance-budgets.json` + [BASELINE](BASELINE.md), and the **budget pass/waiver** — the `performance-boundaries` harness runs on real hardware in protected-main CI; the results table below is filled when run.

### Performance re-measurement (owner/CI-run on real hardware — not fabricated)

| Date | Profile | LCP (ms) | CLS | Story interaction (ms) | Map interaction (ms) | Budget met? | Waiver / notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| _pending_ | desktop (1440×900, 1× CPU) |  |  |  |  |  |  |
| _pending_ | mid-range mobile (412×915, 4× CPU, Slow 4G) |  |  |  |  |  |  |
