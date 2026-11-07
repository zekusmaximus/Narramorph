import { describe, expect, it } from 'vitest';

import {
  buildSampleRedactedEvent,
  redactStoryIdentifiers,
  redactBreadcrumb,
  redactEvent,
  redactMessage,
  redactUrl,
  type RedactableEvent,
} from './errorRedaction';

/** Marks every value that must not survive redaction. */
const SENTINEL = 'SENTINEL-must-not-leave-device';

describe('redactUrl', () => {
  it('strips the passage hash and query to origin + path', () => {
    expect(redactUrl('https://site.example/reader#/passage/arch-L4?visit=3')).toBe(
      'https://site.example/reader',
    );
  });

  it('strips relative/opaque references at the first # or ?', () => {
    expect(redactUrl('/reader#/passage/algo-L1')).toBe('/reader');
    expect(redactUrl('/reader?story=eternal-return')).toBe('/reader');
  });

  it('passes an absent URL through', () => {
    expect(redactUrl(undefined)).toBeUndefined();
  });
});

describe('redactBreadcrumb', () => {
  it('drops console / xhr / fetch breadcrumbs entirely', () => {
    expect(redactBreadcrumb({ category: 'console', message: 'log' })).toBeNull();
    expect(redactBreadcrumb({ category: 'xhr' })).toBeNull();
    expect(redactBreadcrumb({ category: 'fetch' })).toBeNull();
  });

  it('strips navigation breadcrumb URLs to the path', () => {
    const crumb = redactBreadcrumb({
      category: 'navigation',
      data: { from: '/#/passage/a', to: '/#/passage/b' },
    });
    expect(crumb?.data).toEqual({ from: '/', to: '/' });
  });

  it('keeps UI breadcrumbs but drops the element description', () => {
    const crumb = redactBreadcrumb({
      category: 'ui.click',
      type: 'default',
      level: 'info',
      timestamp: 1_700_000_000,
      message: 'div.map > button.passage[aria-label="First Documentation"][title="Open passage"]',
      data: { componentName: 'CustomStoryNode' },
    });

    expect(crumb).toEqual({
      category: 'ui.click',
      type: 'default',
      level: 'info',
      timestamp: 1_700_000_000,
    });
  });

  it('drops the element description from every UI breadcrumb category', () => {
    const crumb = redactBreadcrumb({
      category: 'ui.input',
      message: 'input[name="journey-title"]',
    });

    expect(crumb).toEqual({ category: 'ui.input' });
  });
});

describe('redactStoryIdentifiers', () => {
  it('replaces passage, variation, and ending identifiers', () => {
    expect(redactStoryIdentifiers('No variation file found for node: arch-L2-accept')).toBe(
      'No variation file found for node: [passage]',
    );
    expect(redactStoryIdentifiers('Invalid L3 metadata for algo-L3-001 in layer3')).toBe(
      'Invalid L3 metadata for [passage] in layer3',
    );
    expect(redactStoryIdentifiers('hum-L1-001-b0-return then final-release')).toBe(
      '[passage] then [passage]',
    );
  });

  it('leaves ordinary error text alone', () => {
    const text = "Cannot read properties of undefined (reading 'L2') in eternal-return";
    expect(redactStoryIdentifiers(text)).toBe(text);
  });
});

