# Phase 8.3 — Error monitoring and privacy-respecting observability

**Status: design proposed; awaiting owner decisions. No production/config code has been written.**

Batch 8.3 adds **release-tagged error reporting** with source maps stored privately, a **redaction layer** that guarantees story prose, journey history, saves, browser storage, and user-bearing URLs are never transmitted, an **opt-in consent + inspect flow**, and alert-threshold/ownership docs (roadmap Batch 8.3). The vendor and consent model were settled in 8.1: **Sentry, private (CI-uploaded, never-published) source maps, opt-in (default off), hard redaction.**

Acceptance gate (roadmap): _a deliberately injected production-like error appears with correct release metadata and no sensitive reading content._

Config/integration + docs only. Per ADR 0002 no authored runtime prose; per ADR 0001 no dependency on P or M; per ADR 0006 this is a **third-party client SDK, not a backend** — it is governed by the consent + redaction rules here and, being in `node_modules`, is outside the `src/` scope-gate (its ingest host is added to `connect-src` in `_headers`).

---

## 1. Grounded current-state audit (branch base + 8.1/8.2 on the feature branch)

- **Single error choke point.** `src/utils/errorHandler.ts` `handleError(error, context?)` is the one reporting hook; `ErrorBoundary.componentDidCatch` routes React errors through it with a `componentStack`. Its production branch is `console.error` + a `// TODO: Integrate with Sentry` note — it transmits nothing today. This is where the (lazy, consented) Sentry capture attaches.
- **No global handlers yet.** There is no `window.onerror`/`onunhandledrejection` wiring; Sentry's default integrations would add them.
- **Leak surfaces to redact:**
  - **URL hash** `#/passage/:nodeId` (`useReaderRoute`) reveals the reader's current passage — a reading-position signal. Any transmitted URL (event request URL, navigation breadcrumbs) must be stripped to origin + path.
  - **Console breadcrumbs** — 10 `console.*` sites in `src/` (mostly dev-gated) would become Sentry breadcrumbs by default; they can carry node IDs / error detail. Console + network breadcrumbs are dropped.
  - **App state** — progress, preferences, and the visit-event log (resolved prose) live in `localStorage`; **none is attached** to reports, and `localStorage`/`sendDefaultPii` are never captured.
- **Bundle headroom is tight.** `initialJsGzipBytes` budget is 220,000 and current is ~205,220 — about **14 KiB gzip of headroom**. `@sentry/browser` is ~20 KiB+ gzip, so it **cannot** ride in the initial bundle. It must be **lazy-loaded only after consent** (a dynamic import) — which also means the SDK never loads for readers who don't opt in.
- **Source maps.** `vite.config.ts` sets `sourcemap: false` with a comment reserving private-map upload for a future monitor; `bundle:check` enforces `publicSourceMapCount: 0`. 8.3 honours both.

---

## 2. In-repo vs. owner-gated split

