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
 * The SDK is configured for error reports only: session tracking (which would send a
 * session envelope on every route change, outside `beforeSend`) and client reports are
 * off. All outgoing events pass through the pure redaction layer (errorRedaction.ts),
 * and the transport itself is gated on consent, so no envelope of any type leaves the
 * device while consent is off — even if the SDK is already loaded or has queued work.
 * Envelopes sent before consent was withdrawn cannot be recalled.
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

/** Structural subset of the SDK transport, so this module holds no SDK type reference. */
export interface GatedTransport<Envelope> {
  send(envelope: Envelope): PromiseLike<{ statusCode?: number }>;
  flush(timeout?: number): PromiseLike<boolean>;
}

/**
 * Wraps a transport so every envelope (errors, sessions, client reports, anything the
 * SDK queues) is dropped unless `isConsented()` is true at the moment it would be sent.
 */
export function gateTransportOnConsent<Envelope>(
  transport: GatedTransport<Envelope>,
  isConsented: () => boolean,
): GatedTransport<Envelope> {
  return {
    send: (envelope) => (isConsented() ? transport.send(envelope) : Promise.resolve({})),
    flush: (timeout) => transport.flush(timeout),
  };
}

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
        // Error reports only. BrowserSession sends a session envelope on load and on
        // every history change (each passage open), bypassing beforeSend.
        integrations: (defaults) =>
          defaults.filter((integration) => integration.name !== 'BrowserSession'),
        sendClientReports: false,
        // Final consent gate covering every envelope type, including queued ones.
        transport: (options) =>
          gateTransportOnConsent(Sentry.makeFetchTransport(options), () => consented),
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
    // A failed SDK download must not wedge reporting: clear it so a later opt-in retries.
    initializing.catch(() => {
      initializing = null;
    });
  }
  await initializing;
}

/**
 * Turns on reporting (loading + initialising the SDK on first opt-in). Never rejects:
 * if the SDK cannot load, reading continues and a later call retries.
 */
export async function enableErrorReporting(): Promise<void> {
  consented = true;
  try {
    await ensureInitialized();
  } catch {
    // Reporting stays unavailable for now; the reader is unaffected.
  }
}

/**
 * Turns off reporting synchronously. The SDK (if already loaded) stays resident but
 * inert: the transport gate and the `beforeSend` kill-switch drop everything while
 * consent is off, including anything already queued, so nothing more is transmitted.
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
