/**
 * Opt-in, redacted error reporting (Batch 8.3).
 *
 * The Sentry SDK is **lazy-loaded only after the reader opts in** — it never rides in
 * the initial bundle (which has ~14 KiB gzip of headroom) and never loads for readers
 * who don't consent. Reporting is a no-op unless a build-time DSN is configured, so
 * the code ships inert until the owner provisions the Sentry project (ADR 0006: a
 * third-party client SDK is not a backend; its ingest host is an explicit
 * `connect-src` entry).
 *
 * All outgoing events pass through the pure redaction layer (errorRedaction.ts), and a
 * `consented` kill-switch in `beforeSend` guarantees nothing is transmitted while
 * consent is off — even if the SDK is already loaded.
 */

import { CURRENT_APP_VERSION } from '@/domain/progress/saveState';

import {
  redactBreadcrumb,
  redactEvent,
  type RedactableBreadcrumb,
  type RedactableEvent,
} from './errorRedaction';

const DSN = import.meta.env.VITE_SENTRY_DSN;
const RELEASE = import.meta.env.VITE_APP_RELEASE || `narramorph@${CURRENT_APP_VERSION}`;

// Only the capture function is retained (not the whole namespace), so there is no
// top-level reference to '@sentry/browser' — the SDK stays in its own lazily-loaded
// chunk. When no DSN is configured the dynamic import is dead-code-eliminated entirely.
let capture: ((error: unknown) => unknown) | null = null;
let consented = false;
let initializing: Promise<void> | null = null;

/** True only when a build-time DSN is present; otherwise reporting is fully inert. */
export function isErrorReportingConfigured(): boolean {
  return typeof DSN === 'string' && DSN.length > 0;
}

async function ensureInitialized(): Promise<void> {
  if (capture || !isErrorReportingConfigured()) {
    return;
  }
  if (!initializing) {
    initializing = import('@sentry/browser').then((Sentry) => {
      Sentry.init({
        dsn: DSN,
        release: RELEASE,
        sendDefaultPii: false,
        maxBreadcrumbs: 20,
        // Kill-switch: while consent is off, drop every event before it is sent.
        // The redaction layer uses local structural types (so it carries no SDK
        // reference); adapt to the SDK's signatures with a structural cast.
        beforeSend: (event) =>
          consented
            ? (redactEvent(event as unknown as RedactableEvent) as unknown as typeof event)
            : null,
        beforeBreadcrumb: (breadcrumb) =>
          redactBreadcrumb(breadcrumb as unknown as RedactableBreadcrumb),
      });
      capture = Sentry.captureException;
    });
  }
  await initializing;
}

/** Turns on reporting (loading + initialising the SDK on first opt-in). */
export async function enableErrorReporting(): Promise<void> {
  consented = true;
  await ensureInitialized();
}

/**
 * Turns off reporting. The SDK (if already loaded) stays resident but inert: the
 * `beforeSend` kill-switch drops everything while consent is off, so nothing is
 * transmitted.
 */
export function disableErrorReporting(): void {
  consented = false;
}

/** Whether the reader has consented in this session. */
export function isErrorReportingEnabled(): boolean {
  return consented;
}

/** Captures an error only when consent is on and the SDK is loaded; otherwise a no-op. */
export function reportError(error: unknown): void {
  if (!consented || !capture) {
    return;
  }
  capture(error);
}
