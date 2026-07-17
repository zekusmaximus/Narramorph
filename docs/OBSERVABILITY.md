# Observability and error monitoring

Narramorph is a static, client-side app (ADR 0006). Its only telemetry is **opt-in, redacted error reporting** via Sentry (Batch 8.3) — off by default, and **fully inert unless a build-time DSN is configured**. Sentry is a third-party client SDK, not a backend; its ingest host is an explicit `connect-src` entry in [`public/_headers`](../public/_headers).

## What is and isn't captured

| Captured (only after opt-in) | Never captured / transmitted |
| --- | --- |
| Error type, message, and stack trace | Story prose / passage text |
| Release identity (`narramorph@<version>+<sha>`) | Journey history, progress, or the visit-event log |
| Coarse environment (browser/OS) | Saved-journey data or any `localStorage` |
| Benign UI breadcrumbs (e.g. a click category) | The reading-position URL hash (`#/passage/:nodeId`) — stripped to origin + path |
| — | Console/network breadcrumbs, cookies, request bodies, IP/user identity (`sendDefaultPii: false`) |

Redaction is enforced by the pure, unit-tested layer in [`src/utils/errorRedaction.ts`](../src/utils/errorRedaction.ts) (`errorRedaction.test.ts` — the "no sensitive reading content" acceptance) and applied in the SDK's `beforeSend`/`beforeBreadcrumb` hooks. A `consented` kill-switch drops every event while consent is off, even if the SDK is already loaded.

## Consent model

- **Off by default.** `errorReportingConsent` is an additive, defaulted preference (absent → off; no save-schema change).
- **Settings toggle** — "Send anonymous crash reports", with an inline **"See exactly what a report would contain"** view rendering a representative _redacted_ payload, and a link to [`PRIVACY.md`](PRIVACY.md).
- **Error-recovery report action** — the top-level error screen offers a one-tap "Report this problem" (redacted) when a DSN is configured; consented readers' crashes are reported automatically.
- The Sentry SDK is **lazy-loaded only after opt-in**, so it never rides in the initial bundle and never loads for readers who don't consent.

## Configuration (owner-gated)

| Variable | Where | Purpose |
| --- | --- | --- |
| `VITE_SENTRY_DSN` | build-time env | The Sentry DSN. **Absent → reporting is fully inert.** |
| `VITE_APP_RELEASE` | build-time env (CI) | Release identity, e.g. `narramorph@0.1.0+<sha>`. Defaults to `narramorph@<app-version>`. |
| `SENTRY_UPLOAD` | CI build env | `true` emits **hidden** source maps for upload (default off keeps `publicSourceMapCount: 0`). |
| `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT` | CI secrets | Used by `npm run sourcemaps:upload` to upload maps privately, then **delete them from `dist` before publish**. |

Source maps are never published: CI builds with `SENTRY_UPLOAD=true`, runs `sourcemaps:upload` (upload + delete), then deploys. `bundle:check` enforces `publicSourceMapCount: 0`.

## Alerting and ownership (owner to complete)

| Item                                  | Value     |
| ------------------------------------- | --------- |
| Sentry organization / project         | _pending_ |
| Alert: new-issue notification channel | _pending_ |
| Alert: error-rate spike threshold     | _pending_ |
| On-call / responsible owner           | _pending_ |
| Data retention window                 | _pending_ |

## Injected-error observability test (owner-run — the acceptance)

Proves the end-to-end half of the gate (_a deliberately injected production-like error appears with correct release metadata and no sensitive reading content_). Run after the DSN + project exist.

1. Build a production bundle with `VITE_SENTRY_DSN`, `VITE_APP_RELEASE`, and `SENTRY_UPLOAD=true`; run `npm run sourcemaps:upload`; deploy (or serve the built `dist`).
2. Open the app, opt in via **Settings → Send anonymous crash reports**.
3. Trigger a deliberate error (e.g. a throwaway button that throws, or `throw` from the console).
4. In Sentry, confirm the event shows the **correct release** and a resolved stack (private maps), and verify the payload contains **no** prose, journey/save data, `localStorage`, or a `#/passage/...` URL — only origin + path.
5. Toggle consent **off** and repeat step 3; confirm **no** event is sent.

### Results (owner-run — filled in when run; not fabricated)

| Date | Release | Event appeared | Stack resolved (maps) | No sensitive content | Suppressed when consent off | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| _pending_ |  |  |  |  |  |  |
