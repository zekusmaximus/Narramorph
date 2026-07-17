/**
 * Redaction layer for error reports (Batch 8.3).
 *
 * These are pure functions, independent of the Sentry runtime, so the guarantee that
 * **no sensitive reading content leaves the device** is unit-tested offline (see
 * errorRedaction.test.ts — the acceptance's "no sensitive reading content" half).
 *
 * What must never be transmitted (roadmap Batch 8.3): story prose, journey history,
 * local-save data, URLs containing user data (the `#/passage/:nodeId` reading
 * position), and browser storage. The app attaches none of these to reports; these
 * functions are defense-in-depth over whatever the SDK collects by default.
 */

/**
 * Local structural types (not imported from `@sentry/browser`) so the redaction layer
 * — which is reachable from the initial bundle via the settings "what's sent" preview —
 * carries NO reference to the SDK. The SDK is referenced only by the dynamic import in
 * errorReporting.ts, keeping it in its own lazily-loaded chunk. errorReporting adapts
 * these to Sentry's `beforeSend`/`beforeBreadcrumb` signatures with a structural cast.
 */
export interface RedactableBreadcrumb {
  category?: string;
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface RedactableEvent {
  request?: {
    url?: string;
    cookies?: unknown;
    data?: unknown;
    headers?: unknown;
    query_string?: unknown;
    [key: string]: unknown;
  };
  user?: unknown;
  server_name?: unknown;
  extra?: unknown;
  breadcrumbs?: RedactableBreadcrumb[];
  contexts?: Record<string, unknown>;
  [key: string]: unknown;
}

/** Contexts safe to keep (environment/runtime facts, never reading data). */
const ALLOWED_CONTEXT_KEYS = new Set(['app', 'browser', 'os', 'device', 'runtime', 'trace']);

/**
 * Strips a URL to origin + pathname — dropping the hash (which carries the reader's
 * current passage, `#/passage/:nodeId`) and any query string.
 */
export function redactUrl(url: string | undefined): string | undefined {
  if (!url) {
    return url;
  }
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    // Relative or opaque reference: drop everything from the first # or ?.
    return url.replace(/[#?].*$/, '');
  }
}

/**
 * Drops console/network breadcrumbs (which can carry prose, node IDs, or request
 * detail) and strips reading-position URLs from navigation breadcrumbs.
 */
export function redactBreadcrumb(breadcrumb: RedactableBreadcrumb): RedactableBreadcrumb | null {
  const category = breadcrumb.category ?? '';
  if (category === 'console' || category === 'xhr' || category === 'fetch') {
    return null;
  }
  if (category === 'navigation' && breadcrumb.data) {
    return {
      ...breadcrumb,
      data: {
        ...breadcrumb.data,
        from: redactUrl(breadcrumb.data.from as string | undefined),
        to: redactUrl(breadcrumb.data.to as string | undefined),
      },
    };
  }
  return breadcrumb;
}

/**
 * Scrubs an outgoing error event: strips user-bearing URLs, request bodies/cookies/
 * headers, user/server identity, any `extra` (the app attaches none, so nothing app
 * state could ride in), and all but an allowlist of environment contexts; redacts
 * breadcrumbs. The error type, message, stack, and release survive so the report is
 * still actionable.
 */
export function redactEvent(event: RedactableEvent): RedactableEvent {
  const redacted: RedactableEvent = { ...event };

  if (redacted.request) {
    const request = { ...redacted.request };
    request.url = redactUrl(request.url);
    delete request.cookies;
    delete request.data;
    delete request.headers;
    delete request.query_string;
    redacted.request = request;
  }

  delete redacted.user;
  delete redacted.server_name;
  delete redacted.extra;

  if (Array.isArray(redacted.breadcrumbs)) {
    redacted.breadcrumbs = redacted.breadcrumbs
      .map(redactBreadcrumb)
      .filter((crumb): crumb is RedactableBreadcrumb => crumb !== null);
  }

  if (redacted.contexts) {
    const filtered: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(redacted.contexts)) {
      if (ALLOWED_CONTEXT_KEYS.has(key)) {
        filtered[key] = value;
      }
    }
    redacted.contexts = filtered;
  }

  return redacted;
}

/**
 * Builds a representative **redacted** report for the reader-facing "see what would
 * be sent" view. It starts from a payload that deliberately contains a reading-
 * position URL, a console breadcrumb, an `extra`, and a fake save blob, then runs
 * the same redaction the SDK uses — so the reader sees exactly what survives.
 */
export function buildSampleRedactedEvent(): RedactableEvent {
  const sample: RedactableEvent = {
    level: 'error',
    platform: 'javascript',
    release: 'narramorph@<app-version>',
    environment: 'production',
    exception: {
      values: [{ type: 'TypeError', value: 'Example: an interface error (never story prose).' }],
    },
    request: { url: 'https://example.invalid/reader#/passage/arch-L4?visit=3' },
    user: { id: 'would-be-removed', ip_address: '{{auto}}' },
    breadcrumbs: [
      { category: 'console', level: 'log', message: 'would-be-removed console line' },
      { category: 'navigation', data: { from: '/#/passage/algo-L1', to: '/#/passage/algo-L2' } },
      { category: 'ui.click', message: 'button.settings' },
    ],
    extra: { save: '{would-be-removed local save blob}', prose: 'would-be-removed passage text' },
    contexts: {
      browser: { name: 'Firefox', version: '140' },
      state: { progress: 'would-be-removed' },
    },
  };

  return redactEvent(sample);
}
