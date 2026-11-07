/**
 * Redaction layer for error reports (Batch 8.3).
 *
 * These are pure functions, independent of the Sentry runtime, so the guarantee that
 * **no sensitive reading content leaves the device** is unit-tested offline (see
 * errorRedaction.test.ts — the acceptance's "no sensitive reading content" half).
 *
 * What must never be transmitted (roadmap Batch 8.3): story prose, journey history,
 * local-save data, URLs containing user data (the `#/passage/:nodeId` reading
 * position), and browser storage. The app attaches none of these to reports. The
 * outgoing event is rebuilt from an allowlist of reviewed fields, so anything else the
 * SDK collects, now or in a future version, is dropped by default.
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
  message?: unknown;
  exception?: {
    values?: { value?: unknown; [key: string]: unknown }[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Passage, variation, and ending identifiers (`arch-L2-accept`, `algo-L3-001`,
 * `hum-L1-001-b0-return`, `final-release`). Some app errors interpolate the node being
 * loaded, which would reveal the reading position.
 */
const STORY_IDENTIFIER_PATTERN =
  /\b(?:(?:arch|algo|hum|conv)-L[1-4]|final-(?:preserve|transform|release))(?:-[A-Za-z0-9]+)*\b/g;

/** Replaces story identifiers in error text with a fixed placeholder. */
export function redactStoryIdentifiers(text: string): string {
  return text.replace(STORY_IDENTIFIER_PATTERN, '[passage]');
}

/** Longest error message kept; anything longer is truncated. */
const MAX_MESSAGE_LENGTH = 300;

/**
 * Scrubs free-form error text: story identifiers become `[passage]`, URLs are cut to
 * origin + path, and everything from the first to the last double quote becomes
 * `"[…]"`. `JSON.parse` and similar errors quote fragments of their input, such as an
 * imported save, and those fragments can contain quotes of their own, so pairing
 * quotes would leak the text between pairs. The result is truncated to a fixed length.
 */