| Work | In-repo (agent-doable now) | Owner-gated |
| --- | --- | --- |
| Redaction layer | Pure `redactEvent` / `redactBreadcrumb` + a **redaction test** (the acceptance's "no sensitive content") — testable without a live DSN | — |
| Consent + inspect flow | Additive `errorReportingConsent` preference (default off), a Settings toggle, a "see what would be sent" view, and a "Report this problem" action in the error-recovery UI | — |
| Lazy Sentry init | A module that dynamic-imports `@sentry/browser` **only after consent**, wires the redaction hooks, sets the release, and is a **no-op without `VITE_SENTRY_DSN`** | The **DSN** (build-time env) + the **Sentry project** |
| Release tagging | `release` = app version + build SHA, threaded from build env | — |
| Private source maps | `vite.config` hidden-map option behind a build flag + a CI upload/cleanup script (`scripts/upload-sourcemaps.mjs`) that deletes maps before publish | The **auth-token secret**, running it in CI |
| Ops | `connect-src` ingest host in `_headers`; alert-threshold/ownership runbook | The alert **thresholds/owner** specifics; the **injected-error observability test** against the real project |

---

## 3. Plan

### 3.1 Redaction layer (the acceptance core — built + tested now)

Pure functions independent of the SDK, so the "no sensitive reading content" guarantee is unit-tested offline (`errorRedaction.test.ts`):

- `redactUrl(url)` → origin + pathname only (drops `#/passage/...` hash and any query).
- `redactEvent(event)`:
  - `event.request.url` → `redactUrl`; drop `request.data`, `request.cookies`, `request.headers`, `request.query_string`.
  - `event.user` → removed; `event.server_name` → removed.
  - `event.breadcrumbs` → each through `redactBreadcrumb`.
  - Assert-and-strip: remove any `extra`/`contexts` we did not explicitly allow (defense-in-depth so a save or prose object can never ride along).
- `redactBreadcrumb(bc)`: drop `console`, `xhr`, and `fetch` categories; for `navigation`, `redactUrl` the `from`/`to`.
- Sentry init options that pair with it: `sendDefaultPii: false`, `defaultIntegrations` trimmed (no `Breadcrumbs({console})`, no `GlobalHandlers` capturing extra), `beforeSend: redactEvent`, `beforeBreadcrumb: redactBreadcrumb`, `maxBreadcrumbs` low, **no** session replay, **no** performance tracing (see fork §4.2).

The **redaction test** feeds a synthetic event carrying a `#/passage/arch-L4` URL, a console breadcrumb, a prose-bearing `extra`, and a fake save blob, and asserts all are gone while the error type/release survive.

### 3.2 Consent + inspect + report flow

- **`errorReportingConsent?: boolean`** added to `UserPreferences` — additive and defaulted (absent → **off**), so **no save-schema bump** (mirrors `lineHeight?` / `includeAdaptationNotesInExport?`).
- **Settings toggle** — "Help improve reliability by sending anonymous, redacted crash reports" (off), with a link to the "what's sent" view and to `docs/PRIVACY.md`.
- **"See what would be sent"** — a small view rendering a representative **redacted** report so the reader can inspect exactly what leaves the device (satisfies the roadmap's "inspect what will be sent").
- **Report flow** — the `ErrorBoundary` recovery UI gains "Report this problem"; it shows the redacted payload and only sends on explicit action (and only if consent is on, else it offers to turn it on).
- Turning consent on lazy-loads + inits Sentry; turning it off calls `close()` and stops capture.

### 3.3 Release tagging + private source maps

- **Release** = `${appVersion}+${shortSha}` (app version from the existing constant; SHA from build env), set on Sentry init so events carry correct release metadata (the acceptance).
- **Source maps** — `vite.config` emits **hidden** maps only when `SENTRY_UPLOAD=true` (default stays `false`, so `bundle:check`'s `publicSourceMapCount: 0` keeps passing locally). CI, with the auth token, runs `scripts/upload-sourcemaps.mjs` to upload the maps to Sentry and **delete them from `dist` before publish**. No maps are ever served.

### 3.4 Ops

- Add the Sentry **ingest host** to `connect-src` in `public/_headers` (the one deliberate egress; recorded as the reason it's allowed).
- `docs/OBSERVABILITY.md` — what is/ isn't captured, the redaction guarantees, alert thresholds + owner (owner fills specifics), and the **injected-error test runbook** with an empty result table.

---

## 4. Owner forks — decisions needed before 8.3 code

### 4.1 Report-flow visibility — **Recommend: settings toggle + contextual report action**

| Option | Consequence |
| --- | --- |
| **A. Toggle + "Report this problem" in error recovery (recommended)** | Matches the roadmap's "support/report flow"; readers can report a crash they just hit, after inspecting the redacted payload. Still opt-in per send. |
| B. Settings toggle only | Simplest; but a reader who hits a crash has no in-context way to help, and useful reports are rarer. |

### 4.2 Scope of capture — **Recommend: errors only for v1**

| Option | Consequence |
| --- | --- |
| **A. Errors + release metadata only (recommended)** | Minimum necessary for operations; smallest data surface and bundle; no tracing/replay. |
| B. Also Web Vitals / performance tracing | More operational insight, but more data collected and more SDK weight; conflicts with the privacy-minimal posture. Can be added post-v1 if needed. |

### 4.3 Build-now vs. wait for the Sentry project — **Recommend: build now, no-op without a DSN**

Implement the redaction layer + test, consent/inspect/report UI, lazy init, release tagging, and the CI map script **now**, all gated so that without `VITE_SENTRY_DSN` nothing initialises and nothing is sent. This satisfies the offline acceptance (the redaction test) and makes the owner's later step just "create the Sentry project, set the DSN + auth-token secret, run the injected-error test."

---

## 5. Gate mapping

- _Injected error appears with correct release metadata and no sensitive reading content_ → the offline **redaction test** proves the "no sensitive content" half deterministically; the **owner-run injected-error test** (runbook + empty table in `docs/OBSERVABILITY.md`) proves the end-to-end half against the real project after the DSN is set.
- All standing gates stay green: the SDK is lazy/consented so `bundle:check` initial budgets hold; `scope:check` stays 0 (the SDK lives in `node_modules`, and its ingest host is an explicit `_headers` entry, not first-party `src/` egress); `errorReportingConsent` is additive/defaulted so no save-schema or package identity moves.

Once §4 is answered I implement **8.3's in-repo pieces**, run the full gate battery, commit, and **stop for confirmation before Batch 8.4**.