describe('redactEvent — acceptance: no sensitive reading content leaves the device', () => {
  it('removes story identifiers from the event message and exception values', () => {
    const redacted = redactEvent({
      message: 'Condition context unavailable for node: final-preserve',
      exception: {
        values: [
          { type: 'Error', value: 'No variation file found for node: conv-L3' },
          { type: 'TypeError' },
        ],
      },
    });

    expect(redacted.message).toBe('Condition context unavailable for node: [passage]');
    expect(redacted.exception?.values).toEqual([
      { type: 'Error', value: 'No variation file found for node: [passage]' },
      { type: 'TypeError' },
    ]);
  });

  it('strips URL hash, identity, extra, console breadcrumbs, and non-allowlisted contexts', () => {
    const event = {
      release: 'narramorph@0.1.0',
      exception: { values: [{ type: 'TypeError', value: 'boom' }] },
      request: {
        url: 'https://s.example/r#/passage/arch-L4',
        cookies: { a: 'b' },
        headers: { x: 'y' },
        data: 'request-body',
        query_string: 'q=1',
      },
      user: { id: 'reader-1', ip_address: '1.2.3.4' },
      server_name: 'host',
      extra: { save: '<local-save-blob>', prose: 'passage text the reader saw' },
      breadcrumbs: [
        { category: 'console', message: 'console line' },
        { category: 'navigation', data: { from: '/#/passage/x', to: '/#/passage/y' } },
      ],
      contexts: { browser: { name: 'Firefox' }, state: { progress: 'secret' } },
    } as unknown as RedactableEvent;

    const redacted = redactEvent(event);

    // Actionable fields survive.
    expect(redacted.release).toBe('narramorph@0.1.0');
    expect(redacted.exception).toEqual(event.exception);

    // Sensitive fields are gone.
    expect(redacted.request?.url).toBe('https://s.example/r');
    expect(redacted.request).not.toHaveProperty('cookies');
    expect(redacted.request).not.toHaveProperty('headers');
    expect(redacted.request).not.toHaveProperty('data');
    expect(redacted.request).not.toHaveProperty('query_string');
    expect(redacted.user).toBeUndefined();
    expect(redacted.server_name).toBeUndefined();
    expect(redacted.extra).toBeUndefined();

    // Console breadcrumb dropped; navigation URL stripped.
    expect(redacted.breadcrumbs).toHaveLength(1);
    expect(redacted.breadcrumbs?.[0]?.data).toEqual({ from: '/', to: '/' });

    // Only allowlisted contexts survive.
    expect(redacted.contexts).toHaveProperty('browser');
    expect(redacted.contexts).not.toHaveProperty('state');

    // Nothing in the serialized payload leaks prose, save, reading position, or identity.
    const serialized = JSON.stringify(redacted);
    expect(serialized).not.toContain('passage text the reader saw');
    expect(serialized).not.toContain('<local-save-blob>');
    expect(serialized).not.toContain('arch-L4');
    expect(serialized).not.toContain('reader-1');
    expect(serialized).not.toContain('1.2.3.4');
  });

  it('the reader-facing sample report contains no sensitive content', () => {
    const sample = buildSampleRedactedEvent();
    const serialized = JSON.stringify(sample);
    expect(serialized).not.toContain('would-be-removed');
    expect(serialized).not.toContain('passage/arch-L4');
    expect(sample.breadcrumbs).toContainEqual({ category: 'ui.click' });
    expect(sample.user).toBeUndefined();
    expect(sample.extra).toBeUndefined();
    expect(sample.request?.url).toBe('https://example.invalid/reader');
  });
});

describe('redactMessage', () => {
  it('replaces quoted fragments, which JSON and similar errors copy from their input', () => {
    expect(redactMessage(`Unexpected token 'x', "{\\"journey\\": 1" is not valid JSON`)).toBe(
      `Unexpected token 'x', "[…]" is not valid JSON`,
    );
    expect(redactMessage(`Unexpected token 'j', "{"journey": 1}" is not valid JSON`)).toBe(
      `Unexpected token 'j', "[…]" is not valid JSON`,
    );
    expect(redactMessage('Cannot parse "my saved journey" at position 4')).toBe(
      'Cannot parse "[…]" at position 4',
    );
  });

  it('cuts URLs to origin and path and replaces story identifiers', () => {
    expect(
      redactMessage(
        'Failed to load https://site.example/reader#/passage/hum-L2-resist?x=1 (arch-L1)',
      ),
    ).toBe('Failed to load https://site.example/reader ([passage])');
  });

  it('truncates long messages', () => {
    const redacted = redactMessage('a'.repeat(1000));
    expect(redacted).toHaveLength(301);
    expect(redacted.endsWith('…')).toBe(true);
  });

  it('leaves ordinary error text alone', () => {
    const text = "Cannot read properties of undefined (reading 'title')";
    expect(redactMessage(text)).toBe(text);
  });
});

describe('redactBreadcrumb allowlist', () => {
  it('drops every category except interface and navigation breadcrumbs', () => {
    for (const category of ['sentry.event', 'sentry.transaction', 'history', 'custom', '']) {
      expect(redactBreadcrumb({ category, message: SENTINEL })).toBeNull();
    }
    expect(redactBreadcrumb({ message: SENTINEL })).toBeNull();
  });

  it('keeps only content-free fields on a navigation breadcrumb', () => {
    expect(
      redactBreadcrumb({
        category: 'navigation',
        level: 'info',
        timestamp: 1,
        message: SENTINEL,
        data: { from: '/#/passage/a', to: '/#/passage/b', extra: SENTINEL },
      }),
    ).toEqual({
      category: 'navigation',
      level: 'info',
      timestamp: 1,
      data: { from: '/', to: '/' },
    });
  });
});

