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
