# Phase 8 execution record

Phase 8 converts a strong application into an **operable production service** — deployment host, security headers/CSP, error monitoring and privacy-respecting observability, a privacy policy, release versioning/manifests, a rollback procedure, and a final performance/resilience pass (roadmap Phase 8, batches 8.1–8.5). This document is the running evidence record (mirrors [PHASE_7_EXECUTION.md](PHASE_7_EXECUTION.md) and the earlier phase records); it is updated as batches land and the epic [#93](https://github.com/zekusmaximus/Narramorph/issues/93) is ticked only at merge.

**Status: Batch 8.1 — design proposed on the feature branch; awaiting owner decisions before any production/config code.** Phase 8 differs from Phase 7 in kind: much of it is **infrastructure- and owner-gated** (a deployment host, DNS/HSTS at the edge, a monitoring vendor + secrets, actual deploys) that an agent cannot self-provision. So every batch is split into **in-repo, agent-doable now** work and **owner/host-gated** decisions, and the gating decisions are surfaced _up front_ (8.1) because they cascade into 8.2–8.5. No production/config code is written until the owner answers the 8.1 forks.

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

**Design proposed on the feature branch; awaiting owner decisions.** The design and the up-front Phase-8 decision forks are in **[PHASE_8_1_BACKEND_SCOPE.md](PHASE_8_1_BACKEND_SCOPE.md)**: a grounded current-state audit (the app makes **zero network calls** — no `fetch`/`axios`/`XHR`/`sendBeacon`/ WebSocket/`EventSource` anywhere in `src/`, no API base URL, no auth), the recommendation to **ship v1 client-only with no backend**, and the four cascading decisions the owner must make now because they cascade into 8.2–8.5:

1. **Backend (8.1):** recommended **client-only, no backend** for v1.
2. **Deployment host (8.4, decided early):** recommended **Cloudflare Pages** (with the trade-offs vs. Netlify / Vercel / GitHub Pages laid out) — CSP/headers, preview deploys, and rollback all depend on it.
3. **Error monitoring vendor + consent model (8.3):** recommended **Sentry, self-hosted-maps, opt-in consent**, with strict redaction (prose, journey history, saves, user-bearing URLs must never be transmitted) — or **no vendor** (local-only diagnostics) if the owner prefers.
4. **Service worker / offline (8.5):** recommended **do not add one for v1** (value vs. update-complexity); revisit post-v1.

**Acceptance gate (8.1):** there is no ambiguous half-backend in the release architecture.

Implementation of 8.1's _in-repo_ piece (record the client-only decision; remove any dormant API assumptions; a small scope-gate test/CI check that fails if a network primitive is introduced) proceeds only after the owner confirms. Gate evidence recorded here when it lands.

## Batch 8.2 — Security headers, privacy, and data minimization

_Not started. Depends on the 8.1 host decision (headers are host-specific) and the client-only confirmation. Planned in-repo: CSP/referrer/permissions/frame/MIME header config as committed host files, a security-header checklist, Markdown + imported-story-package sanitization with malicious-link/HTML/ oversized/prototype-pollution tests, a data inventory, and the production privacy policy + reset/deletion instructions._

## Batch 8.3 — Error monitoring and privacy-respecting observability

_Not started. Depends on the 8.1 monitoring-vendor + consent decision. Planned in-repo: release-tagged error reporting integration with a **redaction layer + redaction test** (prose, journey history, saves, user-bearing URLs, storage never transmitted), a user-inspectable report flow, and alert-threshold/ ownership docs. Owner-gated: the vendor account/secrets and the injected-error observability test._

## Batch 8.4 — Deployment environments, versioning, and rollback

_Not started. Depends on the 8.1 host decision. Planned in-repo: app-version bump + release manifest tooling recording app↔package compatibility, immutable-hashed-asset/caching/redirect/404 config for the chosen host, release-notes + checksum tooling, and a one-command rollback script + runbook. Owner-gated: host/DNS provisioning, preview/staging/production environments, and the rollback rehearsal._

## Batch 8.5 — Production performance and resilience pass

_Not started. Planned in-repo: re-measure against the Phase 1 budgets (`config/performance-budgets.json`) and BASELINE, verify lazy story/3D loading, prefetch, caching, offline failure states, WebGL fallback, large histories, every ending, memory pressure, tab backgrounding, and long sessions; optimize only measured bottlenecks. The **service-worker/offline** decision (8.1 fork 4) is resolved here — do not add one automatically._