describe('redactEvent allowlist — a complete SDK-shaped event', () => {
  const fullEvent = {
    event_id: 'abc123',
    timestamp: 1_700_000_000,
    platform: 'javascript',
    level: 'error',
    environment: 'production',
    release: 'narramorph@0.1.1',
    dist: '1',
    server_name: SENTINEL,
    logger: SENTINEL,
    transaction: `/reader#/passage/${SENTINEL}`,
    fingerprint: [SENTINEL],
    tags: { passage: SENTINEL },
    extra: { save: SENTINEL },
    user: { id: SENTINEL, ip_address: SENTINEL, email: SENTINEL },
    modules: { [SENTINEL]: '1.0.0' },
    logentry: { message: SENTINEL, params: [SENTINEL] },
    message: `Render failed for "${SENTINEL}" at arch-L3`,
    customField: SENTINEL,
    sdk: {
      name: 'sentry.javascript.browser',
      version: '10.68.0',
      integrations: [SENTINEL],
      packages: [{ name: SENTINEL, version: '1' }],
    },
    sdkProcessingMetadata: { normalizedRequest: { url: SENTINEL } },
    request: {
      url: `https://narramorph.com/#/passage/${SENTINEL}`,
      headers: { Referer: SENTINEL, 'User-Agent': SENTINEL },
      cookies: SENTINEL,
      data: SENTINEL,
      query_string: SENTINEL,
    },
    exception: {
      values: [
        {
          type: 'TypeError',
          value: `Cannot read "${SENTINEL}" of undefined`,
          module: SENTINEL,
          mechanism: { type: 'onerror', handled: false, data: { element: SENTINEL } },
          stacktrace: {
            frames: [
              {
                filename: `https://narramorph.com/assets/index-abc.js?${SENTINEL}`,
                abs_path: `https://narramorph.com/assets/index-abc.js#${SENTINEL}`,
                function: 'renderPassage',
                lineno: 1,
                colno: 4821,
                in_app: true,
                module: SENTINEL,
                context_line: SENTINEL,
                pre_context: [SENTINEL],
                post_context: [SENTINEL],
                vars: { prose: SENTINEL },
              },
            ],
            frames_omitted: [SENTINEL],
          },
        },
      ],
    },
    breadcrumbs: [
      { category: 'console', message: SENTINEL },
      { category: 'fetch', data: { url: SENTINEL } },
      { category: 'sentry.event', message: SENTINEL, event_id: SENTINEL },
      { category: 'ui.click', message: `button[aria-label="${SENTINEL}"]`, data: { x: SENTINEL } },
    ],
    contexts: {
      browser: { name: 'Chrome', version: '150', [SENTINEL]: SENTINEL },
      os: { name: 'macOS', version: '26', build: SENTINEL },
      device: { family: 'Desktop', model: SENTINEL },
      runtime: { name: 'browser', version: SENTINEL.length },
      trace: { trace_id: 'trace-1', span_id: 'span-1', data: { route: SENTINEL } },
      culture: { locale: SENTINEL, timezone: SENTINEL },
      state: { progress: SENTINEL },
    },
    debug_meta: {
      images: [
        {
          type: 'sourcemap',
          debug_id: 'debug-1',
          code_file: `https://narramorph.com/assets/index-abc.js?${SENTINEL}`,
          [SENTINEL]: SENTINEL,
        },
      ],
    },
  } as unknown as RedactableEvent;

  it('transmits no field outside the allowlist', () => {
    expect(JSON.stringify(redactEvent(fullEvent))).not.toContain(SENTINEL);
  });

  it('keeps the fields needed to act on the report', () => {
    expect(redactEvent(fullEvent)).toEqual({
      event_id: 'abc123',
      timestamp: 1_700_000_000,
      platform: 'javascript',
      level: 'error',
      environment: 'production',
      release: 'narramorph@0.1.1',
      dist: '1',
      message: 'Render failed for "[…]" at [passage]',
      sdk: { name: 'sentry.javascript.browser', version: '10.68.0' },
      request: { url: 'https://narramorph.com/' },
      exception: {
        values: [
          {
            type: 'TypeError',
            value: 'Cannot read "[…]" of undefined',
            mechanism: { type: 'onerror', handled: false },
            stacktrace: {
              frames: [
                {
                  filename: 'https://narramorph.com/assets/index-abc.js',
                  abs_path: 'https://narramorph.com/assets/index-abc.js',
                  function: 'renderPassage',
                  lineno: 1,
                  colno: 4821,
                  in_app: true,
                },
              ],
            },
          },
        ],
      },
      breadcrumbs: [{ category: 'ui.click' }],
      contexts: {
        browser: { name: 'Chrome', version: '150' },
        os: { name: 'macOS', version: '26' },
        device: { family: 'Desktop' },
        runtime: { name: 'browser', version: SENTINEL.length },
        trace: { trace_id: 'trace-1', span_id: 'span-1' },
      },
      debug_meta: {
        images: [
          {
            type: 'sourcemap',
            debug_id: 'debug-1',
            code_file: 'https://narramorph.com/assets/index-abc.js',
          },
        ],
      },
    });
  });

  it('ignores malformed nested values instead of copying them', () => {
    const redacted = redactEvent({
      exception: {
        values: [SENTINEL, null, { type: 'Error', stacktrace: { frames: [SENTINEL] } }],
      },
      breadcrumbs: [SENTINEL, null],
      contexts: { browser: SENTINEL },
      request: { url: 42 },
      debug_meta: { images: [SENTINEL] },
    } as unknown as RedactableEvent);

    expect(JSON.stringify(redacted)).not.toContain(SENTINEL);
    expect(redacted.exception?.values).toEqual([{ type: 'Error', stacktrace: { frames: [] } }]);
  });
});
