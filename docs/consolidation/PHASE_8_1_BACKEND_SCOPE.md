# Phase 8.1 — Backend decision, scope gate, and the up-front Phase-8 decisions

**Status: owner decisions accepted (2026-07-17); 8.1 in-repo piece implemented and gate-green. Batch 8.2 awaits its own design + confirmation.**

Batch 8.1's own job is small and decisive: **make the backend decision and close the scope gate** so the rest of Phase 8 builds on a settled architecture (roadmap Batch 8.1; acceptance gate: _there is no ambiguous half-backend in the release architecture_). But Phase 8 is different in kind from Phase 7 — much of it is **infrastructure- and owner-gated** — and three later decisions (host, monitoring, service worker) **cascade** into how 8.2–8.5 are even scoped. This doc therefore does two things:

1. Records the grounded audit and the **backend recommendation** (8.1's actual deliverable), and
2. **Surfaces all four up-front decisions now**, each with a recommendation, so the owner can settle them before any 8.2–8.5 code is written.

This is a design/decision document. Per ADR 0002 it contains no authored runtime prose. Per ADR 0001, N never depends on P or M at build/runtime; nothing here changes that.

---

## 1. Grounded current-state audit

Verified on the branch base `dbd68aa` (Phase 7 merge, PR #176) by direct reads and mechanical grep — not assumed.

### 1.1 The app already makes zero network calls

There is **no** network primitive anywhere in `src/` (excluding tests):

```
grep -rnE "\bfetch\(|axios|XMLHttpRequest|new WebSocket|navigator\.sendBeacon|EventSource" src/
  → (no matches)
```

- **No API base URL, no auth, no server-side analytics.** There is no `VITE_API*` variable; the only runtime env references are dev-mode toggles (`import.meta.env.DEV`, `process.env.NODE_ENV`) and the single feature flag `VITE_ENABLE_3D` (`src/pages/Home.tsx`). `.env.example` contains only `VITE_ENABLE_3D=false`.
- **Persistence is local-only.** Progress, preferences, and the export-grade visit-event log live in `localStorage` (see `docs/VISIT_HISTORY_PRIVACY.md`); export is a user-initiated local download (`downloadTextFile`). Nothing is uploaded. This is already the ADR 0001 §7 posture ("V1 remains a static, client-side product with local persistence").
- **Client-side error containment already exists.** `react-error-boundary` wraps the app and the 2D/3D surfaces (`src/App.tsx`, `src/pages/Home.tsx`); the WebGL path falls back to 2D on error.
- **The only dormant hook is for _observability_, not a backend.** `src/utils/errorHandler.ts` has a `handleError()` whose production branch is `console.error` plus a `// TODO: Integrate with Sentry, LogRocket, etc.` comment. That is a Batch **8.3** integration point, not a backend/API assumption — it transmits nothing today. `src/utils/performanceMonitor.ts` is a dev-only console singleton.
- **The build already anticipates monitoring safely.** `vite.config.ts` sets `sourcemap: false` with a comment that a future monitoring integration must upload **private** maps in CI and remove them before publishing `dist`. `bundle:check` enforces `publicSourceMapCount: 0`.

### 1.2 What this means for the scope gate

There is **no half-backend to remove** — the codebase is already client-only. "Closing the scope gate" is therefore mostly a matter of (a) **recording the decision** as an ADR so it is not silently re-opened, and (b) adding a small **guard** so a network primitive cannot be introduced later without a deliberate, reviewed choice. The heavier lift in Phase 8 is the _operational_ layer (host, headers, monitoring, release/rollback), not backend removal.

### 1.3 What v1 does **not** need a backend for

| Capability sometimes assumed to need a server | How v1 delivers it client-only |
| --- | --- |
| Saving progress | `localStorage` save with schema versioning + migrations (save `1.3.0`) |
| Sharing / exporting a journey | Local Markdown / print-HTML download; machine-readable JSON save import/export |
| "Accounts" across devices | Out of scope for v1 (ADR 0001 §7); a save file is the portable artifact |
| Analytics | Not required for v1; coarse, opt-in, redacted vitals only if 8.3 owner opts in |
| Content delivery | Static hashed assets from a CDN host (Batch 8.4) — no application server |

---

## 2. In-repo vs. owner-gated split for Batch 8.1

| Work | In-repo (agent-doable now) | Owner-gated |
| --- | --- | --- |
| Record the client-only decision | ADR **0006** "V1 ships client-only (no backend)" + update ADR 0001 cross-ref, `RELEASE_STATUS.md` Deployment row, and the roadmap status | The **decision itself** (confirm client-only, or commission a backend program) |
| Remove dormant API assumptions | None to remove (audit found none); keep the `errorHandler` TODO, re-scoped to 8.3 | — |
| Close the gate so it stays closed | A **scope-gate check** (a unit test / small CI script) that fails if a disallowed network primitive (`fetch`/`axios`/`XHR`/`sendBeacon`/WebSocket/`EventSource`) appears in `src/` outside an allowlist | Approval that this guard is desired (recommended) |
| Keep the static release independent | Note in the release docs that any future service is a separate, post-v1 program | — |

None of this is written until the owner confirms the backend fork (§3.1).

---

## 3. The four up-front decisions (owner forks)

These are surfaced together, now, because **they cascade**: the host determines how CSP/headers/rollback are configured (8.2/8.4); the monitoring choice determines whether 8.3 writes a redaction layer or only local diagnostics; the service-worker choice changes 8.5's resilience scope. Each fork has a clear recommendation.

### 3.1 Backend decision (this batch's gate) — **Recommend: client-only, no backend for v1**

| Option | What it means | Consequence |
| --- | --- | --- |
| **A. Client-only (recommended)** | Ship v1 as a static, client-side app with local persistence. Record the decision; add the scope-gate guard. | Matches ADR 0001 §7 and the charter. Unblocks 8.2–8.5 immediately. Lowest cost/risk/attack-surface. |
| B. Real backend program | Accounts, cloud sync, social sharing, paid access, or server-side analytics. | A **separate multi-phase program**: its own threat model, data model, privacy plan, auth plan, migration strategy, and cost/ops estimate. Do **not** revive P's Mongo server as-is. Phase 8 would pause on the static track only where it must. |

**Recommendation: A.** The audit shows the product is already fully client-only and loses nothing by declaring it. If any single item in B is a hard v1 requirement, say which — that turns into a scoped program, and nothing else in Phase 8 should assume a "half-backend" in the meantime.

### 3.2 Deployment host (Batch 8.4, but decided now) — **Recommend: Cloudflare Pages**

CSP/headers, preview deploys, caching/redirects/404, and rollback are all configured _per host_, so 8.2 and 8.4 cannot start until this is chosen.

| Host | Custom headers/CSP | PR previews | Rollback | Notes |
| --- | --- | --- | --- | --- |
| **Cloudflare Pages (recommended)** | `_headers` + `_redirects` files, committed | Yes | Instant "rollback to deployment" | Generous free tier; strong edge caching; HSTS at the edge; no vendor lock-in in the repo (plain files) |
| Netlify | `_headers`/`_redirects` or `netlify.toml`, committed | Yes | One-click redeploy of a prior deploy | Very similar DX; slightly smaller free bandwidth |
| Vercel | `vercel.json` headers | Yes | Promote a prior deployment | Excellent DX; config is Vercel-shaped (some lock-in); framework-oriented |
| GitHub Pages | **No per-response custom headers** (CSP only via `<meta>`, weaker) | No native PR previews | Redeploy prior artifact | Simplest, but the weak header story hurts 8.2's security-header gate |

**Recommendation: Cloudflare Pages** — committed plain-text `_headers`/`_redirects` keep the security config **in the repo and host-portable**, PR previews satisfy 8.4, and instant rollback satisfies the 8.4 rollback gate. Netlify is an equally acceptable second choice with near-identical committed-file ergonomics; GitHub Pages is discouraged because it cannot send real security headers (this directly weakens the 8.2 acceptance gate). **The owner must also decide whether there is a custom domain** (needed for HSTS preload/DNS decisions in 8.2/8.4) or whether v1 launches on the host's default subdomain.

### 3.3 Error monitoring vendor + consent model (Batch 8.3) — **Recommend: Sentry, private maps, opt-in, hard redaction**

| Option | What it means | Consequence |
| --- | --- | --- |
| **A. Sentry + opt-in consent + redaction (recommended)** | Release-tagged error reports; source maps uploaded privately in CI (never published); a redaction layer strips prose, journey history, saves, storage, and user-bearing URLs; reporting is **opt-in** and the reader can inspect what will be sent. | Meets the 8.3 gate (injected error appears with release metadata and **no** sensitive reading content). Adds a vendor + secret + a shipped SDK (watch the JS budget). |
| B. No vendor — local-only diagnostics | Keep errors client-side (an in-app "copy diagnostics" the reader can attach to a bug report); no transmission. | Zero new data-flow, zero vendor, strongest privacy. But no aggregate production visibility; the 8.3 "injected error appears in monitoring" gate becomes "appears in the local diagnostic," owner-run. |
| C. Other vendor (GlitchTip self-host, Rollbar, …) | Same shape as A with a different provider. | Fine if the owner has a preference; the redaction layer is vendor-agnostic. |

**Recommendation: A**, but **B is a legitimate, more-private choice** and is easy to start with (it needs no secrets and no vendor). Because reading prose, journey history, saves, and user-bearing URLs must **never** be transmitted regardless of vendor, the redaction layer + redaction test is built the same way in A and C. The consent model recommendation is **opt-in** (privacy-respecting default off), not opt-out.

### 3.4 Service worker / offline (Batch 8.5) — **Recommend: do NOT add one for v1**

| Option | Consequence |
| --- | --- |
| **A. No service worker for v1 (recommended)** | Avoids the well-known SW update/version-skew complexity (stale-app bugs, cache-busting a hashed-asset app that already caches well at the CDN). The reader still gets fast repeat loads from immutable hashed assets + HTTP caching. |
| B. Add a service worker / offline cache | True offline reading, but adds an update-lifecycle surface, a "new version available" UX, and a rollback interaction with 8.4. Only worth it if offline reading is a stated v1 goal. |

**Recommendation: A.** The roadmap explicitly says _do not add one automatically_; 8.5 will re-confirm this against measured caching behavior. If offline reading is a v1 goal, choose B and we scope the update lifecycle deliberately in 8.5.

---

## 4. Proposed 8.1 implementation (only after owner confirms §3.1 = A)

Small, in-repo, gate-clean:

1. **ADR 0006 — "V1 ships client-only (no backend)."** Records the decision, the audit evidence, the "backend = separate program" boundary, and the guard below. Cross-linked from ADR 0001.
2. **Scope-gate guard.** A unit test (Vitest) — or a tiny `scripts/check-no-network.mjs` wired into the validate battery — that scans `src/` for disallowed network primitives and fails on introduction, with a documented allowlist mechanism for a future deliberate exception. This _keeps the gate closed_ without a backend.
3. **Doc updates.** `RELEASE_STATUS.md` Deployment/operations row and the roadmap execution-status note reflect the settled client-only architecture; `PHASE_8_EXECUTION.md` records the gate evidence.
4. **Full gate battery** (type-check; lint:ci 0/0; test:run; story/runtime/canon-strict/literary/slice validation; build; bundle:check; Playwright real exit code) — captured, not assumed. No contract identity moves; no dependency on P.

**Not in 8.1:** headers/CSP (8.2), the monitoring SDK (8.3), host config + versioning/rollback (8.4), and the performance/SW pass (8.5). Those wait on §3.2–§3.4.

---

## 5. Owner forks — decision summary (accepted)

The owner accepted all four recommendations on 2026-07-17.

| # | Decision | Recommendation | Owner decision | Blocks |
| --- | --- | --- | --- | --- |
| 1 | Backend for v1 | **Client-only, no backend** | **Accepted** (ADR 0006) | 8.1 gate; everything downstream |
| 2 | Deployment host (+ custom domain?) | **Cloudflare Pages** (Netlify 2nd) | **Accepted** — Cloudflare Pages; custom-domain sub-decision still open (carried into 8.2) | 8.2 headers, 8.4 deploy/rollback |
| 3 | Error-monitoring vendor + consent | **Sentry, private maps, opt-in, redacted** (or B: local-only) | **Accepted** — Sentry, private maps, opt-in, hard redaction | 8.3 scope |
| 4 | Service worker / offline | **No SW for v1** | **Accepted** — no SW for v1 | 8.5 resilience scope |

**8.1 implemented (in-repo piece only, §4):** ADR 0006 records the client-only decision; the scope-gate guard (`scripts/check-no-network.mjs` + `src/scope/noBackendNetwork.test.ts` + `npm run scope:check`) keeps it closed; `RELEASE_STATUS.md` reflects the settled architecture. The full gate battery is green and the evidence is recorded in [`PHASE_8_EXECUTION.md`](PHASE_8_EXECUTION.md) (Batch 8.1). Per the Phase 7 rhythm, Batch 8.2 (security headers + privacy, Cloudflare-Pages-specific) is **proposed and confirmed before any 8.2 code** — this program stops here for owner confirmation before proceeding.