export function redactMessage(text: string): string {
  const scrubbed = redactStoryIdentifiers(text)
    .replace(/[a-z][a-z0-9+.-]*:\/\/[^\s"'<>()]+/gi, (url) => redactUrl(url) ?? '')
    .replace(/"[\s\S]*"/, '"[…]"');
  return scrubbed.length > MAX_MESSAGE_LENGTH
    ? `${scrubbed.slice(0, MAX_MESSAGE_LENGTH)}…`
    : scrubbed;
}

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

type Scalar = string | number | boolean;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Copies only the named fields whose values are strings, numbers, or booleans. */
function pickScalars(value: unknown, keys: readonly string[]): Record<string, Scalar> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const picked: Record<string, Scalar> = {};
  for (const key of keys) {
    const field = value[key];
    if (typeof field === 'string' || typeof field === 'number' || typeof field === 'boolean') {
      picked[key] = field;
    }
  }
  return Object.keys(picked).length > 0 ? picked : undefined;
}

/** Top-level event fields kept verbatim: identity, timing, and release labels only. */
const EVENT_FIELDS = [
  'event_id',
  'timestamp',
  'platform',
  'level',
  'environment',
  'release',
  'dist',
] as const;

/** Environment contexts and the fields kept inside each (coarse facts only). */
const CONTEXT_FIELDS: Readonly<Record<string, readonly string[]>> = {
  browser: ['name', 'version'],
  os: ['name', 'version'],
  device: ['family'],
  runtime: ['name', 'version'],
  trace: ['trace_id', 'span_id'],
};

/** Stack-frame fields needed to resolve a frame against private source maps. */
const FRAME_SCALARS = ['function', 'lineno', 'colno', 'in_app'] as const;
const FRAME_URLS = ['filename', 'abs_path'] as const;

function redactFrames(stacktrace: unknown): { frames: Record<string, Scalar>[] } | undefined {
  if (!isRecord(stacktrace) || !Array.isArray(stacktrace.frames)) {
    return undefined;
  }
  const frames = stacktrace.frames.filter(isRecord).map((frame) => {
    const kept: Record<string, Scalar> = pickScalars(frame, FRAME_SCALARS) ?? {};
    for (const key of FRAME_URLS) {
      const url = frame[key];
      if (typeof url === 'string') {
        kept[key] = redactUrl(url) ?? '';
      }
    }
    return kept;
  });
  return { frames };
}

function redactException(exception: unknown): RedactableEvent['exception'] {
  if (!isRecord(exception) || !Array.isArray(exception.values)) {
    return undefined;
  }
  const values = exception.values.filter(isRecord).map((entry) => {
    const kept: Record<string, unknown> = {};
    if (typeof entry.type === 'string') {
      kept.type = redactMessage(entry.type);
    }
    if (typeof entry.value === 'string') {
      kept.value = redactMessage(entry.value);
    }
    const mechanism = pickScalars(entry.mechanism, ['type', 'handled']);
    if (mechanism) {
      kept.mechanism = mechanism;
    }
    const stacktrace = redactFrames(entry.stacktrace);
    if (stacktrace) {
      kept.stacktrace = stacktrace;
    }
    return kept;
  });
  return values.length > 0 ? { values } : undefined;
}

function redactContexts(contexts: unknown): Record<string, unknown> | undefined {
  if (!isRecord(contexts)) {
    return undefined;
  }
  const kept: Record<string, unknown> = {};
  for (const [name, fields] of Object.entries(CONTEXT_FIELDS)) {
    const picked = pickScalars(contexts[name], fields);
    if (picked) {
      kept[name] = picked;
    }
  }
  return Object.keys(kept).length > 0 ? kept : undefined;
}

/** Debug-ID images, which tie minified frames to privately uploaded source maps. */
function redactDebugMeta(debugMeta: unknown): Record<string, unknown> | undefined {
  if (!isRecord(debugMeta) || !Array.isArray(debugMeta.images)) {
    return undefined;
  }
  const images = debugMeta.images.filter(isRecord).map((image) => {
    const kept: Record<string, Scalar> = pickScalars(image, ['type', 'debug_id']) ?? {};
    if (typeof image.code_file === 'string') {
      kept.code_file = redactUrl(image.code_file) ?? '';
    }
    return kept;
  });
  return images.length > 0 ? { images } : undefined;
}

/** Breadcrumb categories that may be sent, each reduced to fields that carry no content. */
const UI_BREADCRUMB_CATEGORIES = new Set(['ui.click', 'ui.input']);
const BREADCRUMB_SCALARS = ['type', 'level', 'timestamp'] as const;

/**
 * Keeps only interface and navigation breadcrumbs, rebuilt from content-free fields.
 * UI breadcrumbs lose the SDK's element description (a DOM path that includes
 * aria-label, title, name, and alt values; map passages and reader controls carry
 * passage titles there). Navigation breadcrumbs keep URLs cut to origin + path, which
 * drops the passage fragment. Every other category is dropped: console and network
 * breadcrumbs can carry prose or node IDs, and `sentry.*` breadcrumbs repeat earlier
 * error messages.
 */
export function redactBreadcrumb(breadcrumb: RedactableBreadcrumb): RedactableBreadcrumb | null {
  const category = typeof breadcrumb.category === 'string' ? breadcrumb.category : '';
  const isUi = UI_BREADCRUMB_CATEGORIES.has(category);
  if (!isUi && category !== 'navigation') {
    return null;
  }
  const kept: RedactableBreadcrumb = { category, ...pickScalars(breadcrumb, BREADCRUMB_SCALARS) };
  if (category === 'navigation' && isRecord(breadcrumb.data)) {
    const data: Record<string, unknown> = {};
    for (const key of ['from', 'to'] as const) {
      const url = breadcrumb.data[key];
      if (typeof url === 'string') {
        data[key] = redactUrl(url);
      }
    }
    if (Object.keys(data).length > 0) {
      kept.data = data;
    }
  }
  return kept;
}

/**
 * Builds the outgoing error event from an allowlist of reviewed fields rather than
 * deleting known-sensitive ones, so a field the SDK adds later (tags, fingerprints,
 * frame source context, nested context values, user or request detail) is dropped by
 * default. What survives is enough to act on: the error type and scrubbed message, the
 * stack (file, function, line, column), release and environment labels, coarse
 * browser/OS facts, the page URL cut to origin + path, debug-ID images for private
 * source maps, and content-free interface breadcrumbs.
 */
export function redactEvent(event: RedactableEvent): RedactableEvent {
  const redacted: RedactableEvent = { ...pickScalars(event, EVENT_FIELDS) };

  if (typeof event.message === 'string') {
    redacted.message = redactMessage(event.message);
  }
  const exception = redactException(event.exception);
  if (exception) {
    redacted.exception = exception;
  }
  const url = isRecord(event.request) ? event.request.url : undefined;
  if (typeof url === 'string') {
    redacted.request = { url: redactUrl(url) };
  }
  if (Array.isArray(event.breadcrumbs)) {
    redacted.breadcrumbs = event.breadcrumbs
      .filter(isRecord)
      .map(redactBreadcrumb)
      .filter((crumb): crumb is RedactableBreadcrumb => crumb !== null);
  }
  const contexts = redactContexts(event.contexts);
  if (contexts) {
    redacted.contexts = contexts;
  }
  const sdk = pickScalars(event.sdk, ['name', 'version']);
  if (sdk) {
    redacted.sdk = sdk;
  }
  const debugMeta = redactDebugMeta(event.debug_meta);
  if (debugMeta) {
    redacted.debug_meta = debugMeta;
  }

  return redacted;
}

/**
 * Builds an example **redacted** report for the reader-facing preview in Settings. It
 * starts from a payload that deliberately contains a reading-position URL, passage
 * identifiers, a quoted save fragment, tags, frame source context, console and
 * `sentry.event` breadcrumbs, a fake save blob, and locale data, then runs the same
 * redaction as a real report, so the reader sees which kinds of fields survive.
 */
export function buildSampleRedactedEvent(): RedactableEvent {
  const sample: RedactableEvent = {
    level: 'error',
    platform: 'javascript',
    release: 'narramorph@<app-version>',
    environment: 'production',
    exception: {
      values: [
        {
          type: 'Error',
          value:
            'No variation file found for node: arch-L2-accept while reading "would-be-removed save fragment"',
          mechanism: { type: 'onerror', handled: false, data: { note: 'would-be-removed' } },
          stacktrace: {
            frames: [
              {
                filename: 'https://example.invalid/assets/index.js?v=would-be-removed',
                function: 'openPassage',
                lineno: 1,
                colno: 4821,
                in_app: true,
                context_line: 'would-be-removed source line',
                vars: { passage: 'would-be-removed' },
              },
            ],
          },
        },
      ],
    },
    request: {
      url: 'https://example.invalid/reader#/passage/arch-L4?visit=3',
      headers: { Referer: 'would-be-removed referrer' },
    },
    user: { id: 'would-be-removed', ip_address: '{{auto}}' },
    tags: { passage: 'would-be-removed' },
    fingerprint: ['would-be-removed'],
    breadcrumbs: [
      { category: 'console', level: 'log', message: 'would-be-removed console line' },
      { category: 'sentry.event', message: 'would-be-removed earlier error message' },
      { category: 'navigation', data: { from: '/#/passage/algo-L1', to: '/#/passage/algo-L2' } },
      {
        category: 'ui.click',
        message: 'button.passage[aria-label="would-be-removed passage title"]',
      },
    ],
    extra: { save: '{would-be-removed local save blob}', prose: 'would-be-removed passage text' },
    contexts: {
      browser: { name: 'Firefox', version: '140', extensions: 'would-be-removed' },
      culture: { locale: 'would-be-removed', timezone: 'would-be-removed' },
      state: { progress: 'would-be-removed' },
    },
  };

  return redactEvent(sample);
}
