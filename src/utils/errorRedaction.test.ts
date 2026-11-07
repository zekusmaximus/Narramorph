import { describe, expect, it } from 'vitest';

import {
  buildSampleRedactedEvent,
  redactStoryIdentifiers,
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
