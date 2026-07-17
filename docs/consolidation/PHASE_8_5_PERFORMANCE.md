# Phase 8.5 — Production performance and resilience pass

**Status: design proposed; awaiting owner confirmation. No code has been written.**

Batch 8.5 is the final Phase 8 batch: re-measure against the Phase 1 budgets on throttled networks / mid- range devices, verify lazy loading, caching, offline-failure states and the WebGL fallback, test large histories / every ending / backgrounding / long sessions, optimize **only measured** bottlenecks, and resolve the service-worker question (roadmap Batch 8.5).

Acceptance gate (roadmap): _all budgets pass or have explicit owner-approved waivers; the product remains readable when optional assets fail._

Test/measurement + docs; no runtime change unless a real measurement identifies a bottleneck. Per ADR 0002 no authored runtime prose; per ADR 0001 no dependency on P or M; content/package/save identities stay frozen (the app version stays at `0.1.1`).

---

## 1. Grounded current-state audit (branch base + 8.1–8.4 on the feature branch)

Much of 8.5's scope is **already covered** by the Phase 1 / Phase 7 suites — 8.5 verifies the mapping and fills the gaps rather than rebuilding it.

| 8.5 concern | Existing coverage | Gap 8.5 fills |
| --- | --- | --- |
| Budgets on throttled mid-range device (LCP/CLS/interaction) | `e2e/performance-boundaries.spec.ts` (desktop + 412×915 at 4× CPU + Slow-4G) | Real numbers are **environment-limited in this sandbox** — run on real hardware in CI (below) |
| Lazy story/3D loading; opening graph excludes 3D/content | `performance-boundaries` (asserts the opening graph has no `NarromorphCanvas`/`variations`) + `bundle:check` (initial JS **634.96 / 700 KiB** budget) | — (healthy; re-confirm) |
| Every ending reachable | `e2e/phase-3-path-coverage.spec.ts` (each ending via a deterministic path) | — |
| WebGL fallback | `e2e/reader-journey.spec.ts` (WebGL loss → 2D) | — |
| Missing-story recovery | `reader-journey.spec.ts` (retryable recovery) | — |
| Viewport changes / responsive / 200% / reduced motion | `e2e/responsive-experience.spec.ts` | — |
| Large history bound | `VISIT_EVENT_LOG_LIMITS` caps the visit log (≤1,000 events / ~2 MB prose) | A load/perf test at the cap |
| **Product remains readable when optional assets FAIL** | partial (WebGL loss only) | **New**: the 3D chunk or fonts failing to load |
| **Offline failure states** | none | **New**: the app makes zero network calls, so it works offline once loaded — assert it |
| Memory pressure / tab backgrounding / long sessions | none automated | Lightweight backgrounding/visibility check; the rest is owner/manual |

**Bundle health:** initial JS is **634.96 KiB / 200 KiB gzip** against a **700 KiB / 220 KiB** budget; story content, the 3D view, and the (opt-in) Sentry SDK are all separate lazy chunks. There is no measured bundle-side bottleneck to optimize.

