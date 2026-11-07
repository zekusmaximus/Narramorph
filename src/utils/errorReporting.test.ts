import type * as SentryBrowser from '@sentry/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { gateTransportOnConsent, type GatedTransport } from './errorReporting';

interface SentryInitOptions {
  dsn: string;
  sendDefaultPii: boolean;
  sendClientReports: boolean;
  integrations: (defaults: { name: string }[]) => { name: string }[];
  transport: (options: unknown) => GatedTransport<string>;
  beforeSend: (event: Record<string, unknown>) => Record<string, unknown> | null;
}

const createBaseTransport = () => ({
  send: vi.fn((_envelope: string) => Promise.resolve({ statusCode: 200 })),
  flush: vi.fn((_timeout?: number) => Promise.resolve(true)),
});

describe('gateTransportOnConsent', () => {
  it('forwards envelopes only while consent is on, checked at send time', async () => {
    const base = createBaseTransport();
    let consented = true;
    const gated = gateTransportOnConsent(base, () => consented);

    await expect(gated.send('first')).resolves.toEqual({ statusCode: 200 });
    consented = false;
    await expect(gated.send('queued-after-revocation')).resolves.toEqual({});
    consented = true;
    await gated.send('after-re-enable');

    expect(base.send.mock.calls.map(([envelope]) => envelope)).toEqual([
      'first',
      'after-re-enable',
    ]);
  });

  it('delegates flush to the underlying transport', async () => {
    const base = createBaseTransport();
    const gated = gateTransportOnConsent(base, () => false);

    await expect(gated.flush(500)).resolves.toBe(true);
    expect(base.flush).toHaveBeenCalledWith(500);
  });
});

describe('Sentry initialization', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('VITE_SENTRY_DSN', 'https://public@o1.ingest.us.sentry.io/1');
  });

  afterEach(() => {
    vi.doUnmock('@sentry/browser');
    vi.unstubAllEnvs();
  });

  it('configures error reports only, behind the consent gate', async () => {
    const base = createBaseTransport();
    const init = vi.fn();
    vi.doMock('@sentry/browser', () => ({
      init,
      captureException: vi.fn(),
      makeFetchTransport: vi.fn(() => base),
    }));

    const reporting = await import('./errorReporting');
    await reporting.enableErrorReporting();

    expect(init).toHaveBeenCalledTimes(1);
    const options = init.mock.calls[0]?.[0] as SentryInitOptions;
    expect(options.sendDefaultPii).toBe(false);
    expect(options.sendClientReports).toBe(false);
    expect(
      options.integrations([
        { name: 'BrowserSession' },
        { name: 'GlobalHandlers' },
        { name: 'Breadcrumbs' },
      ]),
    ).toEqual([{ name: 'GlobalHandlers' }, { name: 'Breadcrumbs' }]);

    const transport = options.transport({});
    await transport.send('error-envelope');
    expect(base.send).toHaveBeenCalledTimes(1);

    reporting.disableErrorReporting();
    await transport.send('session-envelope');
    expect(base.send).toHaveBeenCalledTimes(1);
    expect(options.beforeSend({ message: 'after revocation' })).toBeNull();
  });

  it('does not reject when the SDK fails to load, and retries on the next opt-in', async () => {
    let attempts = 0;
    const init = vi.fn();
    vi.doMock('@sentry/browser', () => {
      attempts += 1;
      if (attempts === 1) {
        throw new Error('chunk load failed');
      }
      return { init, captureException: vi.fn(), makeFetchTransport: vi.fn() };
    });

    const reporting = await import('./errorReporting');
    await expect(reporting.enableErrorReporting()).resolves.toBeUndefined();
    expect(init).not.toHaveBeenCalled();

    vi.resetModules();
    await reporting.enableErrorReporting();
    expect(init).toHaveBeenCalledTimes(1);
  });
});

describe('real SDK: complete outgoing envelopes', () => {
  const SENTINEL = 'SENTINEL-must-not-leave-device';

  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('VITE_SENTRY_DSN', 'https://public@o1.ingest.us.sentry.io/1');
  });

  afterEach(() => {
    vi.doUnmock('@sentry/browser');
    vi.unstubAllEnvs();
    window.history.replaceState({}, '', '/');
  });

  it('sends only redacted error envelopes, and nothing after consent is withdrawn', async () => {
    const sent: unknown[] = [];
    vi.doMock('@sentry/browser', async (importOriginal) => {
      const actual = await importOriginal<typeof SentryBrowser>();
      return {
        ...actual,
        makeFetchTransport: () => ({
          send: (envelope: unknown) => {
            sent.push(envelope);
            return Promise.resolve({ statusCode: 200 });
          },
          flush: () => Promise.resolve(true),
        }),
      };
    });
    const Sentry = await import('@sentry/browser');
    const reporting = await import('./errorReporting');
    await reporting.enableErrorReporting();

    // Everything the SDK or app state could attach to a report, each carrying the sentinel.
    Sentry.setTag('passage', SENTINEL);
    Sentry.setUser({ id: SENTINEL, email: SENTINEL });
    Sentry.setExtra('save', SENTINEL);
    Sentry.setContext('state', { progress: SENTINEL });
    Sentry.addBreadcrumb({ category: 'console', message: SENTINEL });
    Sentry.addBreadcrumb({ category: 'ui.click', message: `button[aria-label="${SENTINEL}"]` });
    window.history.pushState({}, '', `/#/passage/${SENTINEL}`);

    reporting.reportError(new Error(`Render failed for "${SENTINEL}" at arch-L2-accept`));
    await Sentry.flush(2000);

    const serialized = JSON.stringify(sent);
    expect(sent.length).toBeGreaterThan(0);
    expect(serialized).toContain('Render failed for');
    expect(serialized).not.toContain(SENTINEL);
    expect(serialized).not.toContain('arch-L2-accept');
    expect(serialized).not.toContain('"type":"session"');
    expect(serialized).not.toContain('"type":"client_report"');

    // After revocation nothing leaves, even an error captured straight through the SDK.
    sent.length = 0;
    reporting.disableErrorReporting();
    Sentry.captureException(new Error('captured after revocation'));
    window.history.pushState({}, '', '/#/passage/another');
    await Sentry.flush(2000);
    expect(sent).toEqual([]);

    await Sentry.close();
  });
});
