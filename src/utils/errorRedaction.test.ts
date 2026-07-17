import { describe, expect, it } from 'vitest';

import {
  buildSampleRedactedEvent,
  redactBreadcrumb,
  redactEvent,
  redactUrl,
  type RedactableEvent,
} from './errorRedaction';

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

  it('keeps benign UI breadcrumbs', () => {
    expect(redactBreadcrumb({ category: 'ui.click', message: 'settings' })).not.toBeNull();
  });
});

describe('redactEvent — acceptance: no sensitive reading content leaves the device', () => {
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
    expect(sample.user).toBeUndefined();
    expect(sample.extra).toBeUndefined();
    expect(sample.request?.url).toBe('https://example.invalid/reader');
  });
});
