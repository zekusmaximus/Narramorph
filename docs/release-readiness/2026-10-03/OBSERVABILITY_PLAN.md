# Opt-in observability and source-map completion

Owner roles: technical maintainer and privacy/operations owner. Priority: P1 before enabling a production DSN. Estimate: 2–3 engineering days plus account configuration. Findings: R03/R04; existing issue #179.

## The privacy contract needs implementation evidence

The default build is inert and the SDK is lazy. Preserve both. However, `redactEvent` spreads the input event and keeps arbitrary messages, exception values, tags, nested context values, stack-frame URLs, and UI breadcrumb text. A synthetic reading-data marker survives those channels. Existing tests cover selected fields, not the complete outgoing payload.

The installed Sentry 10.68.0 SDK includes `BrowserSession` by default. Session envelopes bypass the error `beforeSend` hook; `disableErrorReporting` only flips a boolean. The [Sentry SDK issue describing this boundary](https://github.com/getsentry/sentry-javascript/issues/22261) also demonstrates why an error-only hook cannot prove an all-transmissions consent guarantee. No real reader data was transmitted during this review.

## OBS-01 — Enforce consent at every transmission boundary

Files: `src/utils/errorReporting.ts`, its tests, settings/report action, privacy/observability documentation.

1. Choose an explicit minimal integration allowlist for error reporting. Disable session tracking, client reports, automatic UI/console/network breadcrumbs, replay, tracing, and performance capture unless separately authorized. Browser defaults must not silently widen the product's telemetry scope.
2. Add a final transport/envelope consent gate suitable for the pinned SDK. It must reject every envelope type while consent is off, including queued sessions/client reports, and prevent a delayed initialization from re-enabling reporting after revocation.
3. On revocation, synchronously disable capture/transport before any asynchronous cleanup. Do not flush buffered reports after consent is withdrawn. Detach automatic handlers or disable/close the client safely; retain explicit tests for re-enabling without duplicate handlers.
4. Reset failed initialization state so a failed dynamic import can be retried after a deliberate new enable action. Handle rejection without breaking the reader or pretending the reporting toggle succeeded. Cover rapid on→off, on→off→on, import failure, and in-flight initialization.
5. Observe actual browser requests/envelopes against a local test receiver. Before opt-in, there must be no SDK chunk fetch or telemetry request. After revocation, there must be no new telemetry request, even on navigation, page hiding, error capture, or queued delivery. Requests already sent before revocation cannot be recalled; describe that limit accurately.

Acceptance: configured and unconfigured builds pass the whole lifecycle, including all envelope types. No-DSN behavior remains fully inert and reading never depends on monitoring availability.

## OBS-02 — Make redaction an allowlist

Build a fresh output object rather than retaining unknown input properties. Allow only reviewed fields: event identity/time, release, coarse platform information, a stable application error code/type, and sanitized stack coordinates needed for private resolution. Drop arbitrary exception/message strings or map known errors to fixed messages; they can contain passage text or imported-save fragments. Normalize stack filenames to approved asset paths without query/hash and exclude frame variables/context/source text.

Keep no automatic DOM label or breadcrumb text that can contain a passage title, selected text, node ID, or state. If operational breadcrumbs are needed, emit fixed categories such as `reader.open` without reading identifiers. Validate nested fields individually; an allowed context name is not permission to retain arbitrary values beneath it.

Use synthetic sentinels in all fields and in serialized **complete envelopes**, including tags, exception arrays, unknown fields, breadcrumbs, URLs, and nested contexts. Verify absence of prose/save/journey/position markers after SDK processing, not just in a hand-built sample. Tests must also demonstrate that a useful fixed error code and stack can survive.

Change “See exactly what a report would contain” to an accurate example label unless it displays the actual pending redacted report. Align `PRIVACY.md`, `OBSERVABILITY.md`, the accessibility statement if affected, and UI copy. `sendDefaultPii:false` controls attached data; the recipient necessarily sees network connection metadata such as IP addresses. Describe provider processing/retention accurately rather than promising that IP is never transmitted.

## OBS-03 — Connect private map upload to the release artifact

Files: `scripts/upload-sourcemaps.mjs`, root package/lockfile, release workflow, runbook.

- Pin a supported Sentry CLI/plugin in the lockfile. Eliminate unlocked `npx @sentry/cli`. Require an exact release identifier and explicit org/project configuration when monitoring is selected.
- Choose and implement one documented map association path for the selected SDK/CLI: release/asset URL association or injected debug IDs. Include required rewriting/injection steps and verify a real captured exception resolves to the correct TypeScript line. Merely observing a successful upload is insufficient.
- Perform any asset mutation before final checksums and packaging. Upload privately, remove maps recursively, then run budget/map/provenance checks and generate the immutable public archive. Keep private map inputs in a restricted, short-lived job workspace/artifact only when operationally necessary.
- Missing credentials or failed upload must fail an enabled-monitoring release. Cleanup runs even after failure, but cleanup errors also fail; the current broad catch cannot count an unreadable directory as safe. A deliberate disabled-monitoring release uses the no-DSN/no-map branch and records that choice.

The review proved build and cleanup with a synthetic DSN and **no upload credentials**; it did not prove private upload or symbolication.

## OBS-04 — Provision and rehearse operations

Record the actual project, allowed ingest origin/CSP, access owner, support contact, retention setting, environment/release labels, and tested alert route in the existing runbook. Use minimal credentials scoped to release upload. Proposed starting policy: 15-day error retention, immediate notification for save-loss/recovery failures, and a grouped alert for three matching unexpected crashes in ten minutes; the owner must choose these settings and record the implemented values.

Inject a controlled application error through the real report hook on staging after explicit test consent. Record receipt, redaction, correct release/stack, alert delivery, acknowledgment, and revocation network evidence. Remove the injection from the production artifact. Use an external static-site availability check for availability; opt-in error counts have no representative session denominator and cannot establish a crash-free-user rate or uptime SLO.

Acceptance: the release record contains real operational results or explicitly states monitoring is disabled. Never fill owner-run tables with inferred success.
