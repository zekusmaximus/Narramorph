# ADR 0006: V1 ships client-only (no backend)

- Status: Accepted
- Date: July 17, 2026
- Decision owners: repository/product owner and the product consolidation program
- Related: [ADR 0001 §7](0001-repository-boundaries.md) (which reserved this decision for a future ADR)

## Context

ADR 0001 §7 established that "V1 remains a static, client-side product with local persistence" and that "a backend requires a future ADR and is not inherited from Project-Leibniz." Roadmap Batch 8.1 is that decision: it makes the backend call and closes the scope gate so nothing in Phase 8 assumes an ambiguous half-backend (Batch 8.1 acceptance gate: _there is no ambiguous half-backend in the release architecture_).

A grounded audit of the branch base `dbd68aa` (Phase 7 merge) confirms the product is already fully client-only:

- **Zero network calls in first-party code.** No `fetch`/`axios`/`XMLHttpRequest`/`WebSocket`/ `navigator.sendBeacon`/`EventSource` anywhere in `src/`; no API base URL; no auth; no server-side analytics. The only runtime env references are dev toggles and the `VITE_ENABLE_3D` feature flag.
- **Local-only persistence.** Progress, preferences, and the export-grade visit-event log live in `localStorage`; export is a user-initiated local download. Nothing is uploaded (see [`docs/VISIT_HISTORY_PRIVACY.md`](../VISIT_HISTORY_PRIVACY.md)).
- **The only dormant hook is for observability, not a backend** — a `// TODO: Integrate with Sentry` note in `src/utils/errorHandler.ts` that transmits nothing today (a Batch 8.3 concern).

The owner confirmed the client-only recommendation in the Phase 8.1 up-front decisions (recorded in [`PHASE_8_EXECUTION.md`](../consolidation/PHASE_8_EXECUTION.md), Batch 8.1).

## Decision

1. **V1 ships client-only.** No backend, no accounts, no cloud save/sync, no social-sharing server, no paid-access server, and no server-side analytics are in the v1 critical path.
2. **Persistence stays local.** `localStorage` with schema versioning and migrations (save `1.3.0`); sharing and export are local file downloads. Nothing is transmitted off the device.
3. **First-party code introduces no network egress.** A scope-gate guard (`scripts/check-no-network.mjs`, `npm run scope:check`, enforced in the test suite via `src/scope/noBackendNetwork.test.ts`) fails the gate battery if a network primitive appears in `src/` outside a deliberately reviewed allowlist. The allowlist is empty for v1; any addition is a reviewable diff with a recorded reason.
4. **Any future backend is a separate, post-v1 program** requiring its own ADR — a threat model, data model, privacy plan, authentication plan, migration strategy, and cost/operations estimate. It does **not** revive Project-Leibniz's Express/Mongo server as-is (ADR 0001 §7, ADR 0005).
5. **The static release schedule stays independent** of any hypothetical post-v1 service.
6. **A third-party client SDK that transmits is not a backend.** The Batch 8.3 error-monitoring transport is governed by the 8.3 opt-in-consent and redaction rules; because it lives in `node_modules` it is outside the `src/` scope-gate. Reader prose, journey history, saves, browser storage, and user-bearing URLs must never be transmitted regardless.

## Consequences

### Positive

- Lowest attack surface and no custody of reader personal data on any server.
- Cheap, cache-friendly static hosting (Batch 8.4) with no application server to operate or scale.
- Aligns with ADR 0001 §7 and the product charter; unblocks Batches 8.2–8.5 with a settled architecture.

### Costs

- No cross-device sync in v1; the portable artifact is a save file the reader exports/imports.
- Adding cloud features later is a full, separately-scoped program, not an incremental change.

## Rejected alternatives

- Revive Project-Leibniz's Express/Mongo backend for v1 (ADR 0001 §7, ADR 0005).
- Add a "thin" serverless backend solely for save storage (unnecessary given local persistence; adds PII custody, auth, and privacy obligations for no v1 requirement).
- Server-side analytics (not required for v1; any telemetry is client-side, opt-in, and redacted per 8.3).

## Verification

Implemented when: this decision is recorded; the scope-gate guard is green in the gate battery and would fail on an introduced network primitive; `RELEASE_STATUS.md` states the client-only architecture; and no first-party network egress exists in `src/`.

## Related records

- [ADR 0001: repository boundaries](0001-repository-boundaries.md)
- [ADR 0005: Project-Leibniz rejected architectures](0005-project-leibniz-rejected-architectures.md)
- [Product charter](../PRODUCT_CHARTER.md)
- [Phase 8.1 design proposal](../consolidation/PHASE_8_1_BACKEND_SCOPE.md)
- [Phase 8 execution record](../consolidation/PHASE_8_EXECUTION.md)
- [Local visit-history privacy](../VISIT_HISTORY_PRIVACY.md)