**Offline property (important):** the app makes **zero network calls of its own** (the scope-gate guard), so once its assets are loaded it runs entirely offline. Without a service worker there is **no offline _reload_** (the browser's offline page appears if the reader reloads with no connection) — that is the accepted consequence of the 8.1 no-SW decision, re-confirmed here.

---

## 2. In-repo vs. owner-gated split

| Work | In-repo (agent-doable now) | Owner-gated |
| --- | --- | --- |
| Resilience tests | Optional-asset-failure readability (block the 3D chunk / fonts), offline-after-load, a large-history load test | — |
| Coverage mapping | The matrix above, kept in the execution record | — |
| Re-measurement | The `performance-boundaries` harness + a documented protocol + a results table | Running it on **real hardware / a throttled network / a mid-range device** and recording the numbers |
| Budgets | Confirm the offline gates hold; note the sandbox limit | **Budget pass/waiver** on real numbers (owner-approved if a budget is missed) |
| Service worker | Re-confirm the no-SW decision + rationale | Confirm (§4) |

---

## 3. Plan

### 3.1 New resilience tests (the concretely-verifiable acceptance)

- **Optional-asset failure → still readable** (`e2e`, new): with the landing loaded, `route.abort()` the `NarromorphCanvas` chunk and confirm the 2D reader still opens a passage and reads (the 3D toggle degrades to the WebGL/loader fallback, never blocking the 2D critical path); separately, `route.abort()` the `/fonts/*.woff2` and confirm text still renders (system-font fallback via the `@font-face` stack).
- **Offline after load** (`e2e`, new): load the app, `context.setOffline(true)`, then open a passage and navigate — it works because there are no first-party network calls. Documents the "offline failure state" honestly (offline _reload_ is out of scope without a SW).
- **Large history** (unit or e2e): seed a save at/near `VISIT_EVENT_LOG_LIMITS` and confirm it loads and the progress/reader remain responsive (bounds the pathological-revisit case).
- **Backgrounding/visibility** (lightweight): a check that a `visibilitychange` to hidden and back does not break the reader or lose state.

### 3.2 Re-measurement (owner/CI-run — the budget half of the acceptance)

The `performance-boundaries` spec is the harness; it measures LCP/CLS + map/story interaction against `config/performance-budgets.json` (desktop LCP 3 s; mid-range mobile LCP 8 s at 4× CPU + Slow-4G) and against the [BASELINE](BASELINE.md). **In this sandbox the LCP measurement is CPU-contention-limited (~13 s), so the budget assertions only run truthfully on real hardware** — they run in protected-main CI's browser matrix. 8.5 records a results table for the real numbers (owner/CI-filled, not fabricated).

### 3.3 Service worker — re-confirm **no SW for v1** (§4.1)

Repeat loads are already fast: immutable, content-hashed assets cache for a year at the CDN (8.4), and the app is small and client-only. A service worker would add an update-lifecycle surface (stale-app bugs, a "new version" UX, a rollback interaction with 8.4) for the marginal benefit of offline _reload_ — which is not a stated v1 goal. Re-confirm the 8.1 decision: **no service worker for v1.**

### 3.4 Optimize only measured bottlenecks

There is no bundle-side bottleneck (initial JS is well under budget; everything heavy is lazy). Any runtime optimization waits on a **real** measurement showing a specific budget miss — none is invented here.

---

## 4. Owner forks — decision needed before 8.5 code

### 4.1 Service worker / offline — **Recommend: re-confirm NO service worker for v1**

| Option | Consequence |
| --- | --- |
| **A. No SW for v1 (recommended; re-confirms 8.1)** | Fast repeat loads from immutable CDN caching; no update-lifecycle complexity. **No offline reload** — a reader who reloads with no connection sees the browser's offline page. |
| B. Add a service worker / offline cache | True offline reading + reload, but adds an update-lifecycle surface and a rollback interaction with 8.4. Only worth it if offline reading is a v1 goal. |

The **budget pass/waiver** is not a fork now — it is decided against real CI/device numbers; if a budget is missed there, that becomes an owner-approved waiver or a targeted optimization at that point.

---

## 5. Gate mapping

- _All budgets pass or have owner-approved waivers_ → `performance-boundaries` + `bundle:check` (offline budgets already pass); the throttled LCP/CLS numbers are owner/CI-run against real hardware, recorded in a results table (waiver only if a real run misses a budget).
- _Product remains readable when optional assets fail_ → the new optional-asset-failure + offline-after-load tests in the gate battery, plus the standing WebGL-fallback and missing-story-recovery specs.
- All standing gates stay green; **no content/package/save identity moves** (the app stays at `0.1.1`).

Once §4.1 is confirmed I implement **8.5's in-repo pieces** (the new resilience tests + the re-measurement record + the no-SW re-confirmation), run the full gate battery, commit, and report — completing Phase 8's in-repo work (the remaining Phase 8 items are the owner-run deploy/measurement/rehearsal gates).
